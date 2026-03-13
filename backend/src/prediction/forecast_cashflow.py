"""
Cash Flow Forecast Module.

Loads the trained Prophet models and produces 30-day cash flow forecasts
with risk alerts and business recommendations.
"""

import os
import sys

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, PROJECT_ROOT)

from src.models.cashflow_forecast_model import CashFlowForecastModel
from src.prediction.alerts import generate_cashflow_recommendations


class CashFlowForecaster:
    """
    Provides cash flow forecasting with integrated risk analysis.
    """

    def __init__(self, models_dir: str = None):
        """
        Args:
            models_dir: Path to saved Prophet models.
        """
        if models_dir is None:
            models_dir = os.path.join(PROJECT_ROOT, "models", "saved_models")

        self.forecast_model = CashFlowForecastModel()
        self.forecast_model.load(models_dir)

    def get_forecast(self, days: int = 30) -> dict:
        """
        Produce a cash flow forecast with alerts and recommendations.

        Args:
            days: Number of days to forecast.

        Returns:
            Dict with forecast data, risk alerts, and recommendations.
        """
        # Get base forecast
        forecast = self.forecast_model.forecast(days=days)

        # Generate recommendations
        recommendations = generate_cashflow_recommendations(
            predicted_balance=forecast["predicted_balance"],
            expected_inflow=forecast["expected_inflow"],
            expected_outflow=forecast["expected_outflow"],
        )

        # Build risk alerts from recommendations
        risk_alerts = []
        for rec in recommendations:
            if rec["severity"] in ("CRITICAL", "WARNING"):
                risk_alerts.append({
                    "severity": rec["severity"],
                    "category": rec["category"],
                    "message": rec["message"],
                })

        forecast["risk_alerts"] = risk_alerts
        forecast["recommendations"] = recommendations

        return forecast
