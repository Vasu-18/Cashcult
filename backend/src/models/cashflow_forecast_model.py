"""
Cash Flow Forecasting Model.

Time-series forecasting for daily cash inflow and outflow using Facebook Prophet.
Produces 30-day forecasts of inflow, outflow, and predicted balance.
Evaluation: MAPE, RMSE.
"""

import numpy as np
import pandas as pd
from prophet import Prophet
from sklearn.metrics import mean_squared_error
import joblib
import os
import warnings
import logging

# Suppress Prophet's verbose logging
logging.getLogger("prophet").setLevel(logging.WARNING)
logging.getLogger("cmdstanpy").setLevel(logging.WARNING)
warnings.filterwarnings("ignore", category=FutureWarning)


def compute_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean Absolute Percentage Error, handling zero values."""
    mask = y_true != 0
    if mask.sum() == 0:
        return 0.0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


class CashFlowForecastModel:
    """
    Separate Prophet models for inflow and outflow forecasting.
    Trained on daily aggregated bank transaction data.
    """

    def __init__(self):
        self.inflow_model = None
        self.outflow_model = None
        self.evaluation_results = {}

    def prepare_daily_series(
        self, transactions: pd.DataFrame
    ) -> tuple:
        """
        Aggregate transactions into daily inflow and outflow totals.

        Args:
            transactions: DataFrame with 'date', 'amount', 'type' columns.

        Returns:
            (inflow_df, outflow_df) — each with columns 'ds' and 'y' for Prophet.
        """
        df = transactions.copy()
        df["date"] = pd.to_datetime(df["date"])

        # Daily inflow
        inflow = (
            df[df["type"] == "inflow"]
            .groupby("date")["amount"]
            .sum()
            .reset_index()
        )
        inflow.columns = ["ds", "y"]

        # Daily outflow
        outflow = (
            df[df["type"] == "outflow"]
            .groupby("date")["amount"]
            .sum()
            .reset_index()
        )
        outflow.columns = ["ds", "y"]

        # Fill missing dates with zero
        full_range = pd.date_range(
            start=df["date"].min(), end=df["date"].max(), freq="D"
        )
        inflow = (
            inflow.set_index("ds")
            .reindex(full_range, fill_value=0)
            .reset_index()
            .rename(columns={"index": "ds"})
        )
        outflow = (
            outflow.set_index("ds")
            .reindex(full_range, fill_value=0)
            .reset_index()
            .rename(columns={"index": "ds"})
        )

        print(f"[forecast] Daily series: {len(inflow)} days, "
              f"inflow total=₹{inflow['y'].sum():,.0f}, "
              f"outflow total=₹{outflow['y'].sum():,.0f}")

        return inflow, outflow

    def train(
        self,
        transactions: pd.DataFrame,
        test_days: int = 30,
    ) -> dict:
        """
        Train Prophet models for inflow and outflow.
        Uses the last `test_days` for evaluation.

        Args:
            transactions: Raw transactions DataFrame.
            test_days: Number of days to hold out for evaluation.

        Returns:
            Dictionary of evaluation metrics.
        """
        inflow_df, outflow_df = self.prepare_daily_series(transactions)

        results = {}

        for label, df in [("inflow", inflow_df), ("outflow", outflow_df)]:
            # Train/test split by time
            cutoff = df["ds"].max() - pd.Timedelta(days=test_days)
            train = df[df["ds"] <= cutoff]
            test = df[df["ds"] > cutoff]

            print(f"\n[forecast] Training {label} model "
                  f"({len(train)} train, {len(test)} test days)...")

            model = Prophet(
                daily_seasonality=False,
                weekly_seasonality=True,
                yearly_seasonality=True,
                changepoint_prior_scale=0.05,
            )
            model.fit(train)

            # Predict on test period
            future = model.make_future_dataframe(periods=len(test))
            forecast = model.predict(future)
            pred = forecast[forecast["ds"].isin(test["ds"])]["yhat"].values
            actual = test["y"].values

            # Ensure non-negative predictions
            pred = np.maximum(pred, 0)

            rmse = np.sqrt(mean_squared_error(actual, pred))
            mape = compute_mape(actual, pred)

            results[label] = {
                "rmse": round(rmse, 2),
                "mape": round(mape, 2),
            }

            print(f"  RMSE: ₹{rmse:,.2f}")
            print(f"  MAPE: {mape:.2f}%")

            if label == "inflow":
                self.inflow_model = model
            else:
                self.outflow_model = model

        # Now retrain on full data for production forecasting
        print("\n[forecast] Retraining on full data for production...")
        self.inflow_model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=True,
            changepoint_prior_scale=0.05,
        )
        self.inflow_model.fit(inflow_df)

        self.outflow_model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=True,
            changepoint_prior_scale=0.05,
        )
        self.outflow_model.fit(outflow_df)

        self.evaluation_results = results
        return results

    def forecast(self, days: int = 30) -> dict:
        """
        Produce a forecast for the next `days` days.

        Returns:
            Dict with daily forecasts and summary totals.
        """
        if self.inflow_model is None or self.outflow_model is None:
            raise RuntimeError("Models not trained. Call train() first.")

        # Inflow forecast
        future_in = self.inflow_model.make_future_dataframe(periods=days)
        fc_in = self.inflow_model.predict(future_in)
        inflow_forecast = fc_in.tail(days)[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
        inflow_forecast.columns = ["date", "inflow", "inflow_lower", "inflow_upper"]
        inflow_forecast["inflow"] = inflow_forecast["inflow"].clip(lower=0)

        # Outflow forecast
        future_out = self.outflow_model.make_future_dataframe(periods=days)
        fc_out = self.outflow_model.predict(future_out)
        outflow_forecast = fc_out.tail(days)[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
        outflow_forecast.columns = ["date", "outflow", "outflow_lower", "outflow_upper"]
        outflow_forecast["outflow"] = outflow_forecast["outflow"].clip(lower=0)

        # Merge
        daily = inflow_forecast.merge(
            outflow_forecast, on="date", how="outer"
        ).fillna(0)
        daily["net_flow"] = daily["inflow"] - daily["outflow"]
        daily["cumulative_balance"] = daily["net_flow"].cumsum()

        total_inflow = round(daily["inflow"].sum(), 2)
        total_outflow = round(daily["outflow"].sum(), 2)
        predicted_balance = round(total_inflow - total_outflow, 2)

        # Format dates
        daily["date"] = daily["date"].dt.strftime("%Y-%m-%d")

        return {
            "forecast_days": days,
            "expected_inflow": total_inflow,
            "expected_outflow": total_outflow,
            "predicted_balance": predicted_balance,
            "daily_forecast": daily.round(2).to_dict(orient="records"),
        }

    def save(self, models_dir: str):
        """Save Prophet models to disk."""
        os.makedirs(models_dir, exist_ok=True)
        joblib.dump(self.inflow_model, os.path.join(models_dir, "inflow_prophet.pkl"))
        joblib.dump(self.outflow_model, os.path.join(models_dir, "outflow_prophet.pkl"))
        print(f"[forecast] Saved to {models_dir}")

    def load(self, models_dir: str):
        """Load Prophet models from disk."""
        self.inflow_model = joblib.load(
            os.path.join(models_dir, "inflow_prophet.pkl")
        )
        self.outflow_model = joblib.load(
            os.path.join(models_dir, "outflow_prophet.pkl")
        )
        print("[forecast] Loaded from disk")
