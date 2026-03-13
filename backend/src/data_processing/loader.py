"""
Data Loader Module.

Handles loading financial datasets from CSV and Excel files,
validates schema (required columns), and converts date columns.
"""

import os
import pandas as pd
from typing import List, Optional, Dict


# Schema definitions: dataset name → (required_columns, date_columns)
SCHEMAS: Dict[str, tuple] = {
    "invoices": (
        ["invoice_id", "client_id", "invoice_amount",
         "invoice_issue_date", "invoice_due_date", "payment_status"],
        ["invoice_issue_date", "invoice_due_date", "paid_date"],
    ),
    "clients": (
        ["client_id", "client_name", "industry"],
        [],
    ),
    "transactions": (
        ["transaction_id", "date", "amount", "type", "description"],
        ["date"],
    ),
    "expenses": (
        ["date", "expense_amount", "expense_category"],
        ["date"],
    ),
}


def load_file(filepath: str) -> pd.DataFrame:
    """
    Load a CSV or Excel file into a DataFrame.

    Args:
        filepath: Absolute or relative path to the data file.

    Returns:
        pd.DataFrame with the raw data.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file format is unsupported.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Data file not found: {filepath}")

    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".csv":
        return pd.read_csv(filepath)
    elif ext in (".xls", ".xlsx"):
        return pd.read_excel(filepath)
    else:
        raise ValueError(f"Unsupported file format: {ext}")


def validate_schema(
    df: pd.DataFrame,
    dataset_name: str,
    required_cols: Optional[List[str]] = None,
) -> bool:
    """
    Validate that a DataFrame contains all required columns.

    Args:
        df: The DataFrame to validate.
        dataset_name: Name key from SCHEMAS, or custom.
        required_cols: Override list of required columns.

    Returns:
        True if valid.

    Raises:
        ValueError: If required columns are missing.
    """
    if required_cols is None:
        if dataset_name not in SCHEMAS:
            raise ValueError(f"Unknown dataset name: {dataset_name}")
        required_cols = SCHEMAS[dataset_name][0]

    missing = set(required_cols) - set(df.columns)
    if missing:
        raise ValueError(
            f"Dataset '{dataset_name}' is missing columns: {missing}"
        )
    return True


def convert_dates(df: pd.DataFrame, date_columns: List[str]) -> pd.DataFrame:
    """
    Convert specified columns to datetime, coercing errors to NaT.

    Args:
        df: Input DataFrame.
        date_columns: Column names to convert.

    Returns:
        DataFrame with converted date columns.
    """
    df = df.copy()
    for col in date_columns:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")
    return df


def load_dataset(filepath: str, dataset_name: str) -> pd.DataFrame:
    """
    Full pipeline: load file → validate schema → convert dates.

    Args:
        filepath: Path to the data file.
        dataset_name: Key in SCHEMAS (invoices, clients, transactions, expenses).

    Returns:
        Cleaned DataFrame with validated schema and parsed dates.
    """
    df = load_file(filepath)
    validate_schema(df, dataset_name)

    date_cols = SCHEMAS.get(dataset_name, ([], []))[1]
    df = convert_dates(df, date_cols)

    print(f"[loader] Loaded '{dataset_name}' — {len(df)} rows, {len(df.columns)} cols")
    return df


def load_all_datasets(data_dir: str) -> Dict[str, pd.DataFrame]:
    """
    Load all standard datasets from a data directory.

    Args:
        data_dir: Directory containing invoices.csv, clients.csv, etc.

    Returns:
        Dictionary mapping dataset names to DataFrames.
    """
    datasets = {}
    file_map = {
        "invoices": "invoices.csv",
        "clients": "clients.csv",
        "transactions": "transactions.csv",
        "expenses": "expenses.csv",
    }

    for name, filename in file_map.items():
        path = os.path.join(data_dir, filename)
        if os.path.exists(path):
            datasets[name] = load_dataset(path, name)
        else:
            print(f"[loader] WARNING: {filename} not found in {data_dir}")

    return datasets
