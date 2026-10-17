# `scripts` folder

This folder contains **helper scripts** for the monorepo: development automation, maintenance utilities, repetitive tasks (setup, lint, migrations, data generation, etc.), and internal tooling.

- **Main purpose**: group support tools that do not belong to a specific app, agent, or pipeline but make the team’s work easier.
- **Recommendation**: document each script (what it does, parameters, requirements, usage examples) and keep them reproducible (and safe) across environments.

> _Spanish version: [README.es.md](./README.es.md)._

## Sales forecast

Run `uv run --with pandas --with scikit-learn --with scipy python scripts/sales_forecast.py` from the repository root to train the reproducible Random Forest forecast from `data/raw/trackflow_sales.csv`. It validates the source series, trains on 2016–2023, recursively forecasts 2024–2025, evaluates MSE/PSI/Gini/K² on those 24 held-out months, and writes `data/eval/sales_forecast.json` for the protected backoffice endpoint. See `docs/SALES_FORECAST.md` for metric definitions and limitations.
