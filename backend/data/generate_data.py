"""
Synthetic Data Generator for Cash Flow Intelligence System.

Generates realistic correlated datasets:
- clients.csv: Client profiles with industry
- invoices.csv: Invoices with payment behavior correlated to client risk
- transactions.csv: Bank transactions (inflow/outflow)
- expenses.csv: Business expenses by category
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta


def set_seed(seed: int = 42):
    """Set random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)


def generate_clients(n_clients: int = 50) -> pd.DataFrame:
    """Generate a client dataset with varying risk profiles."""
    industries = [
        "Technology", "Healthcare", "Retail", "Manufacturing",
        "Finance", "Logistics", "Education", "Construction",
        "Real Estate", "Consultancy"
    ]
    clients = []
    for i in range(1, n_clients + 1):
        clients.append({
            "client_id": f"C{i:03d}",
            "client_name": f"Client_{chr(64 + (i % 26) + 1)}_{i}",
            "industry": random.choice(industries),
            # Hidden risk factor used to correlate payment behavior
            "_risk_factor": np.clip(np.random.beta(2, 5), 0.05, 0.95),
        })
    return pd.DataFrame(clients)


def generate_invoices(
    clients_df: pd.DataFrame,
    n_invoices: int = 1000,
    start_date: str = "2024-01-01",
    end_date: str = "2025-12-31",
) -> pd.DataFrame:
    """
    Generate invoice data with payment behavior correlated to client risk.
    Higher-risk clients tend to pay later and have more 'overdue' invoices.
    """
    start = pd.Timestamp(start_date)
    end = pd.Timestamp(end_date)
    date_range_days = (end - start).days

    invoices = []
    for i in range(1, n_invoices + 1):
        client = clients_df.sample(1).iloc[0]
        risk = client["_risk_factor"]

        issue_date = start + timedelta(days=random.randint(0, date_range_days - 60))
        due_days = random.choice([15, 30, 45, 60])
        due_date = issue_date + timedelta(days=due_days)

        # Payment delay correlated with risk factor
        if random.random() < (0.15 + 0.5 * risk):
            # Late payment
            delay = int(np.random.exponential(scale=10 + 40 * risk))
            delay = max(1, min(delay, 90))
        else:
            # On-time or early payment
            delay = -random.randint(0, 5)

        paid_date = due_date + timedelta(days=delay)

        # Some invoices are still unpaid (recent ones)
        is_unpaid = (
            paid_date > pd.Timestamp("2025-11-30")
            and random.random() < 0.3
        )

        amount = round(
            np.random.lognormal(mean=11, sigma=1.2) + 10000, -2
        )  # Amounts ranging ~₹10K – ₹10L+

        if is_unpaid:
            status = "pending"
            paid_date_val = None
        elif delay > 0:
            status = "overdue"
            paid_date_val = paid_date.strftime("%Y-%m-%d")
        else:
            status = "paid"
            paid_date_val = paid_date.strftime("%Y-%m-%d")

        invoices.append({
            "invoice_id": f"INV{i:05d}",
            "client_id": client["client_id"],
            "invoice_amount": amount,
            "invoice_issue_date": issue_date.strftime("%Y-%m-%d"),
            "invoice_due_date": due_date.strftime("%Y-%m-%d"),
            "paid_date": paid_date_val,
            "payment_status": status,
        })

    return pd.DataFrame(invoices)


def generate_transactions(
    n_transactions: int = 2000,
    start_date: str = "2024-01-01",
    end_date: str = "2025-12-31",
) -> pd.DataFrame:
    """Generate bank transaction data with seasonal patterns."""
    start = pd.Timestamp(start_date)
    end = pd.Timestamp(end_date)
    date_range_days = (end - start).days

    descriptions_inflow = [
        "Client payment received", "Invoice settlement",
        "Service fee collected", "Subscription revenue",
        "Consulting fee", "Project milestone payment",
    ]
    descriptions_outflow = [
        "Salary payment", "Rent payment", "Software subscription",
        "Office supplies", "Marketing expense", "Utility bill",
        "Vendor payment", "Insurance premium", "Travel expense",
    ]

    transactions = []
    for i in range(1, n_transactions + 1):
        date = start + timedelta(days=random.randint(0, date_range_days))
        # Seasonal factor: higher activity in Q4
        month = date.month
        seasonal_mult = 1.0 + 0.3 * (month >= 10)

        is_inflow = random.random() < 0.45  # Slightly more outflows

        if is_inflow:
            amount = round(
                np.random.lognormal(mean=10.5, sigma=1.0) * seasonal_mult, 2
            )
            desc = random.choice(descriptions_inflow)
            txn_type = "inflow"
        else:
            amount = round(
                np.random.lognormal(mean=10.0, sigma=0.8) * seasonal_mult, 2
            )
            desc = random.choice(descriptions_outflow)
            txn_type = "outflow"

        transactions.append({
            "transaction_id": f"TXN{i:05d}",
            "date": date.strftime("%Y-%m-%d"),
            "amount": amount,
            "type": txn_type,
            "description": desc,
        })

    return pd.DataFrame(transactions)


def generate_expenses(
    n_expenses: int = 800,
    start_date: str = "2024-01-01",
    end_date: str = "2025-12-31",
) -> pd.DataFrame:
    """Generate an expense dataset with realistic categories."""
    start = pd.Timestamp(start_date)
    end = pd.Timestamp(end_date)
    date_range_days = (end - start).days

    categories = {
        "Salaries": (200000, 50000),
        "Rent": (80000, 10000),
        "Marketing": (30000, 20000),
        "Software": (15000, 8000),
        "Travel": (20000, 15000),
        "Office Supplies": (5000, 3000),
        "Utilities": (8000, 3000),
        "Insurance": (12000, 4000),
        "Vendor Payments": (50000, 30000),
        "Miscellaneous": (10000, 8000),
    }

    expenses = []
    for _ in range(n_expenses):
        category = random.choice(list(categories.keys()))
        mean_val, std_val = categories[category]
        amount = max(500, round(np.random.normal(mean_val, std_val), 2))
        date = start + timedelta(days=random.randint(0, date_range_days))
        expenses.append({
            "date": date.strftime("%Y-%m-%d"),
            "expense_amount": amount,
            "expense_category": category,
        })

    return pd.DataFrame(expenses)


def main():
    """Generate all datasets and save to the data/ directory."""
    set_seed(42)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = script_dir  # Save in the same data/ folder

    print("Generating synthetic datasets...")

    # --- Clients ---
    clients_df = generate_clients(n_clients=50)
    clients_public = clients_df.drop(columns=["_risk_factor"])
    clients_public.to_csv(os.path.join(data_dir, "clients.csv"), index=False)
    print(f"  clients.csv — {len(clients_public)} records")

    # --- Invoices ---
    invoices_df = generate_invoices(clients_df, n_invoices=1200)
    invoices_df.to_csv(os.path.join(data_dir, "invoices.csv"), index=False)
    print(f"  invoices.csv — {len(invoices_df)} records")

    # --- Transactions ---
    txn_df = generate_transactions(n_transactions=2500)
    txn_df.to_csv(os.path.join(data_dir, "transactions.csv"), index=False)
    print(f"  transactions.csv — {len(txn_df)} records")

    # --- Expenses ---
    exp_df = generate_expenses(n_expenses=800)
    exp_df.to_csv(os.path.join(data_dir, "expenses.csv"), index=False)
    print(f"  expenses.csv — {len(exp_df)} records")

    print("\nAll datasets generated successfully!")


if __name__ == "__main__":
    main()
