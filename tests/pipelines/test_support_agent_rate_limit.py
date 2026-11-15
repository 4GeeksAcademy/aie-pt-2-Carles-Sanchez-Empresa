from fastapi import FastAPI
from fastapi.testclient import TestClient
from fastapi import HTTPException
import pytest

from support_agent import rate_limit as rate_limit_module
from support_agent.rate_limit import SlidingWindowRateLimiter


class Clock:
    def __init__(self):
        self.value = 0.0

    def __call__(self):
        return self.value


def test_sliding_window_limiter_is_per_actor_and_expires_entries():
    clock = Clock()
    limiter = SlidingWindowRateLimiter(2, 10, clock=clock)

    assert limiter.check("actor-a")
    assert limiter.check("actor-a")
    assert not limiter.check("actor-a")
    assert limiter.check("actor-b")
    assert limiter.retry_after() == 10

    clock.value = 10.1
    assert limiter.check("actor-a")


def test_limiter_periodically_removes_inactive_actor_keys():
    clock = Clock()
    limiter = SlidingWindowRateLimiter(1, 1, clock=clock)
    assert limiter.check("temporary-actor")
    clock.value = 2
    for index in range(255):
        assert limiter.check(f"actor-{index}")
    assert "temporary-actor" not in limiter._hits


def test_retry_after_rounds_fractional_window_up():
    assert SlidingWindowRateLimiter(1, 1.2).retry_after() == 2


def test_redis_limiter_uses_atomic_script_and_does_not_expose_actor_id():
    class FakeRedis:
        def __init__(self):
            self.calls = []

        def eval(self, script, key_count, *args):
            self.calls.append((script, key_count, args))
            return [1, 0]

    redis = FakeRedis()
    limiter = rate_limit_module.RedisSlidingWindowRateLimiter(3, 60, redis)
    assert limiter.check("customer@example.test")
    assert len(redis.calls) == 1
    script, key_count, args = redis.calls[0]
    assert "ZREMRANGEBYSCORE" in script and "redis.call('TIME')" in script
    assert key_count == 2
    assert len(args) == 4
    assert "customer@example.test" not in str(args)
    assert limiter.retry_after() == 60


def test_redis_limiter_fails_closed_if_shared_store_fails():
    class FailingRedis:
        def eval(self, *_args):
            raise OSError("backend unavailable")

    limiter = rate_limit_module.RedisSlidingWindowRateLimiter(1, 60, FailingRedis())
    with pytest.raises(RuntimeError, match="Shared support-agent rate limiter unavailable"):
        limiter.check("actor-1")


def test_knowledge_query_rejects_oversized_questions():
    from api.routes.knowledge import KnowledgeQueryRequest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        KnowledgeQueryRequest(question="x" * 10001)


def test_knowledge_rate_limit_is_per_authenticated_actor(monkeypatch):
    from api.routes import knowledge

    limiter = SlidingWindowRateLimiter(1, 60)
    monkeypatch.setattr(rate_limit_module, "limiter", limiter)
    knowledge.enforce_actor_rate_limit(31)

    with pytest.raises(HTTPException) as raised:
        knowledge.enforce_actor_rate_limit(31)
    assert raised.value.status_code == 429

    knowledge.enforce_actor_rate_limit(32)


def test_agent_query_returns_429_before_running_graph(monkeypatch, tmp_path):
    pytest.importorskip("langchain_core")
    pytest.importorskip("langgraph")
    from support_agent import api as agent_api

    limiter = SlidingWindowRateLimiter(1, 60)
    monkeypatch.setattr(rate_limit_module, "limiter", limiter)

    class Runtime:
        def __init__(self):
            self.calls = 0

        def run(self, *args, **kwargs):
            self.calls += 1
            return {
                "answer": "respuesta de prueba", "error": None,
                "run_id": "run-test", "thread_id": "thread-test",
            }

    runtime = Runtime()
    application = FastAPI()
    application.state.support_agent = runtime

    @application.middleware("http")
    async def authenticated_test_user(request, call_next):
        request.state.current_user = {"id": 71, "role": "user"}
        return await call_next(request)

    application.include_router(agent_api.router)
    with TestClient(application) as client:
        first = client.post("/agent/query", json={"question": "Primera consulta"})
        blocked = client.post("/agent/query", json={"question": "Segunda consulta"})

    assert first.status_code == 200
    assert blocked.status_code == 429
    assert blocked.headers["retry-after"] == "60"
    assert runtime.calls == 1


def test_agent_query_fails_closed_without_authenticated_actor():
    pytest.importorskip("langchain_core")
    pytest.importorskip("langgraph")
    from support_agent import api as agent_api

    application = FastAPI()
    application.include_router(agent_api.router)

    with TestClient(application) as client:
        response = client.post("/agent/query", json={"question": "No identity"})

    assert response.status_code == 401
