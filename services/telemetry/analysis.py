"""
analysis.py — Pipeline de análisis de telemetría (TrackFlow).

Funciones de métrica que cargan datos de la tabla `telemetry_events`
en Supabase, los transforman con Pandas y devuelven resultados
serializables a JSON.

Cada función sigue el patrón:
    cargar (SQL) → refinar (Pandas) → convertir tipos → agrupar → agregar

Todas las funciones son puras: mismos parámetros → mismo resultado.
No hay efectos secundarios ni estado compartido.
"""

import logging
from datetime import datetime, timezone

import pandas as pd
from sqlalchemy import text

from database import engine

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════
#  Función auxiliar: ejecutar query y devolver DataFrame
# ══════════════════════════════════════════════════════════════

def _fetch_dataframe(query: str, params: dict) -> pd.DataFrame:
    """
    Ejecuta una query parametrizada y devuelve un DataFrame de Pandas.

    Args:
        query: Consulta SQL con parámetros nombrados (:param)
        params: Diccionario de parámetros para la query

    Returns:
        pd.DataFrame con los resultados, o DataFrame vacío si hay error
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query), params)
            rows = result.fetchall()
            if not rows:
                return pd.DataFrame()
            columns = result.keys()
            return pd.DataFrame(rows, columns=columns)
    except Exception as e:
        logger.error("Error executing query: %s", e)
        return pd.DataFrame()


# ══════════════════════════════════════════════════════════════
#  Métrica 1: Volumen de eventos por día y tipo
# ══════════════════════════════════════════════════════════════

def events_per_day(start_date: str, end_date: str) -> list[dict]:
    """
    Cuenta eventos por día y tipo de evento.

    Responde: ¿Cuántos eventos ocurren por día y tipo?

    Args:
        start_date: Fecha de inicio en formato ISO 8601 (inclusivo)
        end_date: Fecha de fin en formato ISO 8601 (exclusivo)

    Returns:
        Lista de dicts con keys: date, event_type, count
    """
    # 1. CARGAR (SQL) — solo las columnas necesarias
    query = """
        SELECT timestamp, event_type
        FROM telemetry_events
        WHERE timestamp >= :start_date
          AND timestamp < :end_date
    """
    df = _fetch_dataframe(query, {"start_date": start_date, "end_date": end_date})

    if df.empty:
        return []

    # 2. REFINAR (Pandas) — no hay campos de tags que extraer aquí

    # 3. CONVERTIR — timestamps a datetime con utc=True
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
    df = df.dropna(subset=["timestamp"])

    # 4. AGRUPAR — por día y tipo de evento
    df["date"] = df["timestamp"].dt.date
    grouped = df.groupby(["date", "event_type"]).size().reset_index(name="count")

    # 5. AGREGAR — ya está hecho con .size()

    # 6. SERVIR — serializar a lista de dicts
    result = grouped.to_dict(orient="records")

    # Convertir date a string para serialización JSON
    for row in result:
        row["date"] = str(row["date"])

    return result


# ══════════════════════════════════════════════════════════════
#  Métrica 2: Errores por tipo y día
# ══════════════════════════════════════════════════════════════

def error_events_by_type(start_date: str, end_date: str) -> list[dict]:
    """
    Cuenta eventos de error por tipo y día.

    Responde: ¿Qué tipos de error dominan y cuántos hay por día?

    Args:
        start_date: Fecha de inicio en formato ISO 8601 (inclusivo)
        end_date: Fecha de fin en formato ISO 8601 (exclusivo)

    Returns:
        Lista de dicts con keys: date, event_type, count
    """
    # 1. CARGAR (SQL) — solo eventos de la categoría 'errors'
    query = """
        SELECT timestamp, event_type
        FROM telemetry_events
        WHERE timestamp >= :start_date
          AND timestamp < :end_date
          AND service = 'errors'
    """
    df = _fetch_dataframe(query, {"start_date": start_date, "end_date": end_date})

    if df.empty:
        return []

    # 2. REFINAR (Pandas) — ya filtrado por service='errors' en SQL

    # 3. CONVERTIR — timestamps a datetime con utc=True
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
    df = df.dropna(subset=["timestamp"])

    # 4. AGRUPAR — por día y tipo de error
    df["date"] = df["timestamp"].dt.date
    grouped = df.groupby(["date", "event_type"]).size().reset_index(name="count")

    # 5. AGREGAR — ya está hecho con .size()

    # 6. SERVIR — serializar a lista de dicts
    result = grouped.to_dict(orient="records")

    # Convertir date a string para serialización JSON
    for row in result:
        row["date"] = str(row["date"])

    return result


# ══════════════════════════════════════════════════════════════
#  Métrica 3: Estadísticas de latencia por endpoint
# ══════════════════════════════════════════════════════════════

def api_latency_stats(start_date: str, end_date: str) -> list[dict]:
    """
    Calcula estadísticas de latencia por endpoint.

    Responde: ¿Cómo está la latencia de los endpoints?

    Extrae `endpoint` y `latency_ms` de la columna `tags` (JSONB).

    Args:
        start_date: Fecha de inicio en formato ISO 8601 (inclusivo)
        end_date: Fecha de fin en formato ISO 8601 (exclusivo)

    Returns:
        Lista de dicts con keys: endpoint, avg_ms, p50_ms, p95_ms, p99_ms, count
    """
    # 1. CARGAR (SQL) — solo eventos de latencia de API
    query = """
        SELECT tags
        FROM telemetry_events
        WHERE timestamp >= :start_date
          AND timestamp < :end_date
          AND event_type = 'api_latency_recorded'
    """
    df = _fetch_dataframe(query, {"start_date": start_date, "end_date": end_date})

    if df.empty:
        return []

    # 2. REFINAR (Pandas) — extraer endpoint y latency_ms de tags
    # Tags es un diccionario JSONB, lo convertimos a DataFrame
    tags_expanded = pd.json_normalize(df["tags"])

    # Verificar que existen las columnas necesarias
    if "endpoint" not in tags_expanded.columns or "latency_ms" not in tags_expanded.columns:
        return []

    # Crear DataFrame limpio con solo las columnas necesarias
    df_clean = tags_expanded[["endpoint", "latency_ms"]].copy()

    # Descartar filas con valores nulos
    df_clean = df_clean.dropna(subset=["endpoint", "latency_ms"])

    if df_clean.empty:
        return []

    # 3. CONVERTIR — latency_ms a numérico
    df_clean["latency_ms"] = pd.to_numeric(df_clean["latency_ms"], errors="coerce")
    df_clean = df_clean.dropna(subset=["latency_ms"])

    # 4. AGRUPAR — por endpoint
    # 5. AGREGAR — calcular estadísticas
    grouped = df_clean.groupby("endpoint")["latency_ms"].agg([
        "mean",
        lambda x: x.quantile(0.5),
        lambda x: x.quantile(0.95),
        lambda x: x.quantile(0.99),
        "count"
    ]).reset_index()

    # Renombrar columnas
    grouped.columns = ["endpoint", "avg_ms", "p50_ms", "p95_ms", "p99_ms", "count"]

    # Redondear valores para legibilidad
    grouped["avg_ms"] = grouped["avg_ms"].round(2)
    grouped["p50_ms"] = grouped["p50_ms"].round(2)
    grouped["p95_ms"] = grouped["p95_ms"].round(2)
    grouped["p99_ms"] = grouped["p99_ms"].round(2)

    # 6. SERVIR — serializar a lista de dicts
    return grouped.to_dict(orient="records")


# ══════════════════════════════════════════════════════════════
#  Métrica 4: Tasa diaria de fallos de login
# ══════════════════════════════════════════════════════════════

def auth_failure_rate(start_date: str, end_date: str) -> list[dict]:
    """
    Calcula la tasa diaria de fallos de login.

    Responde: ¿Qué tasa de fallos de login hay por día?

    Fórmula: login_failed / (login_failed + login_succeeded) por día

    Args:
        start_date: Fecha de inicio en formato ISO 8601 (inclusivo)
        end_date: Fecha de fin en formato ISO 8601 (exclusivo)

    Returns:
        Lista de dicts con keys: date, failure_rate, failed, succeeded, total
    """
    # 1. CARGAR (SQL) — eventos de autenticación relevantes
    query = """
        SELECT timestamp, event_type
        FROM telemetry_events
        WHERE timestamp >= :start_date
          AND timestamp < :end_date
          AND event_type IN ('login_failed', 'login_succeeded')
    """
    df = _fetch_dataframe(query, {"start_date": start_date, "end_date": end_date})

    if df.empty:
        return []

    # 2. REFINAR (Pandas) — crear flag de fallo
    df["is_failed"] = df["event_type"] == "login_failed"
    df["is_succeeded"] = df["event_type"] == "login_succeeded"

    # 3. CONVERTIR — timestamps a datetime con utc=True
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
    df = df.dropna(subset=["timestamp"])

    # 4. AGRUPAR — por día
    df["date"] = df["timestamp"].dt.date
    daily = df.groupby("date").agg(
        failed=("is_failed", "sum"),
        succeeded=("is_succeeded", "sum")
    ).reset_index()

    # 5. AGREGAR — calcular tasa de fallos
    daily["total"] = daily["failed"] + daily["succeeded"]
    daily["failure_rate"] = daily.apply(
        lambda row: round(row["failed"] / row["total"], 4) if row["total"] > 0 else 0.0,
        axis=1
    )

    # 6. SERVIR — serializar a lista de dicts
    result = daily[["date", "failure_rate", "failed", "succeeded", "total"]].to_dict(orient="records")

    # Convertir date a string para serialización JSON
    for row in result:
        row["date"] = str(row["date"])

    return result
