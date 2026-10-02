"""Test that TimeSeriesSplit preserves chronological order across all folds.

Any shuffle or accidental mixing between train and validation indices
would be caught by these assertions.
"""

from pathlib import Path
import sys

import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from scripts.sales_forecast import TRAIN_END, load_sales

N_SPLITS = 5


def test_timeseries_folds_are_chronological():
    """Verify that TimeSeriesSplit never puts future indices before past ones.

    For each fold k:
      - All training indices must be < all validation indices in that fold.
      - The last training index of fold k must be < the first training index
        of fold k+1 (no overlap or reordering).

    Additionally checks that the raw dataset order (by month) is strictly
    increasing — if this fails, the input itself is unordered.
    """
    frame = load_sales()
    train = frame.loc[frame["month"] <= TRAIN_END].reset_index(drop=True)

    # --- Sanity check: dataset is already sorted by month ---
    assert train["month"].is_monotonic_increasing, (
        "El dataset de entrenamiento no está ordenado cronológicamente."
    )

    tss = TimeSeriesSplit(n_splits=N_SPLITS)

    for fold_idx, (train_idx, val_idx) in enumerate(tss.split(train), 1):
        # Convert to Python ints for safe comparison
        train_idx = [int(i) for i in train_idx]
        val_idx = [int(i) for i in val_idx]

        train_min, train_max = int(np.min(train_idx)), int(np.max(train_idx))
        val_min, val_max = int(np.min(val_idx)), int(np.max(val_idx))

        # Condition 1: all training indices are strictly less than
        # all validation indices within the same fold
        assert train_max < val_min, (
            f"Fold {fold_idx}: el índice máximo de entrenamiento ({train_max}) "
            f"es >= que el índice mínimo de validación ({val_min}). "
            "Los datos se han barajado o hay fuga entre train y val."
        )

        # Condition 2: the training set is contiguous with no gaps.
        # TimeSeriesSplit is an expanding window: train always starts at index 0
        # and grows.  So train must be [0, 1, ..., train_max].
        assert list(train_idx) == list(range(train_max + 1)), (
            f"Fold {fold_idx}: los índices de entrenamiento no son [0..{train_max}]. "
            f"Se esperaba {list(range(train_max + 1))}, se obtuvo {train_idx}. "
            "Posible barajado interno."
        )

        # Condition 3: the validation set is contiguous with no gaps
        assert list(val_idx) == list(range(val_min, val_max + 1)), (
            f"Fold {fold_idx}: los índices de validación no son contiguos. "
            "Posible barajado interno."
        )

        # --- Verify dates match index ordering ---
        train_dates = train.iloc[train_idx]["month"]
        val_dates = train.iloc[val_idx]["month"]

        assert train_dates.is_monotonic_increasing, (
            f"Fold {fold_idx}: las fechas de entrenamiento no están en orden."
        )
        assert val_dates.is_monotonic_increasing, (
            f"Fold {fold_idx}: las fechas de validación no están en orden."
        )
        assert train_dates.max() < val_dates.min(), (
            f"Fold {fold_idx}: la última fecha de entrenamiento "
            f"({train_dates.max()}) es posterior a la primera de validación "
            f"({val_dates.min()})."
        )

    # --- Verify fold structure: each fold must add exactly 16 new months ---
    # TimeSeriesSplit with n_splits=5 on 96 rows produces folds where
    # train folds are [0:16], [0:32], [0:48], [0:64], [0:80]
    splits = list(tss.split(train))
    for k in range(1, len(splits)):
        prev_train_end = int(np.max(splits[k - 1][0]))
        cur_train_end = int(np.max(splits[k][0]))
        # The training set should grow by exactly val_size each fold
        # (val_size = 96 // (n_splits + 1) = 16)
        assert cur_train_end == prev_train_end + 16, (
            f"Fold {k+1}: entrenamiento termina en {cur_train_end}, "
            f"pero el anterior terminó en {prev_train_end} "
            f"(se esperaba {prev_train_end + 16}). "
            "La estructura de folds no es la esperada."
        )


def test_cv_does_not_shuffle_data():
    """Explicitly verify that TimeSeriesSplit indices are strictly increasing
    and contain no shuffle artifacts by checking the original month column."""
    frame = load_sales()
    train = frame.loc[frame["month"] <= TRAIN_END].reset_index(drop=True)

    tss = TimeSeriesSplit(n_splits=N_SPLITS)

    for fold_idx, (train_idx, val_idx) in enumerate(tss.split(train), 1):
        train_months = train.iloc[train_idx]["month"]
        val_months = train.iloc[val_idx]["month"]

        # All train months must be before the earliest val month
        assert train_months.max() < val_months.min(), (
            f"Fold {fold_idx}: meses de entrenamiento y validación se mezclan. "
            f"Último train: {train_months.max()}, primer val: {val_months.min()}"
        )

        # Months must be in the same order as the original CSV
        assert list(train_months) == list(train.iloc[train_idx]["month"]), (
            f"Fold {fold_idx}: el orden de meses de entrenamiento cambió."
        )
        assert list(val_months) == list(train.iloc[val_idx]["month"]), (
            f"Fold {fold_idx}: el orden de meses de validación cambió."
        )