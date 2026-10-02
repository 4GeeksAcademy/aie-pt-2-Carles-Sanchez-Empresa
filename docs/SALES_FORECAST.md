# TrackFlow monthly sales forecast

## Reproduce

From the repository root, run:

```bash
uv run --with pandas --with scikit-learn --with scipy python scripts/sales_forecast.py
uv run --with pandas --with scikit-learn --with scipy --with pytest python -m pytest tests/pipelines/test_sales_forecast.py -q
```

The source is `data/raw/trackflow_sales.csv`; the script validates its exact schema, the consolidated market, 120 consecutive months, non-empty values and positive revenue. It does not alter the input file. Output is `data/eval/sales_forecast.json`.

## Method

- Random Forest was selected as an explainable and relatively low-tuning baseline for 96 monthly training observations. Its seed is fixed at 42.
- Training is January 2016–December 2023 (96 months); test is January 2024–December 2025 (24 months). The final test values are not used to build features or recursive predictions.
- Features are calendar sin/cos, trend, causal lags (1, 2, 3, 6 and 12 months), and trailing means. The first month is not a supervised target because no past exists; expanding historical means initialize early lag values. No scaling is needed for tree models.
- Forecast is recursive: each prediction is appended to history to forecast the following month.
- Variability band is formed from the 2.5th and 97.5th percentiles of residuals from a chronological validation forecast for 2022–2023, trained only on earlier observations. It is a historical residual interval, not a calibrated guarantee.

## Metrics

All reported test metrics use the 24 unseen months. Year filters call the API to recalculate them for the selected subset.

- **MSE (EUR²):** mean squared error; penalizes large errors strongly. Normalized MSE is also reported as `MSE / mean(actual)^2 × 100`. RMSE in EUR and as a percentage of mean revenue is provided for easier business interpretation.
- **PSI:** compares prediction-score distributions for the 24-month recursive validation forecast (2022–2023) and the 24-month test forecast. Decile cut points are learned from the validation reference distribution; zero bins are protected by epsilon smoothing. Convention: `<0.1` stable, `0.1–0.25` slight drift, `>0.25` significant drift. PSI signals distribution drift, not forecast accuracy. Growth and seasonality can drive a high value.
- **Gini:** `2 × AUC − 1`, where an actual month is labeled high revenue if it exceeds the training-set 75th percentile. Measures ranking of high-revenue months, not EUR accuracy. It is undefined if a selected period contains only one class.
- **K²:** D’Agostino–Pearson normality statistic applied to test residuals (`actual - predicted`); the p-value is shown separately. It tests evidence against normal residuals, not bias or accuracy directly. Results over only 24 months are sensitive and should be treated cautiously.

The consolidated-only source cannot diagnose a change in revenue mix between the US and Spain. PSI here compares forecast-score distributions, not country composition. The band and residual diagnostics are based on 24 validation months, so are indicative rather than guarantees.

## Backoffice

After generating the JSON, run the FastAPI backend and the backoffice, sign in, and open **Sales Forecast / Pronóstico de Ventas**. The page shows actual vs forecast with the variability band, metrics, and inclusive start/end year filters (or global). The endpoint is `/reporting/sales-forecast` and is protected by the existing JWT requirement.
