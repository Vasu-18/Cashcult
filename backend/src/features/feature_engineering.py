"""
Feature Engineering Module.

Computes per-invoice and per-client features for ML models:
- delay_days, payment_time, invoice_age, days_until_due
- client_avg_delay, client_max_delay, client_late_payment_ratio
- client_total_invoices, client_avg_invoice_value
- rolling_delay_mean, rolling_delay_std
"""

import pandas as pd
import numpy as np
from datetime import datetime


def compute_invoice_features(invoices: pd.DataFrame) -> pd.DataFrame:
    """
    Add per-invoice temporal features.

    Features created:
        delay_days:    (paid_date - due_date).days — positive = late
        payment_time:  (paid_date - issue_date).days
        invoice_age:   (today - issue_date).days
        days_until_due: (due_date - today).days — negative = overdue
    """
    df = invoices.copy()

    today = pd.Timestamp(datetime.now().date())

    # Core delay features (only for paid invoices)
    df["delay_days"] = np.nan
    df["payment_time"] = np.nan

    paid_mask = df["paid_date"].notna()
    if paid_mask.any():
        df.loc[paid_mask, "delay_days"] = (
            df.loc[paid_mask, "paid_date"] - df.loc[paid_mask, "invoice_due_date"]
        ).dt.days
        df.loc[paid_mask, "payment_time"] = (
            df.loc[paid_mask, "paid_date"] - df.loc[paid_mask, "invoice_issue_date"]
        ).dt.days

    # Time-based features
    df["invoice_age"] = (today - df["invoice_issue_date"]).dt.days
    df["days_until_due"] = (df["invoice_due_date"] - today).dt.days

    return df


def compute_client_features(invoices: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate payment behavior features per client.

    Features created:
        client_avg_delay:           Mean delay_days for paid invoices
        client_max_delay:           Max delay_days
        client_late_payment_ratio:  Fraction of invoices paid late (delay > 0)
        client_total_invoices:      Number of invoices
        client_avg_invoice_value:   Mean invoice amount
        client_payment_frequency:   Average days between consecutive invoices
    """
    # Only use invoices that have been paid for delay calculations
    paid = invoices[invoices["delay_days"].notna()].copy()

    if paid.empty:
        # Return empty client feature set
        return pd.DataFrame(columns=[
            "client_id", "client_avg_delay", "client_max_delay",
            "client_late_payment_ratio", "client_total_invoices",
            "client_avg_invoice_value", "client_payment_frequency",
        ])

    client_stats = paid.groupby("client_id").agg(
        client_avg_delay=("delay_days", "mean"),
        client_max_delay=("delay_days", "max"),
        client_total_invoices=("invoice_id", "count"),
        client_avg_invoice_value=("invoice_amount", "mean"),
    ).reset_index()

    # Late payment ratio
    late_counts = (
        paid[paid["delay_days"] > 0]
        .groupby("client_id")["invoice_id"]
        .count()
        .reset_index()
        .rename(columns={"invoice_id": "late_count"})
    )
    total_counts = (
        paid.groupby("client_id")["invoice_id"]
        .count()
        .reset_index()
        .rename(columns={"invoice_id": "total_count"})
    )
    ratio_df = total_counts.merge(late_counts, on="client_id", how="left")
    ratio_df["late_count"] = ratio_df["late_count"].fillna(0)
    ratio_df["client_late_payment_ratio"] = (
        ratio_df["late_count"] / ratio_df["total_count"]
    )

    client_stats = client_stats.merge(
        ratio_df[["client_id", "client_late_payment_ratio"]],
        on="client_id",
        how="left",
    )

    # Payment frequency: avg days between consecutive invoices per client
    sorted_inv = paid.sort_values(["client_id", "invoice_issue_date"])
    sorted_inv["prev_issue_date"] = sorted_inv.groupby("client_id")[
        "invoice_issue_date"
    ].shift(1)
    sorted_inv["days_between"] = (
        sorted_inv["invoice_issue_date"] - sorted_inv["prev_issue_date"]
    ).dt.days

    freq = (
        sorted_inv.groupby("client_id")["days_between"]
        .mean()
        .reset_index()
        .rename(columns={"days_between": "client_payment_frequency"})
    )

    client_stats = client_stats.merge(freq, on="client_id", how="left")
    client_stats["client_payment_frequency"] = (
        client_stats["client_payment_frequency"].fillna(30)
    )

    # Round for cleanliness
    for col in ["client_avg_delay", "client_max_delay",
                "client_avg_invoice_value", "client_payment_frequency",
                "client_late_payment_ratio"]:
        client_stats[col] = client_stats[col].round(2)

    return client_stats


def compute_rolling_features(
    invoices: pd.DataFrame,
    window: int = 5,
) -> pd.DataFrame:
    """
    Compute rolling statistics on delay_days per client.

    Features created:
        rolling_delay_mean:  Rolling mean of last `window` delays
        rolling_delay_std:   Rolling std of last `window` delays
    """
    df = invoices.copy()
    df = df.sort_values(["client_id", "invoice_issue_date"])

    df["rolling_delay_mean"] = (
        df.groupby("client_id")["delay_days"]
        .transform(lambda x: x.rolling(window, min_periods=1).mean())
    )
    df["rolling_delay_std"] = (
        df.groupby("client_id")["delay_days"]
        .transform(lambda x: x.rolling(window, min_periods=1).std())
    )
    df["rolling_delay_std"] = df["rolling_delay_std"].fillna(0)

    return df


def build_feature_dataset(
    invoices: pd.DataFrame,
    clients: pd.DataFrame = None,
) -> pd.DataFrame:
    """
    Full feature engineering pipeline.

    1. Compute invoice-level features
    2. Compute client-level aggregate features
    3. Compute rolling features
    4. Merge everything into a single feature dataset

    Args:
        invoices: Raw invoices DataFrame (with dates already parsed).
        clients: Optional clients DataFrame to merge.

    Returns:
        Feature-enriched DataFrame ready for model training.
    """
    print("[features] Computing invoice-level features...")
    df = compute_invoice_features(invoices)

    print("[features] Computing client-level aggregate features...")
    client_features = compute_client_features(df)

    print("[features] Computing rolling features...")
    df = compute_rolling_features(df)

    # Merge client aggregates
    df = df.merge(client_features, on="client_id", how="left")

    # Optionally merge client metadata
    if clients is not None:
        df = df.merge(clients, on="client_id", how="left")

    # Fill any remaining NaNs in numeric feature columns
    feature_cols = [
        "client_avg_delay", "client_max_delay", "client_late_payment_ratio",
        "client_total_invoices", "client_avg_invoice_value",
        "client_payment_frequency", "rolling_delay_mean", "rolling_delay_std",
    ]
    for col in feature_cols:
        if col in df.columns:
            df[col] = df[col].fillna(0)

    print(f"[features] Feature dataset built — {len(df)} rows, {len(df.columns)} cols")
    return df
