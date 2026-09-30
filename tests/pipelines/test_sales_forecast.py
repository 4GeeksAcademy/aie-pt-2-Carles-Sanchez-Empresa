from pathlib import Path
import sys

import pandas as pd
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from scripts.sales_forecast import (
    TRAIN_END,
    TEST_END,
    TEST_START,
    create_training_matrix,
    load_sales,
)


def test_sales_split_is_chronological_and_has_no_leakage():
    data = load_sales()
    train = data.loc[data["month"] <= TRAIN_END]
    test = data.loc[data["month"].between(TEST_START, TEST_END)]

    assert len(train) == 96
    assert len(test) == 24
    assert train["month"].max() < test["month"].min()
    assert set(train["month"]).isdisjoint(set(test["month"]))
    assert train["month"].iloc[0] == pd.Timestamp("2016-01-01")
    assert test["month"].iloc[-1] == TEST_END


def test_features_use_only_prior_months():
    data = load_sales().iloc[:18].reset_index(drop=True)
    x, y, dates = create_training_matrix(data)

    # Matriz empezando en el segundo mes: cada lag apunta al mes previo.
    for row_index, source_index in enumerate(range(1, len(data))):
        history = data.loc[: source_index - 1, "revenue_eur"].to_numpy(dtype=float)
        row = x.iloc[row_index]
        assert row["lag_1"] == history[-1]
        assert row["rolling_mean_3"] == pytest.approx(history[-3:].mean())
        assert row["rolling_mean_6"] == pytest.approx(history[-6:].mean())
        assert row["rolling_mean_12"] == pytest.approx(history[-12:].mean())
        assert y.iloc[row_index] == data.loc[source_index, "revenue_eur"]
        assert dates.iloc[row_index] == data.loc[source_index, "month"]

    # Cambiar el valor del mes actual/futuro no puede modificar features de t.
    target_index = 10
    baseline_x, _, _ = create_training_matrix(data)
    changed = data.copy()
    changed.loc[target_index:, "revenue_eur"] *= 100
    changed_x, _, _ = create_training_matrix(changed)
    # La fila del objetivo t usa datos hasta t-1. Modificar t y los meses futuros
    # no puede cambiar ninguna de sus features.
    assert baseline_x.iloc[target_index - 1].to_dict() == changed_x.iloc[target_index - 1].to_dict()
