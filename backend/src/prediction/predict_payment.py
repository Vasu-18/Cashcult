"""
Payment Prediction Module.

Loads trained models and produces predictions for individual invoices:
- predicted_delay_days
- expected_payment_date
- client_risk_score
- delay_probability
- priority_score & priority_level
"""

import os
import sys
import numpy as np
import pandas as pd

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, PROJECT_ROOT)

from src.models.client_risk_model import ClientRiskModel, FEATURE_COLUMNS as RISK_FEATURES
from src.models.delay_prediction_model import (
    DelayPredictionModel,
    FEATURE_COLUMNS as DELAY_FEATURES,
)
from src.prediction.alerts import compute_priority_score, classify_priority


class PaymentPredictor:
    """
    Unified prediction interface for payment delay and risk.
    Loads all required models and feature data at init.
    """

    def __init__(self, models_dir: str = None, data_dir: str = None):
        """
        Args:
            models_dir: Path to saved models directory.
            data_dir: Path to data directory (for loading feature dataset).
        """
        if models_dir is None:
            models_dir = os.path.join(PROJECT_ROOT, "models", "saved_models")
        if data_dir is None:
            data_dir = os.path.join(PROJECT_ROOT, "data")

        self.models_dir = models_dir
        self.data_dir = data_dir

        # Load models
        self.risk_model = ClientRiskModel()
        self.risk_model.load(models_dir)

        self.delay_model = DelayPredictionModel()
        self.delay_model.load(models_dir)

        # Load feature dataset for client lookups
        features_path = os.path.join(data_dir, "features.csv")
        if os.path.exists(features_path):
            self.feature_df = pd.read_csv(features_path)
        else:
            self.feature_df = pd.DataFrame()
            print("[predict] WARNING: features.csv not found — using defaults")

    def predict(
        self,
        client_id: str,
        invoice_amount: float,
        invoice_issue_date: str,
        invoice_due_date: str,
    ) -> dict:
        """
        Full prediction for a single invoice.

        Args:
            client_id: Client identifier.
            invoice_amount: Invoice amount.
            invoice_issue_date: ISO date string (YYYY-MM-DD).
            invoice_due_date: ISO date string (YYYY-MM-DD).

        Returns:
            Dict with all prediction outputs.
        """
        issue_date = pd.Timestamp(invoice_issue_date)
        due_date = pd.Timestamp(invoice_due_date)
        today = pd.Timestamp.now()

        # --- Delay Prediction ---
        delay_result = self.delay_model.predict_for_invoice(
            self.feature_df, client_id,
            invoice_amount, issue_date, due_date,
        )

        # --- Client Risk Score ---
        risk_score = self.risk_model.predict_for_client(
            self.feature_df, client_id
        )

        # --- Delay Probability ---
        # Convert predicted delay to a probability using sigmoid
        predicted_delay = delay_result["predicted_delay_days"]
        delay_probability = round(
            float(1 / (1 + np.exp(-predicted_delay / 10))), 4
        )

        # --- Priority Score ---
        priority_score = compute_priority_score(
            invoice_amount, delay_probability, risk_score
        )
        priority_level = classify_priority(priority_score)

        return {
            "client_id": client_id,
            "invoice_amount": invoice_amount,
            "invoice_issue_date": invoice_issue_date,
            "invoice_due_date": invoice_due_date,
            "predicted_delay_days": delay_result["predicted_delay_days"],
            "expected_payment_date": delay_result["expected_payment_date"],
            "client_risk_score": round(risk_score, 4),
            "delay_probability": delay_probability,
            "priority_score": priority_score,
            "priority_level": priority_level,
        }
