"""Evaluate TrackFlow's monthly revenue forecast via time-series CV + learning curve."""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Add project root to path so we can import from scripts/
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import matplotlib
matplotlib.use("Agg")  # non-interactive backend for headless environments
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import TimeSeriesSplit

# Reuse existing components from the training script
from scripts.sales_forecast import (
    FEATURE_COLUMNS,
    MAX_FEATURES,
    MIN_SAMPLES_LEAF,
    N_ESTIMATORS,
    RANDOM_STATE,
    TRAIN_END,
    load_sales,
    make_features,
    new_model,
    recursive_forecast,
)

EVAL_DIR = ROOT / "data/eval"
CV_RESULTS_PATH = EVAL_DIR / "cv_results.json"
LEARNING_CURVE_PATH = EVAL_DIR / "learning_curve.png"
REPORT_PATH = EVAL_DIR / "evaluation_report.md"

N_SPLITS = 5


# ─────────────────────────────────────────────
# 1. Feature matrix builder (causal, per fold)
# ─────────────────────────────────────────────


def build_cv_matrix(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Build feature matrix X and target y from a DataFrame using causal features.

    This is identical in logic to ``create_training_matrix`` in ``sales_forecast.py``
    but takes a raw DataFrame instead of a full-frame + index trick, making it
    safe to call per fold without leaking data across fold boundaries.
    """
    values = frame["revenue_eur"].astype(float).tolist()
    rows = []
    for index in range(1, len(frame)):
        # history = everything before this row's month
        row = make_features(values[:index], frame.loc[index, "month"])
        rows.append(row)
    X = pd.DataFrame(rows, columns=FEATURE_COLUMNS)
    y = frame.loc[1:, "revenue_eur"].astype(float).reset_index(drop=True)
    return X, y


# ─────────────────────────────────────────────
# 2. Time-series cross-validation (5 folds)
# ─────────────────────────────────────────────


def time_series_cv(frame: pd.DataFrame, model_factory=None) -> dict:
    """Run TimeSeriesSplit with N_SPLITS folds, report MAE and RMSE as mean ± std.

    No shuffling is applied — chronological order is guaranteed by
    ``sklearn.model_selection.TimeSeriesSplit``.

    Each fold builds its training matrix **from scratch** using only the revenue
    values up to that point, so lag / rolling features never peek into the
    validation horizon of that fold.
    """
    tss = TimeSeriesSplit(n_splits=N_SPLITS)

    fold_mae: list[float] = []
    fold_rmse: list[float] = []
    fold_details: list[dict] = []

    for fold_idx, (train_idx, val_idx) in enumerate(tss.split(frame), 1):
        train_frame = frame.iloc[train_idx].reset_index(drop=True)
        val_frame = frame.iloc[val_idx].reset_index(drop=True)

        # --- Build training matrix from scratch (no leakage) ---
        X_train, y_train = build_cv_matrix(train_frame)
        model = new_model() if model_factory is None else model_factory()
        model.fit(X_train, y_train)

        # --- Direct (one-step) prediction on validation months ---
        # For *each* validation month, we use all actual revenue observed so far
        # (training history + any earlier validation months).  This is what the
        # model would do in production if it had access to actuals up to the
        # current date — a realistic evaluation.
        observed_so_far = train_frame["revenue_eur"].astype(float).tolist()
        val_preds: list[float] = []

        for i in range(len(val_frame)):
            month = val_frame.loc[i, "month"]
            row = make_features(observed_so_far, month)
            row_df = pd.DataFrame([row], columns=FEATURE_COLUMNS)
            pred = max(0.01, float(model.predict(row_df)[0]))
            val_preds.append(pred)
            # Append the *actual* revenue so the next validation month
            # sees the correct history (no recursive accumulation)
            observed_so_far.append(float(val_frame.loc[i, "revenue_eur"]))

        y_val = val_frame["revenue_eur"].astype(float).to_numpy()
        y_pred = np.asarray(val_preds, dtype=float)

        mae = float(mean_absolute_error(y_val, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_val, y_pred)))
        fold_mae.append(mae)
        fold_rmse.append(rmse)

        fold_details.append({
            "fold": fold_idx,
            "train_start": train_frame["month"].iloc[0].strftime("%Y-%m"),
            "train_end": train_frame["month"].iloc[-1].strftime("%Y-%m"),
            "val_start": val_frame["month"].iloc[0].strftime("%Y-%m"),
            "val_end": val_frame["month"].iloc[-1].strftime("%Y-%m"),
            "train_size": int(len(train_frame)),
            "val_size": int(len(val_frame)),
            "mae_eur": mae,
            "rmse_eur": rmse,
        })

    mae_arr = np.asarray(fold_mae)
    rmse_arr = np.asarray(fold_rmse)

    results = {
        "n_splits": N_SPLITS,
        "method": "TimeSeriesSplit (chronological, no shuffle)",
        "mae_eur_mean": float(np.mean(mae_arr)),
        "mae_eur_std": float(np.std(mae_arr, ddof=1)),
        "rmse_eur_mean": float(np.mean(rmse_arr)),
        "rmse_eur_std": float(np.std(rmse_arr, ddof=1)),
        "mae_per_fold": fold_mae,
        "rmse_per_fold": fold_rmse,
        "folds": fold_details,
    }
    return results


def exploratory_holdout(frame: pd.DataFrame, baseline_results: dict) -> dict:
    """Compare recursively forecasted 2024-2025 results; not an independent test."""
    train = frame.loc[frame["month"] <= TRAIN_END].reset_index(drop=True)
    holdout = frame.loc[frame["month"] > TRAIN_END].reset_index(drop=True)
    X_train, y_train = build_cv_matrix(train)
    predictions = {}

    for name, model in (
        ("regularized", new_model()),
        (
            "baseline",
            RandomForestRegressor(
                n_estimators=N_ESTIMATORS,
                min_samples_leaf=2,
                max_features=0.9,
                random_state=RANDOM_STATE,
                n_jobs=-1,
            ),
        ),
    ):
        model.fit(X_train, y_train)
        forecast = recursive_forecast(
            model,
            train["revenue_eur"].astype(float).tolist(),
            pd.DatetimeIndex(holdout["month"]),
        )
        actual = holdout["revenue_eur"].astype(float).to_numpy()
        predictions[name] = {
            "mae_eur": float(mean_absolute_error(actual, forecast)),
            "rmse_eur": float(np.sqrt(mean_squared_error(actual, forecast))),
            "months": int(len(actual)),
        }

    return {
        "period": [holdout["month"].iloc[0].strftime("%Y-%m"), holdout["month"].iloc[-1].strftime("%Y-%m")],
        "independent": False,
        "note": "Periodo inspeccionado durante la comparación de configuraciones; métricas exploratorias.",
        **predictions,
    }


# ─────────────────────────────────────────────
# 3. Learning curve
# ─────────────────────────────────────────────


def learning_curve(frame: pd.DataFrame) -> plt.Figure:
    """Generate learning curve: train RMSE and val RMSE as training size grows.

    The **fixed validation window** is 2022-01–2023-12 (the last 24 months of
    the training period).  Training subsets grow from 20 % to 95 % of the
    pre-2022 data (2016-01–2021-12, 72 months).
    """
    # Fixed validation window: last 24 months of the training period
    val_start = pd.Timestamp("2022-01-01")
    val = frame.loc[frame["month"] >= val_start].reset_index(drop=True)
    train_pool = frame.loc[frame["month"] < val_start].reset_index(drop=True)

    # Fractions of pre-2022 data to use for training
    fractions = np.array([0.20, 0.35, 0.50, 0.65, 0.80, 1.00])
    n_total = len(train_pool)
    train_sizes = np.unique(np.maximum(2, (n_total * fractions).astype(int)))

    train_errors: list[float] = []
    val_errors: list[float] = []
    size_labels: list[str] = []

    for n_train in train_sizes:
        train_subset = train_pool.iloc[:n_train].reset_index(drop=True)

        # --- Build training matrix ---
        X_train, y_train = build_cv_matrix(train_subset)
        model = new_model()
        model.fit(X_train, y_train)

        # --- Training error (on the same subset) ---
        y_train_pred = model.predict(X_train)
        train_err = float(np.sqrt(mean_squared_error(y_train, y_train_pred)))
        train_errors.append(train_err)

        # --- Validation error (direct prediction on fixed window) ---
        observed_so_far = train_subset["revenue_eur"].astype(float).tolist()
        val_preds: list[float] = []
        for i in range(len(val)):
            month = val.loc[i, "month"]
            row = make_features(observed_so_far, month)
            row_df = pd.DataFrame([row], columns=FEATURE_COLUMNS)
            pred = max(0.01, float(model.predict(row_df)[0]))
            val_preds.append(pred)
            observed_so_far.append(float(val.loc[i, "revenue_eur"]))

        y_val = val["revenue_eur"].astype(float).to_numpy()
        y_val_pred = np.asarray(val_preds, dtype=float)
        val_err = float(np.sqrt(mean_squared_error(y_val, y_val_pred)))
        val_errors.append(val_err)

        pct = int(round(n_train / n_total * 100))
        size_labels.append(f"{n_train} ({pct}%)")

    # --- Plot ---
    fig, ax = plt.subplots(figsize=(10, 6))
    x = np.arange(len(train_sizes))

    ax.plot(x, np.asarray(train_errors) / 1e3, "o-",
            color="#14263a", label="Error entrenamiento (RMSE)", linewidth=2)
    ax.plot(x, np.asarray(val_errors) / 1e3, "s--",
            color="#c89d66", label="Error validación (RMSE)", linewidth=2)

    ax.set_xlabel("Tamaño del conjunto de entrenamiento (meses)", fontsize=12)
    ax.set_ylabel("RMSE (miles de EUR)", fontsize=12)
    ax.set_title(
        "Curva de Aprendizaje — Pronóstico de Ingresos Mensuales TrackFlow",
        fontsize=13, fontweight="bold",
    )
    ax.set_xticks(x)
    ax.set_xticklabels(size_labels, fontsize=9)
    ax.legend(fontsize=11)
    ax.grid(True, alpha=0.3)

    # Annotation with final gap
    gap = val_errors[-1] - train_errors[-1]
    ax.annotate(
        f"Brecha final: {gap:,.0f} EUR\n"
        f"Val: {val_errors[-1]:,.0f} EUR  |  Train: {train_errors[-1]:,.0f} EUR",
        xy=(x[-1], val_errors[-1] / 1e3),
        xytext=(x[-1] - 0.5, val_errors[-1] / 1e3 * 1.25),
        fontsize=10, ha="center",
        bbox=dict(boxstyle="round,pad=0.3", facecolor="#f3ddba", alpha=0.8),
        arrowprops=dict(arrowstyle="->", color="#2f4a62", lw=1.5),
    )

    fig.tight_layout()
    return fig, train_errors, val_errors, train_sizes


# ─────────────────────────────────────────────
# 4. Generate evaluation report (Markdown)
# ─────────────────────────────────────────────


def generate_report(
    cv_results: dict,
    baseline_results: dict,
    holdout_results: dict,
    train_errors: list[float],
    val_errors: list[float],
    train_sizes: np.ndarray,
    validation_mean_revenue: float,
) -> str:
    """Build a Markdown evaluation report from CV and learning-curve data."""

    mae_m = cv_results["mae_eur_mean"]
    mae_s = cv_results["mae_eur_std"]
    rmse_m = cv_results["rmse_eur_mean"]
    rmse_s = cv_results["rmse_eur_std"]

    # --- Diagnostic logic ---
    final_gap = val_errors[-1] - train_errors[-1]
    final_val_err = val_errors[-1]
    gap_ratio = final_gap / final_val_err if final_val_err > 0 else 0
    val_improvement = (val_errors[0] - val_errors[-1]) / val_errors[0] if val_errors[0] > 0 else 0
    relative_error = final_val_err / validation_mean_revenue

    # Heuristic thresholds indicate patterns, not statistical proof.
    persistent_gap = all(
        (val_errors[i] - train_errors[i]) / val_errors[i] > 0.25
        for i in range(len(train_errors))
    ) if val_errors[0] > 0 else False
    if gap_ratio > 0.25 and persistent_gap:
        diagnosis = "indicios compatibles con sobreajuste; conclusión no concluyente"
        diagnosis_explanation = (
            "La brecha train-validación es amplia "
            f"({final_gap:,.0f} EUR; {gap_ratio*100:.1f} % del RMSE de validación), "
            "lo que es compatible con sobreajuste, pero no lo demuestra: los "
            "conjuntos corresponden a periodos distintos y en esta curva cambian "
            "a la vez el tamaño y la distancia temporal a validación."
        )
    elif gap_ratio < 0.15 and relative_error > 0.18:
        diagnosis = "posibles indicios de infraajuste según umbrales heurísticos"
        diagnosis_explanation = (
            f"La brecha final es {gap_ratio*100:.1f}% del RMSE de validación, "
            f"mientras que el error equivale al {relative_error*100:.1f}% de la "
            "media real de 2022–2023. Estos umbrales son heurísticos y no "
            "demuestran infraajuste por sí solos."
        )
    else:
        diagnosis = "sin señal concluyente según los umbrales heurísticos"
        diagnosis_explanation = (
            f"La brecha final es {gap_ratio*100:.1f}% del RMSE de validación y "
            f"el error equivale al {relative_error*100:.1f}% de la media real de "
            "2022–2023. Estos valores no bastan para afirmar buen ajuste."
        )

    corrective = (
        "Se evaluó una configuración regularizada (`min_samples_leaf=4`, "
        "`max_features=0.6`, 400 árboles). Su RMSE medio en CV fue "
        f"{cv_results['rmse_eur_mean']:,.2f} EUR, frente a "
        f"{baseline_results['rmse_eur_mean']:,.2f} EUR del baseline; el MAE fue "
        f"{cv_results['mae_eur_mean']:,.2f} EUR frente a "
        f"{baseline_results['mae_eur_mean']:,.2f} EUR. Ambos promedios CV empeoran. "
        f"En {holdout_results['period'][0]}–{holdout_results['period'][1]} el candidato "
        f"obtuvo RMSE {holdout_results['regularized']['rmse_eur']:,.2f} EUR y MAE "
        f"{holdout_results['regularized']['mae_eur']:,.2f} EUR; baseline: RMSE "
        f"{holdout_results['baseline']['rmse_eur']:,.2f} EUR y MAE "
        f"{holdout_results['baseline']['mae_eur']:,.2f} EUR. Esta comparación es "
        "exploratoria, no independiente. No se recomienda sustituir el baseline "
        "si RMSE es la métrica acordada. Reducir árboles no es una regularización "
        "fiable; el candidato queda evaluado, no promovido."
    )
    # --- Assemble report ---
    report = f"""# Evaluación Técnica del Modelo de Pronóstico — TrackFlow

**Fecha:** 2026-10-02
**Modelo evaluado:** RandomForestRegressor (n_estimators={N_ESTIMATORS}, min_samples_leaf={MIN_SAMPLES_LEAF}, max_features={MAX_FEATURES})
**Período de entrenamiento:** 2016-01 – 2023-12 (96 meses)
**Validación cruzada:** TimeSeriesSplit ({N_SPLITS} folds)
**Validación para curva de aprendizaje:** 2022-01 – 2023-12 (24 meses fijos)

---

## 1. Validación Cruzada Temporal

Se aplicó `TimeSeriesSplit` con {N_SPLITS} folds **sin barajar** los datos. En cada fold,
las features de lag y medias rodantes se construyeron **desde cero** usando solo el
historial disponible antes de cada fila, garantizando que ningún fold
contamine al siguiente.

| Métrica | Media ± Desviación estándar (EUR) |
|---|---|
| MAE  | {mae_m:,.2f} ± {mae_s:,.2f} |
| RMSE | {rmse_m:,.2f} ± {rmse_s:,.2f} |

### Resultados por fold

| Fold | Train (inicio → fin) | Val (inicio → fin) | MAE (EUR) | RMSE (EUR) |
|---|---|---|---|---|
"""

    for f in cv_results["folds"]:
        report += (
            f"| {f['fold']} | {f['train_start']} → {f['train_end']} "
            f"| {f['val_start']} → {f['val_end']} "
            f"| {f['mae_eur']:,.2f} | {f['rmse_eur']:,.2f} |\n"
        )

    report += f"""
La desviación estándar del RMSE a través de los {N_SPLITS} folds es de
{rmse_s:,.2f} EUR, lo que representa un **{rmse_s/rmse_m*100:.1f} %** de la media.
"""

    # Stability assessment
    stability_pct = rmse_s / rmse_m * 100
    if stability_pct < 10:
        stability = "baja variación entre estos folds"
    elif stability_pct < 25:
        stability = "variación moderada entre estos folds"
    else:
        stability = "alta variación entre estos folds"

    report += (
        f"La variación entre folds es **{stability}**. Los folds cubren periodos "
        "diferentes; esta variabilidad no mide aisladamente la sensibilidad a "
        "pequeños cambios en la muestra.\n"
    )

    report += f"""
## 2. Curva de Aprendizaje

![Curva de aprendizaje](learning_curve.png)

La curva de aprendizaje se generó con un **conjunto de validación fijo** de 24 meses
(2022-01 – 2023-12) y tamaños crecientes del conjunto de entrenamiento
(desde 20 % hasta el 100 % de los 72 meses previos a 2022). Al crecer el conjunto,
también se acorta la distancia temporal hasta validación; la curva no aísla el
efecto del tamaño de muestra.

### Puntos clave de la curva

| Tamaño train | RMSE train (EUR) | RMSE val (EUR) | Brecha (EUR) |
|---|---|---|---|
"""

    for i, n in enumerate(train_sizes):
        gap_i = val_errors[i] - train_errors[i]
        report += f"| {n} meses | {train_errors[i]:,.2f} | {val_errors[i]:,.2f} | {gap_i:,.2f} |\n"

    report += f"""
### Interpretación del patrón

{diagnosis_explanation}

---

## 3. Métricas: MAE vs RMSE — Justificación

Ambas métricas se calcularon sobre cada fold de la validación cruzada:

- **MAE** (Error Absoluto Medio): mide el error promedio en valor absoluto. Es robusto
  a outliers pero no diferencia si el error se concentra en meses clave (ej. diciembre).
- **RMSE** (Raíz del Error Cuadrático Medio): penaliza errores grandes al elevarlos al
  cuadrado antes de promediar.

**Métrica principal informada: RMSE**

*Justificación:* RMSE da más peso matemático a errores grandes. No se encontró
una función de coste o política de negocio que confirme que ese peso represente
el impacto económico de TrackFlow. MAE se incluye como medida complementaria;
la métrica de decisión debe acordarse con quien usará el pronóstico.

---

## 4. Diagnóstico

**Clasificación:** {diagnosis}.

{diagnosis_explanation}

### Evidencia que respalda el diagnóstico

| Fuente | Indicador | Valor |
|---|---|---|
| Validación cruzada | RMSE medio | {rmse_m:,.2f} EUR |
| Validación cruzada | RMSE baseline (leaf=2, max_features=0.9) | {baseline_results['rmse_eur_mean']:,.2f} EUR |
| Validación cruzada | Variación inter-fold (CV del RMSE) | {rmse_s/rmse_m*100:.1f} % |
| Curva de aprendizaje | Brecha train-val final | {final_gap:,.2f} EUR |
| Curva de aprendizaje | Proporción de brecha | {gap_ratio*100:.1f} % |
| Curva de aprendizaje | Error relativo (val/media real 2022–2023) | {relative_error*100:.1f} % |
| Tendencia de la curva | Mejora del error de validación | {val_improvement*100:.1f} % |

---

## 5. Acción Correctiva

{corrective}

---

## 6. Notas Adicionales

- Todos los resultados son **reproducibles** usando `random_state={RANDOM_STATE}`.
- La validación cruzada usa **predicción directa** (one-step), no recursiva,
    y en cada paso incorpora el valor real del mes anterior a la siguiente predicción.
- Las reglas diagnósticas (brecha de 25%/15% y error relativo de 18%) son
    heurísticas, no criterios estadísticos universales.
- El periodo de prueba 2024–2025 se consultó al comparar configuraciones; sus
    métricas son exploratorias y no constituyen una estimación independiente.
"""

    return report


# ─────────────────────────────────────────────
# 5. Main
# ─────────────────────────────────────────────


def main() -> None:
    EVAL_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("  Evaluación del Modelo de Pronóstico — TrackFlow")
    print("=" * 60)

    print("\n[1/4] Cargando datos...")
    frame = load_sales()
    train_frame = frame.loc[frame["month"] <= TRAIN_END].reset_index(drop=True)
    print(f"      {len(train_frame)} meses de entrenamiento (2016-01 → 2023-12)")

    print(f"\n[2/4] Ejecutando validación cruzada temporal ({N_SPLITS} folds)...")
    baseline_results = time_series_cv(
        train_frame,
        model_factory=lambda: RandomForestRegressor(
            n_estimators=N_ESTIMATORS,
            min_samples_leaf=2,
            max_features=0.9,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
    )
    cv_results = time_series_cv(train_frame)
    cv_results["baseline"] = {
        "min_samples_leaf": 2,
        "max_features": 0.9,
        "n_estimators": N_ESTIMATORS,
        "rmse_eur_mean": baseline_results["rmse_eur_mean"],
        "rmse_eur_std": baseline_results["rmse_eur_std"],
        "mae_eur_mean": baseline_results["mae_eur_mean"],
    }
    holdout_results = exploratory_holdout(frame, baseline_results)
    cv_results["exploratory_holdout"] = holdout_results
    print(f"      MAE  = {cv_results['mae_eur_mean']:>10,.2f} ± {cv_results['mae_eur_std']:,.2f} EUR")
    print(f"      RMSE = {cv_results['rmse_eur_mean']:>10,.2f} ± {cv_results['rmse_eur_std']:,.2f} EUR")

    for f in cv_results["folds"]:
        print(
            f"        Fold {f['fold']}: train {f['train_size']} meses "
            f"({f['train_start']} → {f['train_end']})  |  "
            f"val {f['val_size']} meses ({f['val_start']} → {f['val_end']})  |  "
            f"MAE {f['mae_eur']:,.2f}  RMSE {f['rmse_eur']:,.2f}"
        )

    print("\n[3/4] Generando curva de aprendizaje...")
    fig, train_errors, val_errors, train_sizes = learning_curve(train_frame)
    fig.savefig(LEARNING_CURVE_PATH, dpi=150)
    plt.close(fig)
    print(f"      Curva guardada en {LEARNING_CURVE_PATH}")

    cv_results["learning_curve_path"] = str(LEARNING_CURVE_PATH.relative_to(ROOT))

    # Guardar resultados CV como JSON para reuso
    CV_RESULTS_PATH.write_text(json.dumps(cv_results, indent=2), encoding="utf-8")
    print(f"      Resultados CV guardados en {CV_RESULTS_PATH}")

    print("\n[4/4] Generando reporte técnico...")
    validation_window = train_frame.loc[train_frame["month"] >= "2022-01-01"]
    validation_mean_revenue = float(validation_window["revenue_eur"].mean())
    report = generate_report(
        cv_results,
        baseline_results,
        holdout_results,
        train_errors,
        val_errors,
        train_sizes,
        validation_mean_revenue,
    )
    REPORT_PATH.write_text(report, encoding="utf-8")
    print(f"      Reporte guardado en {REPORT_PATH}")

    print("\n" + "=" * 60)
    print("  ✅ Evaluación completada.")
    print("=" * 60)


if __name__ == "__main__":
    main()