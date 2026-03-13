"""
Payment Delay Prediction Model.

Regression model to predict expected payment delay in days.
Target: delay_days (positive = late, negative = early).
Models: Random Forest, XGBoost, Gradient Boosting.
Outputs: predicted_delay_days, expected_payment_date.
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os


# Features used for delay prediction
FEATURE_COLUMNS = [
    "invoice_amount",
    "invoice_age",
    "days_until_due",
    "client_avg_delay",
    "client_max_delay",
    "client_late_payment_ratio",
    "client_total_invoices",
    "client_avg_invoice_value",
    "client_payment_frequency",
    "rolling_delay_mean",
    "rolling_delay_std",
]


class DelayPredictionModel:
    """
    Manages training, evaluation, and prediction for payment delay regression.
    Trains multiple regressors and selects the best based on MAE.
    """

    def __init__(self):
        self.models = {
            "random_forest": RandomForestRegressor(
                n_estimators=150, max_depth=10, random_state=42, n_jobs=-1
            ),
            "xgboost": XGBRegressor(
                n_estimators=150, max_depth=6,
                learning_rate=0.1, random_state=42,
            ),
            "gradient_boosting": GradientBoostingRegressor(
                n_estimators=150, max_depth=6,
                learning_rate=0.1, random_state=42,
            ),
        }
        self.best_model = None
        self.best_model_name = None
        self.scaler = StandardScaler()
        self.evaluation_results = {}

    def prepare_data(self, feature_df: pd.DataFrame) -> pd.DataFrame:
        """
        Filter to only paid invoices with valid delay and feature values.
        """
        df = feature_df.copy()

        # Only use invoices with known delay
        df = df[df["delay_days"].notna()].copy()

        # Drop rows with missing features
        df = df.dropna(subset=FEATURE_COLUMNS + ["delay_days"])

        print(f"[delay_model] Training data: {len(df)} paid invoices")
        return df

    def train(
        self,
        feature_df: pd.DataFrame,
        test_size: float = 0.2,
    ) -> dict:
        """
        Train all regression models, evaluate, and select the best.

        Args:
            feature_df: Feature-enriched DataFrame.
            test_size: Fraction for test split.

        Returns:
            Dictionary of evaluation metrics for each model.
        """
        df = self.prepare_data(feature_df)

        X = df[FEATURE_COLUMNS].values
        y = df["delay_days"].values

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        best_mae = float("inf")
        results = {}

        for name, model in self.models.items():
            print(f"\n[delay_model] Training {name}...")
            model.fit(X_train_scaled, y_train)

            y_pred = model.predict(X_test_scaled)

            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            r2 = r2_score(y_test, y_pred)

            metrics = {
                "mae": round(mae, 4),
                "rmse": round(rmse, 4),
                "r2_score": round(r2, 4),
            }
            results[name] = metrics

            print(f"  MAE:      {metrics['mae']}")
            print(f"  RMSE:     {metrics['rmse']}")
            print(f"  R² Score: {metrics['r2_score']}")

            if mae < best_mae:
                best_mae = mae
                self.best_model = model
                self.best_model_name = name

        self.evaluation_results = results
        print(f"\n[delay_model] Best model: {self.best_model_name} (MAE={best_mae:.4f})")
        return results

    def predict_delay(self, features: np.ndarray) -> np.ndarray:
        """
        Predict delay in days for given feature vectors.

        Args:
            features: Array of shape (n_samples, n_features).

        Returns:
            Array of predicted delay days.
        """
        if self.best_model is None:
            raise RuntimeError("Model not trained. Call train() first.")

        features_scaled = self.scaler.transform(features)
        return self.best_model.predict(features_scaled)

    def predict_for_invoice(
        self,
        feature_df: pd.DataFrame,
        client_id: str,
        invoice_amount: float,
        invoice_issue_date: pd.Timestamp,
        invoice_due_date: pd.Timestamp,
    ) -> dict:
        """
        Predict delay for a new invoice using client's historical features.

        Args:
            feature_df: Full feature DataFrame (for client lookups).
            client_id: Client identifier.
            invoice_amount: Amount of the invoice.
            invoice_issue_date: Date invoice was issued.
            invoice_due_date: Payment due date.

        Returns:
            Dict with predicted_delay_days and expected_payment_date.
        """
        today = pd.Timestamp.now()

        # Get client features from historical data
        client_data = feature_df[feature_df["client_id"] == client_id]

        if client_data.empty:
            # Use defaults for unknown clients
            client_features = {col: 0.0 for col in FEATURE_COLUMNS}
        else:
            row = client_data.iloc[-1]  # Latest record
            client_features = {col: row.get(col, 0.0) for col in FEATURE_COLUMNS}

        # Override with current invoice data
        client_features["invoice_amount"] = invoice_amount
        client_features["invoice_age"] = (today - invoice_issue_date).days
        client_features["days_until_due"] = (invoice_due_date - today).days

        features = np.array([[client_features[col] for col in FEATURE_COLUMNS]])
        predicted_delay = float(self.predict_delay(features)[0])

        expected_date = invoice_due_date + pd.Timedelta(days=int(round(predicted_delay)))

        return {
            "predicted_delay_days": round(predicted_delay, 1),
            "expected_payment_date": expected_date.strftime("%Y-%m-%d"),
        }

    def save(self, models_dir: str):
        """Save the best model and scaler to disk."""
        os.makedirs(models_dir, exist_ok=True)
        joblib.dump(self.best_model, os.path.join(models_dir, "delay_model.pkl"))
        joblib.dump(self.scaler, os.path.join(models_dir, "delay_scaler.pkl"))
        print(f"[delay_model] Saved to {models_dir}")

    def load(self, models_dir: str):
        """Load saved model and scaler from disk."""
        self.best_model = joblib.load(
            os.path.join(models_dir, "delay_model.pkl")
        )
        self.scaler = joblib.load(
            os.path.join(models_dir, "delay_scaler.pkl")
        )
        print("[delay_model] Loaded from disk")
