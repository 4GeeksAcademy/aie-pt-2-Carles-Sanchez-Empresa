"""
Safe snippet for basic pandas cleaning. Copy and adapt for your dataset.
Usage: python pandas_clean.py <path_to_csv>
"""
import sys
import pandas as pd

def main():
    if len(sys.argv) < 2:
        print("Usage: python pandas_clean.py <path_to_csv>")
        sys.exit(1)

    path = sys.argv[1]

    try:
        df = pd.read_csv(path)
    except FileNotFoundError:
        print(f"Error: File not found: {path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

    print("df_shape", df.shape)
    print("df_dtypes", df.dtypes)

    # Drop fully null columns
    df = df.dropna(axis=1, how="all")
    print("df_shape_after_drop_all_null_cols", df.shape)

    # Fill or drop nulls in key columns (customise columns)
    # df = df.dropna(subset=["required_col"])
    # df["optional_col"] = df["optional_col"].fillna(0)

    # Normalise column names (optional)
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    print("df_columns", list(df.columns))

    # Deduplicate (optional)
    before = len(df)
    df = df.drop_duplicates()
    print("rows_dropped_duplicates", before - len(df))

    # Sample output
    print("df_head", df.head())


if __name__ == "__main__":
    main()
