"""Small process-local sliding-window limiter for expensive agent requests.

Production deployments with multiple workers/replicas should replace the in-memory
store with a shared atomic backend (for example Redis).
"""

from __future__ import annotations

import os
import hashlib
import threading
import time
from collections import defaultdict, deque
from math import ceil

from fastapi import HTTPException, Request


class SlidingWindowRateLimiter:
    def __init__(self, limit: int, window_seconds: float, *, clock=time.monotonic):
        if limit < 1 or window_seconds <= 0:
            raise ValueError("Rate limit and window must be positive")
        self.limit = limit
        self.window_seconds = window_seconds
        self._clock = clock
        self._lock = threading.Lock()
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._checks_since_cleanup = 0

    def check(self, key: str) -> bool:
        now = self._clock()
        cutoff = now - self.window_seconds
        with self._lock:
            self._checks_since_cleanup += 1
            if self._checks_since_cleanup >= 256:
                self._checks_since_cleanup = 0
                for actor, actor_hits in tuple(self._hits.items()):
                    while actor_hits and actor_hits[0] <= cutoff:
                        actor_hits.popleft()
                    if not actor_hits:
                        self._hits.pop(actor, None)
            hits = self._hits[key]
            while hits and hits[0] <= cutoff:
                hits.popleft()
            if len(hits) >= self.limit:
                return False
            hits.append(now)
            return True

    def retry_after(self) -> int:
        """Return a conservative Retry-After value for the configured window."""
        return max(1, ceil(self.window_seconds))


class RedisSlidingWindowRateLimiter:
    """Cross-process sliding window using one atomic Redis Lua operation."""

    _CHECK_SCRIPT = """
local key = KEYS[1]
local sequence_key = KEYS[2]
local limit = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local now = redis.call('TIME')
local now_ms = (tonumber(now[1]) * 1000) + math.floor(tonumber(now[2]) / 1000)
local cutoff = now_ms - window_ms
redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)
local count = redis.call('ZCARD', key)
if count >= limit then
  local first = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retry_ms = math.max(1, tonumber(first[2]) + window_ms - now_ms)
  redis.call('PEXPIRE', key, window_ms)
  return {0, retry_ms}
end
local member = tostring(now_ms) .. ':' .. tostring(redis.call('INCR', sequence_key))
redis.call('ZADD', key, now_ms, member)
redis.call('PEXPIRE', key, window_ms)
redis.call('PEXPIRE', sequence_key, window_ms)
return {1, 0}
"""

    def __init__(self, limit: int, window_seconds: float, redis_client):
        if limit < 1 or window_seconds <= 0:
            raise ValueError("Rate limit and window must be positive")
        self.limit = limit
        self.window_seconds = window_seconds
        self._window_ms = max(1, ceil(window_seconds * 1000))
        self._redis = redis_client

    def check(self, key: str) -> bool:
        # Do not store actor IDs in Redis keys; the digest is stable across workers.
        actor_digest = hashlib.sha256(str(key).encode("utf-8")).hexdigest()
        # The hash tag ensures both script keys share a Redis Cluster slot.
        redis_key = f"trackflow:support-agent:rate:v1:{{{actor_digest}}}:hits"
        sequence_key = f"trackflow:support-agent:rate:v1:{{{actor_digest}}}:sequence"
        try:
            allowed, _retry_ms = self._redis.eval(
                self._CHECK_SCRIPT, 2, redis_key, sequence_key, self.limit, self._window_ms,
            )
        except Exception as exc:
            # Never silently degrade a configured shared limiter to process-local
            # state; the caller will return a service-unavailable response.
            raise RuntimeError("Shared support-agent rate limiter unavailable") from exc
        return bool(int(allowed))

    def retry_after(self) -> int:
        return max(1, ceil(self.window_seconds))


def _configured_limiter() -> SlidingWindowRateLimiter | RedisSlidingWindowRateLimiter:
    try:
        limit = int(os.getenv("SUPPORT_AGENT_RATE_LIMIT", "20"))
        window_seconds = float(os.getenv("SUPPORT_AGENT_RATE_WINDOW_SECONDS", "60"))
    except ValueError as exc:
        raise RuntimeError("Invalid support agent rate-limit configuration") from exc
    redis_url = os.getenv("SUPPORT_AGENT_RATE_LIMIT_REDIS_URL") or os.getenv("REDIS_URL")
    if redis_url:
        try:
            from redis import Redis

            client = Redis.from_url(
                redis_url, socket_connect_timeout=1, socket_timeout=1,
                health_check_interval=30,
            )
        except Exception as exc:
            raise RuntimeError("Could not configure shared support-agent rate limiter") from exc
        return RedisSlidingWindowRateLimiter(limit, window_seconds, client)
    return SlidingWindowRateLimiter(limit, window_seconds)


limiter = _configured_limiter()


def enforce_actor_rate_limit(actor_id: str | int) -> None:
    """Raise the standard 429 response when an authenticated actor is over quota."""
    try:
        allowed = limiter.check(str(actor_id))
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail={"message": "El control temporal de consultas no está disponible."},
            headers={"Retry-After": "1"},
        ) from exc
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={"message": "Has alcanzado el límite temporal de consultas al agente. Inténtalo de nuevo más tarde."},
            headers={"Retry-After": str(limiter.retry_after())},
        )


def enforce_agent_rate_limit(request: Request) -> None:
    """Limit model-triggering requests by authenticated actor, failing closed."""
    user = getattr(request.state, "current_user", None)
    actor_id = user.get("id") if isinstance(user, dict) else None
    if actor_id is None:
        # Authentication should run before this check; fail closed if a host
        # mounts the adapter without the normal authenticated dependency.
        raise HTTPException(
            status_code=401,
            detail={"message": "Debes iniciar sesión con una cuenta activa para consultar datos de TrackFlow."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    enforce_actor_rate_limit(actor_id)