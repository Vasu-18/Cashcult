"""
Cash Flow Intelligence — FastAPI Service.

Exposes ML model predictions via REST endpoints:
    POST /predict-payment     — Predict delay, risk, and priority for an invoice
    GET  /cashflow-forecast   — 30-day cash flow forecast with alerts
    GET  /health              — Health check
"""

import os
import sys
from datetime import date
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Add project root to path
PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, PROJECT_ROOT)

from src.prediction.predict_payment import PaymentPredictor
from src.prediction.forecast_cashflow import CashFlowForecaster

# ---------------------------------------------------------------------------
# App initialization
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Cash Flow Intelligence API",
    description=(
        "ML-powered API for SMEs and Startups to predict payment delays, "
        "assess client risk, and forecast cash flow."
    ),
    version="1.0.0",
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Lazy-load models on first request
# ---------------------------------------------------------------------------

_payment_predictor: Optional[PaymentPredictor] = None
_cashflow_forecaster: Optional[CashFlowForecaster] = None


def get_payment_predictor() -> PaymentPredictor:
    global _payment_predictor
    if _payment_predictor is None:
        models_dir = os.path.join(PROJECT_ROOT, "models", "saved_models")
        data_dir = os.path.join(PROJECT_ROOT, "data")
        _payment_predictor = PaymentPredictor(models_dir, data_dir)
    return _payment_predictor


def get_cashflow_forecaster() -> CashFlowForecaster:
    global _cashflow_forecaster
    if _cashflow_forecaster is None:
        models_dir = os.path.join(PROJECT_ROOT, "models", "saved_models")
        _cashflow_forecaster = CashFlowForecaster(models_dir)
    return _cashflow_forecaster


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class PaymentPredictionRequest(BaseModel):
    """Input schema for the predict-payment endpoint."""
    client_id: str = Field(..., example="C001")
    invoice_amount: float = Field(..., gt=0, example=500000)
    invoice_issue_date: date = Field(..., example="2026-03-01")
    invoice_due_date: date = Field(..., example="2026-04-01")


class PaymentPredictionResponse(BaseModel):
    """Output schema for the predict-payment endpoint."""
    client_id: str
    invoice_amount: float
    invoice_issue_date: date
    invoice_due_date: date
    predicted_delay_days: float
    expected_payment_date: date
    client_risk_score: float
    delay_probability: float
    priority_score: float
    priority_level: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    """Service health check."""
    return {
        "status": "healthy",
        "service": "Cash Flow Intelligence API",
        "version": "1.0.0",
    }


@app.post(
    "/predict-payment",
    response_model=PaymentPredictionResponse,
    summary="Predict payment delay and risk for an invoice",
)
def predict_payment(request: PaymentPredictionRequest):
    """
    Predict payment delay, client risk score, delay probability,
    and priority level for a given invoice.

    **Example request:**
    ```json
    {
        "client_id": "C001",
        "invoice_amount": 500000,
        "invoice_issue_date": "2026-03-01",
        "invoice_due_date": "2026-04-01"
    }
    ```
    """
    try:
        predictor = get_payment_predictor()
        result = predictor.predict(
            client_id=request.client_id,
            invoice_amount=request.invoice_amount,
            invoice_issue_date=request.invoice_issue_date,
            invoice_due_date=request.invoice_due_date,
        )
        return PaymentPredictionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get(
    "/cashflow-forecast",
    summary="Get 30-day cash flow forecast with alerts",
)
def cashflow_forecast(days: int = 30):
    """
    Forecast expected cash inflow, outflow, and balance for the
    next N days (default 30). Includes risk alerts and recommendations.

    **Query Parameters:**
    - `days` (int, optional): Number of days to forecast. Default: 30.
    """
    try:
        forecaster = get_cashflow_forecaster()
        result = forecaster.get_forecast(days=days)
        return {
            "expected_inflow_next_30_days": result["expected_inflow"],
            "expected_outflow_next_30_days": result["expected_outflow"],
            "predicted_balance": result["predicted_balance"],
            "risk_alerts": result["risk_alerts"],
            "recommendations": result["recommendations"],
            "daily_forecast": result["daily_forecast"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Run with: uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
# ---------------------------------------------------------------------------
