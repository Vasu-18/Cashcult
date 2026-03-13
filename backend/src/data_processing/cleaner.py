"""
Data Cleaner Module.

Handles missing values, normalizes monetary columns,
removes duplicates, and applies data quality transformations.
"""

import pandas as pd
import numpy as np
from typing import List, Optional


def handle_missing_values(
    df: pd.DataFrame,
    numeric_strategy: str = "median",
    categorical_strategy: str = "mode",
) -> pd.DataFrame:
    """
    Fill missing values based on column type.

    Args:
        df: Input DataFrame.
        numeric_strategy: 'mean', 'median', or 'zero' for numeric cols.
        categorical_strategy: 'mode' or 'unknown' for categorical cols.

    Returns:
        DataFrame with missing values handled.
    """
    df = df.copy()

    for col in df.columns:
        if df[col].isnull().sum() == 0:
            continue

        if pd.api.types.is_numeric_dtype(df[col]):
            if numeric_strategy == "median":
                df[col].fillna(df[col].median(), inplace=True)
            elif numeric_strategy == "mean":
                df[col].fillna(df[col].mean(), inplace=True)
            elif numeric_strategy == "zero":
                df[col].fillna(0, inplace=True)

        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            pass  # Leave NaT for dates (handled later contextually)

        else:
            if categorical_strategy == "mode" and not df[col].mode().empty:
                df[col].fillna(df[col].mode()[0], inplace=True)
            else:
                df[col].fillna("unknown", inplace=True)

    return df


def normalize_monetary_values(
    df: pd.DataFrame,
    monetary_columns: List[str],
) -> pd.DataFrame:
    """
    Ensure monetary columns are positive floats, rounded to 2 decimals.

    Args:
        df: Input DataFrame.
        monetary_columns: Column names containing monetary values.

    Returns:
        DataFrame with normalized monetary columns.
    """
    df = df.copy()
    for col in monetary_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").abs().round(2)
    return df


def remove_duplicates(
    df: pd.DataFrame,
    subset: Optional[List[str]] = None,
) -> pd.DataFrame:
    """
    Remove duplicate rows.

    Args:
        df: Input DataFrame.
        subset: Columns to consider for identifying duplicates.

    Returns:
        De-duplicated DataFrame.
    """
    before = len(df)
    df = df.drop_duplicates(subset=subset, keep="first").reset_index(drop=True)
    removed = before - len(df)
    if removed > 0:
        print(f"[cleaner] Removed {removed} duplicate rows")
    return df


def clean_invoices(df: pd.DataFrame) -> pd.DataFrame:
    """
    Full cleaning pipeline for the invoices dataset.

    Steps:
        1. Remove duplicates by invoice_id
        2. Handle missing values
        3. Normalize monetary columns
        4. Standardize payment_status values
    """
    df = remove_duplicates(df, subset=["invoice_id"])
    df = handle_missing_values(df)
    df = normalize_monetary_values(df, ["invoice_amount"])

    # Standardize payment status
    if "payment_status" in df.columns:
        df["payment_status"] = (
            df["payment_status"].str.strip().str.lower()
        )

    print(f"[cleaner] Invoices cleaned — {len(df)} rows")
    return df


def clean_clients(df: pd.DataFrame) -> pd.DataFrame:
    """Clean the clients dataset."""
    df = remove_duplicates(df, subset=["client_id"])
    df = handle_missing_values(df)
    print(f"[cleaner] Clients cleaned — {len(df)} rows")
    return df


def clean_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """Clean the transactions dataset."""
    df = remove_duplicates(df, subset=["transaction_id"])
    df = handle_missing_values(df)
    df = normalize_monetary_values(df, ["amount"])

    if "type" in df.columns:
        df["type"] = df["type"].str.strip().str.lower()

    print(f"[cleaner] Transactions cleaned — {len(df)} rows")
    return df


def clean_expenses(df: pd.DataFrame) -> pd.DataFrame:
    """Clean the expenses dataset."""
    df = handle_missing_values(df)
    df = normalize_monetary_values(df, ["expense_amount"])
    print(f"[cleaner] Expenses cleaned — {len(df)} rows")
    return df


def clean_all(datasets: dict) -> dict:
    """
    Apply the appropriate cleaning function to each dataset.

    Args:
        datasets: Dict mapping dataset names to DataFrames.

    Returns:
        Dict with cleaned DataFrames.
    """
    cleaners = {
        "invoices": clean_invoices,
        "clients": clean_clients,
        "transactions": clean_transactions,
        "expenses": clean_expenses,
    }

    cleaned = {}
    for name, df in datasets.items():
        if name in cleaners:
            cleaned[name] = cleaners[name](df)
        else:
            cleaned[name] = df

    return cleaned
