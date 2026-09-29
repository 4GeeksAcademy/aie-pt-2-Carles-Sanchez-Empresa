"""Train and evaluate TrackFlow's monthly consolidated revenue forecast."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from scipy.stats import normaltest
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, roc_auc_score

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data/raw/trackflow_sales.csv"
OUTPUT_PATH = ROOT / "data/eval/sales_forecast.json"
RANDOM_STATE = 42
TRAIN_END = pd.Timestamp("2023-12-01")
TEST_START = pd.Timestamp("2024-01-01")
TEST_END = pd.Timestamp("2025-12-01")
FEATURE_COLUMNS = [
    "year_index", "month_sin", "month_cos", "lag_1", "lag_2", "lag_3",
    "lag_6", "lag_12", "rolling_mean_3", "rolling_mean_6", "rolling_mean_12",
]


def load_sales(path: Path = DATA_PATH) -> pd.DataFrame:
    """Load and validate the untouched consolidated source series."""
    frame = pd.read_csv(path)
    expected = {"month", "revenue_eur", "shipments_processed", "avg_revenue_per_shipment_eur", "market"}
    if set(frame.columns) != expected:
        raise ValueError(f"Columnas inesperadas: {list(frame.columns)}")
    frame = frame.loc[frame["market"].eq("consolidated")].copy()
    frame["month"] = pd.to_datetime(frame["month"], errors="coerce")
    frame = frame.sort_values("month").reset_index(drop=True)
    if frame.isna().any().any():
        raise ValueError("El dataset consolidado contiene fechas o valores nulos/vacíos.")
    expected_months = pd.date_range("2016-01-01", "2025-12-01", freq="MS")
    if not frame["month"].reset_index(drop=True).equals(pd.Series(expected_months, name="month")):
        raise ValueError("Se esperan 120 meses consecutivos desde 2016-01 hasta 2025-12.")
    if (frame["revenue_eur"] <= 0).any():
        raise ValueError("Todos los ingresos deben ser positivos.")
    return frame


def make_features(history: list[float], month: pd.Timestamp) -> dict[str, float]:
    """Create causal calendar, lag and rolling features from observed/predicted history."""
    values = np.asarray(history, dtype=float)
    month_number = int(month.month)
    features = {
        "year_index": float(month.year - 2016),
        "month_sin": float(np.sin(2 * np.pi * month_number / 12)),
        "month_cos": float(np.cos(2 * np.pi * month_number / 12)),
    }
    for lag in (1, 2, 3, 6, 12):
        features[f"lag_{lag}"] = float(values[-lag]) if len(values) >= lag else float(values.mean())
    for window in (3, 6, 12):
        features[f"rolling_mean_{window}"] = float(values[-window:].mean()) if len(values) >= window else float(values.mean())
    return features


def create_training_matrix(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, pd.Series]:
    """Build causal feature rows; target rows remain in chronological order."""
    history = frame["revenue_eur"].astype(float).tolist()
    # The first month has no prior observations and cannot be used as a target
    # without leaking its own revenue. From month two onward, shorter histories
    # use only their expanding past mean until each lag becomes available.
    rows = [make_features(history[:index], frame.loc[index, "month"]) for index in range(1, len(frame))]
    x = pd.DataFrame(rows, columns=FEATURE_COLUMNS)
    y = frame.loc[1:, "revenue_eur"].astype(float).reset_index(drop=True)
    dates = frame.loc[1:, "month"].reset_index(drop=True)
    return x, y, dates


def new_model() -> RandomForestRegressor:
    # Random Forest es un punto de partida adecuado para solo 96 meses: promedia
    # árboles, es relativamente sencillo de explicar y requiere poco ajuste.
    # Se fija la semilla para que el experimento sea reproducible.
    return RandomForestRegressor(n_estimators=400, min_samples_leaf=2, max_features=0.9, random_state=RANDOM_STATE, n_jobs=-1)


def recursive_forecast(model: RandomForestRegressor, observed_history: list[float], dates: pd.DatetimeIndex) -> np.ndarray:
    """Forecast forward without reading any actual values in the forecast horizon."""
    history = list(map(float, observed_history))
    predictions: list[float] = []
    for month in dates:
        row = pd.DataFrame([make_features(history, pd.Timestamp(month))], columns=FEATURE_COLUMNS)
        prediction = max(0.01, float(model.predict(row)[0]))
        predictions.append(prediction)
        history.append(prediction)
    return np.asarray(predictions)


def gini_score(actual: np.ndarray, predicted: np.ndarray, threshold: float) -> float | None:
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)
    labels = actual > threshold
    if np.unique(labels).size < 2:
        return None
    return float(2 * roc_auc_score(labels, predicted) - 1)


def population_stability_index(reference: np.ndarray, current: np.ndarray) -> float:
    """PSI for score distributions, using reference decile cut points."""
    reference = np.asarray(reference, dtype=float)
    current = np.asarray(current, dtype=float)
    cuts = np.unique(np.quantile(reference, np.linspace(0.1, 0.9, 9)))
    ref_counts = np.histogram(reference, bins=np.concatenate(([-np.inf], cuts, [np.inf])))[0]
    cur_counts = np.histogram(current, bins=np.concatenate(([-np.inf], cuts, [np.inf])))[0]
    ref_share = np.clip(ref_counts / max(ref_counts.sum(), 1), 1e-6, None)
    cur_share = np.clip(cur_counts / max(cur_counts.sum(), 1), 1e-6, None)
    return float(np.sum((cur_share - ref_share) * np.log(cur_share / ref_share)))


def calculate_metrics(actual: np.ndarray, predicted: np.ndarray, reference_scores: np.ndarray, gini_threshold: float) -> dict[str, Any]:
    residuals = np.asarray(actual, dtype=float) - np.asarray(predicted, dtype=float)
    mse = float(mean_squared_error(actual, predicted))
    k2, k2_pvalue = normaltest(residuals)
    return {
        "mse_eur2": mse,
        "normalized_mse_percent": float(mse / float(np.mean(actual)) ** 2 * 100),
        "rmse_percent_of_mean": float(np.sqrt(mse) / float(np.mean(actual)) * 100),
        "rmse_eur": float(np.sqrt(mse)),
        "psi": population_stability_index(reference_scores, predicted),
        "gini": gini_score(actual, predicted, gini_threshold),
        "gini_threshold_eur": float(gini_threshold),
        "k2_score": float(k2),
        "k2_pvalue": float(k2_pvalue),
        "months": int(len(actual)),
    }


def build_report(frame: pd.DataFrame) -> dict[str, Any]:
    """Fit, validate, forecast 24 unseen months and package UI-ready results."""
    train = frame.loc[frame["month"] <= TRAIN_END].reset_index(drop=True)
    test = frame.loc[frame["month"].between(TEST_START, TEST_END)].reset_index(drop=True)
    if len(train) != 96 or len(test) != 24:
        raise ValueError("El split debe contener 96 meses de entrenamiento y 24 de prueba.")

    # Ventana temporal final 2022-2023 reservada dentro de entrenamiento para
    # estimar errores de validación y la banda, sin consultar los años de prueba.
    validation_start = pd.Timestamp("2022-01-01")
    validation_train = train.loc[train["month"] < validation_start].reset_index(drop=True)
    validation_actual = train.loc[train["month"] >= validation_start, "revenue_eur"].to_numpy(dtype=float)
    validation_model = new_model()
    xv, yv, _ = create_training_matrix(validation_train)
    validation_model.fit(xv, yv)
    validation_dates = pd.date_range(validation_start, "2023-12-01", freq="MS")
    validation_predictions = recursive_forecast(validation_model, validation_train["revenue_eur"].tolist(), validation_dates)
    validation_residuals = validation_actual - validation_predictions
    lower_error, upper_error = np.quantile(validation_residuals, [0.025, 0.975])

    # Referencia PSI: predicciones de la validación temporal 2022-2023, generadas
    # recursivamente con el mismo horizonte de 24 meses que la prueba final.
    x_train, y_train, dates_train = create_training_matrix(train)
    reference_scores = validation_predictions.copy()

    final_model = new_model()
    final_model.fit(x_train, y_train)
    test_dates = pd.date_range(TEST_START, TEST_END, freq="MS")
    predictions = recursive_forecast(final_model, train["revenue_eur"].tolist(), test_dates)
    actual = test["revenue_eur"].to_numpy(dtype=float)
    # Umbral alto fijado solo con train: clasifica meses de ingresos altos para
    # interpretar el Gini como ranking de temporadas con facturación elevada.
    gini_threshold = float(train["revenue_eur"].quantile(0.75))
    metrics = calculate_metrics(actual, predictions, reference_scores, gini_threshold)

    points = []
    for index, month in enumerate(test_dates):
        points.append({
            "month": month.strftime("%Y-%m-%d"),
            "year": int(month.year),
            "actual_eur": float(actual[index]),
            "predicted_eur": float(predictions[index]),
            "lower_eur": float(max(0.0, predictions[index] + lower_error)),
            "upper_eur": float(max(0.0, predictions[index] + upper_error)),
        })
    return {
        "source": "data/raw/trackflow_sales.csv",
        "model": "RandomForestRegressor",
        "random_state": RANDOM_STATE,
        "train_period": {"start": "2016-01", "end": "2023-12", "months": 96},
        "test_period": {"start": "2024-01", "end": "2025-12", "months": 24},
        "metrics": metrics,
        "validation": {"period": "2022-01/2023-12", "months": 24, "band_method": "2.5th and 97.5th percentiles of chronological validation residuals"},
        "psi_method": "Prediction-score distributions; reference is a chronological 24-month recursive forecast on the 2022-2023 training validation window; decile cut points from reference.",
        "gini_method": "Gini = 2*AUC - 1 for ranking months whose actual revenue exceeds the training 75th percentile.",
        "k2_method": "D’Agostino-Pearson normality statistic on actual-minus-predicted residuals; p-value is reported separately.",
        "psi_reference_predictions": reference_scores.tolist(),
        "validation_predictions": [
            {"month": month.strftime("%Y-%m-%d"), "actual_eur": float(observed), "predicted_eur": float(predicted)}
            for month, observed, predicted in zip(validation_dates, validation_actual, validation_predictions)
        ],
        "points": points,
    }


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    report = build_report(load_sales())
    OUTPUT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(OUTPUT_PATH.relative_to(ROOT)), "metrics": report["metrics"]}, indent=2))


if __name__ == "__main__":
    main()
