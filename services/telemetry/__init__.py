# telemetry — Pipeline de análisis de telemetría (TrackFlow)

"""
Módulo de análisis de telemetría para TrackFlow.

Proporciona funciones de métrica que cargan datos de la tabla
`telemetry_events` en Supabase, los transforman con Pandas y
devuelven resultados serializables a JSON.

Funciones disponibles:
    - events_per_day: Volumen de eventos por día y tipo
    - error_events_by_type: Errores por tipo y día
    - api_latency_stats: Estadísticas de latencia por endpoint
    - auth_failure_rate: Tasa diaria de fallos de login
"""
