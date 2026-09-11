"""
caching.py — Caché en proceso con TTL y decorador para FastAPI (TrackFlow).

Proporciona:
  - TTLCache: clase thread-safe con almacenamiento en dict + expiración temporal.
  - @cached(ttl=N): decorador para endpoints GET de FastAPI.
  - invalidate(pattern): invalidación manual de claves por patrón.

Uso en endpoints GET:
    from caching import cached

    @router.get("/products")
    @cached(ttl=30)
    async def list_products(request: Request, ...):
        ...

Uso en endpoints de escritura (invalidación):
    from caching import invalidate

    @router.post("/orders/inbound")
    async def create_inbound_order(...):
        invalidate("GET:/inventory/products")
        invalidate("GET:/inventory/orders")
        ...

Arquitectura:
  - Caché en proceso (un solo dict compartido): adecuado para single-instancia.
  - TTL basado en time.monotonic() para precisión sin dependencia del reloj del sistema.
  - Thread-safe mediante threading.Lock.
  - No almacena respuestas de streaming ni datos que no sean serializables.
"""

import time
import threading
from functools import wraps
from typing import Any, Callable, Optional

from fastapi import Request


# ════════════════════════════════════════════════════════════
#  TTLCache
# ════════════════════════════════════════════════════════════

class TTLCache:
    """Caché en memoria con expiración por TTL y acceso thread-safe.

    Cada entrada almacena el momento de expiración (time.monotonic) junto
    con el valor. Las lecturas comprueban expiración y eliminan entradas
    vencidas de forma perezosa (lazy eviction).
    """

    def __init__(self) -> None:
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        """Retorna el valor si existe y no ha expirado, None en otro caso."""
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            expires_at, value = entry
            if time.monotonic() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: float) -> None:
        """Almacena un valor con tiempo de vida `ttl` en segundos."""
        with self._lock:
            self._store[key] = (time.monotonic() + ttl, value)

    def invalidate(self, key: str) -> None:
        """Elimina una clave específica de la caché."""
        with self._lock:
            self._store.pop(key, None)

    def invalidate_pattern(self, pattern: str) -> None:
        """Elimina todas las claves que comiencen con `pattern`."""
        with self._lock:
            keys_to_delete = [k for k in self._store if k.startswith(pattern)]
            for k in keys_to_delete:
                del self._store[k]

    def clear(self) -> None:
        """Vacía toda la caché."""
        with self._lock:
            self._store.clear()

    @property
    def size(self) -> int:
        """Número de entradas en la caché (incluye expiradas no limpiadas)."""
        with self._lock:
            return len(self._store)


# ── Instancia global (singleton) ──
_cache = TTLCache()


# ════════════════════════════════════════════════════════════
#  Decorador @cached
# ════════════════════════════════════════════════════════════

def cached(ttl: float = 30.0) -> Callable:
    """Decorador para cachear respuestas de endpoints FastAPI (solo GET).

    La clave de caché se construye como:
        {METHOD}:{url.path}?{query_string}

    Solo cachea peticiones GET. El resto pasan directamente a la función.

    Args:
        ttl: Tiempo de vida en segundos (por defecto 30s).

    Usage:
        @router.get("/products")
        @cached(ttl=30)
        async def list_products(request: Request, ...):
            ...

    Nota: El parámetro `request: Request` debe estar presente en la
    firma del endpoint para que FastAPI lo inyecte y podamos derivar
    la clave de caché. Si no está presente, se usa el nombre de la
    función como clave (menos preciso).
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Solo cachear GET
            request: Optional[Request] = kwargs.get("request")
            if request is not None and request.method != "GET":
                return await func(*args, **kwargs)

            # Construir clave de caché
            if request is not None:
                cache_key = f"{request.method}:{request.url.path}"
                if request.url.query:
                    cache_key += f"?{request.url.query}"
            else:
                cache_key = f"GET:{func.__name__}"

            # Intentar recuperar de caché
            cached_value = _cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Ejecutar función y cachear resultado
            result = await func(*args, **kwargs)
            _cache.set(cache_key, result, ttl)
            return result

        return wrapper
    return decorator


# ════════════════════════════════════════════════════════════
#  Invalidación (para usar desde endpoints de escritura)
# ════════════════════════════════════════════════════════════

def invalidate(pattern: str) -> None:
    """Invalida todas las claves de caché que comiencen con `pattern`.

    Uso típico desde un endpoint POST/PUT/PATCH/DELETE:
        invalidate("GET:/inventory/products")
        invalidate("GET:/inventory/orders")
    """
    _cache.invalidate_pattern(pattern)


def invalidate_exact(key: str) -> None:
    """Invalida una clave exacta de caché."""
    _cache.invalidate(key)


def clear_cache() -> None:
    """Vacía toda la caché (util en tests o resets)."""
    _cache.clear()