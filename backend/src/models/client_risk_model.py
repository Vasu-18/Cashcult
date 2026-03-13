"""
Client Risk Prediction Model.

Binary classification to predict whether a client is a risky payer.
Label: 1 = frequently delays payments, 0 = reliable payer.
Models: Logistic Regression, Random Forest, XGBoost.
Outputs: client_risk_score (probability 0–1).
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report,
)
import joblib
import os


# Features used for client risk prediction
FEATURE_COLUMNS = [
    "client_avg_delay",
    "client_max_delay",
    "client_late_payment_ratio",
    "client_total_invoices",
    "client_avg_invoice_value",
    "client_payment_frequency",
]

# Threshold: a client is "risky" if their late payment ratio exceeds this
RISK_THRESHOLD = 0.4


class ClientRiskModel:
    """
    Manages training, evaluation, and prediction for client risk classification.
    Trains multiple models and selects the best based on F1 score.
    """

    def __init__(self):
        self.models = {
            "logistic_regression": LogisticRegression(
                max_iter=1000, random_state=42
            ),
            "random_forest": RandomForestClassifier(
                n_estimators=100, random_state=42, n_jobs=-1
            ),
            "xgboost": XGBClassifier(
                n_estimators=100, max_depth=5,
                learning_rate=0.1, random_state=42,
                use_label_encoder=False, eval_metric="logloss",
            ),
        }
        self.best_model = None
        self.best_model_name = None
        self.scaler = StandardScaler()
        self.evaluation_results = {}

    def prepare_client_labels(
        self, feature_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Create per-client dataset with binary risk label.

        A client is labeled risky (1) if their late_payment_ratio > RISK_THRESHOLD.
        """
        # Aggregate to client level (take first since client features are constant)
        client_df = (
            feature_df.groupby("client_id")[FEATURE_COLUMNS]
            .first()
            .reset_index()
        )

        client_df["is_risky"] = (
            client_df["client_late_payment_ratio"] > RISK_THRESHOLD
        ).astype(int)

        print(f"[risk_model] Client dataset: {len(client_df)} clients, "
              f"{client_df['is_risky'].sum()} risky ({client_df['is_risky'].mean():.1%})")

        return client_df

    def train(
        self,
        feature_df: pd.DataFrame,
        test_size: float = 0.2,
    ) -> dict:
        """
        Train all models, evaluate, and select the best one.

        Args:
            feature_df: Feature-enriched DataFrame from feature engineering.
            test_size: Fraction for test split.

        Returns:
            Dictionary of evaluation metrics for each model.
        """
        client_df = self.prepare_client_labels(feature_df)

        X = client_df[FEATURE_COLUMNS].values
        y = client_df["is_risky"].values

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        best_f1 = -1
        results = {}

        for name, model in self.models.items():
            print(f"\n[risk_model] Training {name}...")
            model.fit(X_train_scaled, y_train)

            y_pred = model.predict(X_test_scaled)
            y_prob = model.predict_proba(X_test_scaled)[:, 1]

            metrics = {
                "accuracy": round(accuracy_score(y_test, y_pred), 4),
                "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
                "recall": round(recall_score(y_test, y_pred, zero_division=0), 4),
                "f1_score": round(f1_score(y_test, y_pred, zero_division=0), 4),
                "roc_auc": round(roc_auc_score(y_test, y_prob), 4)
                if len(set(y_test)) > 1 else 0.0,
            }
            results[name] = metrics

            print(f"  Accuracy:  {metrics['accuracy']}")
            print(f"  Precision: {metrics['precision']}")
            print(f"  Recall:    {metrics['recall']}")
            print(f"  F1 Score:  {metrics['f1_score']}")
            print(f"  ROC-AUC:   {metrics['roc_auc']}")

            if metrics["f1_score"] > best_f1:
                best_f1 = metrics["f1_score"]
                self.best_model = model
                self.best_model_name = name

        self.evaluation_results = results
        print(f"\n[risk_model] Best model: {self.best_model_name} (F1={best_f1:.4f})")
        return results

    def predict_risk_score(self, features: np.ndarray) -> np.ndarray:
        """
        Predict client risk score (probability of being risky).

        Args:
            features: Array of shape (n_samples, n_features).

        Returns:
            Array of risk scores (0–1).
        """
        if self.best_model is None:
            raise RuntimeError("Model not trained. Call train() first.")

        features_scaled = self.scaler.transform(features)
        return self.best_model.predict_proba(features_scaled)[:, 1]

    def predict_for_client(
        self, feature_df: pd.DataFrame, client_id: str
    ) -> float:
        """
        Get risk score for a specific client.

        Args:
            feature_df: Full feature DataFrame.
            client_id: The client to predict for.

        Returns:
            Risk score between 0 and 1.
        """
        client_data = feature_df[feature_df["client_id"] == client_id]
        if client_data.empty:
            return 0.5  # Default for unknown clients

        features = client_data[FEATURE_COLUMNS].iloc[0:1].values
        return float(self.predict_risk_score(features)[0])

    def save(self, models_dir: str):
        """Save the best model and scaler to disk."""
        os.makedirs(models_dir, exist_ok=True)
        joblib.dump(self.best_model, os.path.join(models_dir, "client_risk_model.pkl"))
        joblib.dump(self.scaler, os.path.join(models_dir, "client_risk_scaler.pkl"))
        print(f"[risk_model] Saved to {models_dir}")

    def load(self, models_dir: str):
        """Load a saved model and scaler from disk."""
        self.best_model = joblib.load(
            os.path.join(models_dir, "client_risk_model.pkl")
        )
        self.scaler = joblib.load(
            os.path.join(models_dir, "client_risk_scaler.pkl")
        )
        print("[risk_model] Loaded from disk")
