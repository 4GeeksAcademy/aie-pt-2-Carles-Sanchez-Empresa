from pathlib import Path
import sys

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from scripts.sales_forecast import TRAIN_END, TEST_END, TEST_START, load_sales


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
