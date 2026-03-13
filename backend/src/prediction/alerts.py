"""
Priority Alert System & Decision Intelligence Engine.

- Computes priority scores for invoices based on risk, delay probability, and amount.
- Classifies alerts as High / Medium / Low priority.
- Generates business recommendations based on predicted cash flow risks.
"""

import pandas as pd
import numpy as np
from typing import List, Dict


# Priority thresholds (percentile-based cutoffs on the priority score)
HIGH_PRIORITY_THRESHOLD = 0.7
MEDIUM_PRIORITY_THRESHOLD = 0.3

# Cash flow risk thresholds
LOW_BALANCE_THRESHOLD = 100000       # ₹1,00,000
NEGATIVE_BALANCE_THRESHOLD = 0
LATE_INVOICE_RATIO_THRESHOLD = 0.4   # 40% of invoices predicted late


def compute_priority_score(
    invoice_amount: float,
    delay_probability: float,
    client_risk_score: float,
) -> float:
    """
    Compute a normalized priority score for an invoice.

    Formula: invoice_amount * delay_probability * client_risk_score
    Then normalize to 0–1 range using a sigmoid-like scaling.

    Args:
        invoice_amount: Amount of the invoice.
        delay_probability: Probability of payment delay (0–1).
        client_risk_score: Client risk score (0–1).

    Returns:
        Priority score between 0 and 1.
    """
    raw_score = invoice_amount * delay_probability * client_risk_score

    # Normalize: use log-scaling to keep scores in a usable range
    # Median invoice ≈ ₹80K, with delay_prob × risk ≈ 0.25 → raw ≈ 20K
    normalized = 1 / (1 + np.exp(-((np.log1p(raw_score) - 10) / 2)))

    return round(float(normalized), 4)


def classify_priority(priority_score: float) -> str:
    """
    Classify a priority score into High / Medium / Low.

    Args:
        priority_score: Score between 0 and 1.

    Returns:
        Priority level string.
    """
    if priority_score >= HIGH_PRIORITY_THRESHOLD:
        return "HIGH"
    elif priority_score >= MEDIUM_PRIORITY_THRESHOLD:
        return "MEDIUM"
    else:
        return "LOW"


def generate_invoice_alerts(
    invoices_with_predictions: List[Dict],
) -> List[Dict]:
    """
    Generate prioritized alerts for a list of invoices with predictions.

    Each item should contain:
        - invoice_id, client_id, invoice_amount
        - predicted_delay_days, delay_probability, client_risk_score

    Returns:
        List of alert dictionaries sorted by priority (highest first).
    """
    alerts = []

    for inv in invoices_with_predictions:
        amount = inv.get("invoice_amount", 0)
        delay_prob = inv.get("delay_probability", 0.5)
        risk_score = inv.get("client_risk_score", 0.5)

        priority_score = compute_priority_score(amount, delay_prob, risk_score)
        priority_level = classify_priority(priority_score)

        alert = {
            "invoice_id": inv.get("invoice_id", "unknown"),
            "client_id": inv.get("client_id", "unknown"),
            "invoice_amount": amount,
            "predicted_delay_days": inv.get("predicted_delay_days", 0),
            "delay_probability": delay_prob,
            "client_risk_score": risk_score,
            "priority_score": priority_score,
            "priority_level": priority_level,
            "message": _build_alert_message(inv, priority_level),
        }
        alerts.append(alert)

    # Sort by priority score descending
    alerts.sort(key=lambda x: x["priority_score"], reverse=True)
    return alerts


def _build_alert_message(inv: dict, priority_level: str) -> str:
    """Build a human-readable alert message."""
    amount = inv.get("invoice_amount", 0)
    client = inv.get("client_id", "Unknown")
    delay = inv.get("predicted_delay_days", 0)

    if priority_level == "HIGH":
        return (
            f"⚠️ HIGH PRIORITY: ₹{amount:,.0f} payment from {client} "
            f"likely delayed by {delay:.0f} days. Immediate follow-up recommended."
        )
    elif priority_level == "MEDIUM":
        return (
            f"📋 MEDIUM PRIORITY: ₹{amount:,.0f} from {client} "
            f"may be delayed by {delay:.0f} days. Monitor closely."
        )
    else:
        return (
            f"ℹ️ LOW PRIORITY: ₹{amount:,.0f} from {client} — "
            f"expected on time or minor delay."
        )


# =============================================================================
# Decision Intelligence Engine
# =============================================================================


def generate_cashflow_recommendations(
    predicted_balance: float,
    expected_inflow: float,
    expected_outflow: float,
    alerts: List[Dict] = None,
) -> List[Dict]:
    """
    Generate business recommendations based on predicted cash flow risks.

    Args:
        predicted_balance: Forecasted net balance for the next period.
        expected_inflow: Forecasted total inflow.
        expected_outflow: Forecasted total outflow.
        alerts: List of invoice alerts (optional).

    Returns:
        List of recommendation dictionaries with severity and message.
    """
    recommendations = []

    # Rule 1: Negative predicted balance
    if predicted_balance < NEGATIVE_BALANCE_THRESHOLD:
        recommendations.append({
            "severity": "CRITICAL",
            "category": "cash_flow_risk",
            "message": (
                f"Cash flow deficit predicted: ₹{predicted_balance:,.0f}. "
                f"Urgent action required — consider securing a credit line, "
                f"accelerating collections, or deferring non-essential expenses."
            ),
        })

    # Rule 2: Low balance
    elif predicted_balance < LOW_BALANCE_THRESHOLD:
        recommendations.append({
            "severity": "WARNING",
            "category": "cash_flow_risk",
            "message": (
                f"Predicted cash balance is low: ₹{predicted_balance:,.0f}. "
                f"Consider following up on outstanding invoices and reducing "
                f"discretionary spending."
            ),
        })

    # Rule 3: Outflow exceeds inflow significantly
    if expected_outflow > 0 and expected_inflow / expected_outflow < 0.85:
        recommendations.append({
            "severity": "WARNING",
            "category": "burn_rate",
            "message": (
                f"Outflow (₹{expected_outflow:,.0f}) significantly exceeds "
                f"inflow (₹{expected_inflow:,.0f}). Consider delaying "
                f"new hires or renegotiating vendor terms."
            ),
        })

    # Rule 4: Many high-priority alerts
    if alerts:
        high_alerts = [a for a in alerts if a.get("priority_level") == "HIGH"]
        if len(high_alerts) >= 3:
            total_at_risk = sum(a.get("invoice_amount", 0) for a in high_alerts)
            recommendations.append({
                "severity": "WARNING",
                "category": "payment_delays",
                "message": (
                    f"{len(high_alerts)} high-priority payment delays detected, "
                    f"totaling ₹{total_at_risk:,.0f} at risk. "
                    f"Prioritize follow-ups with these clients."
                ),
            })

        # Rule 5: Large single invoice at risk
        for alert in high_alerts:
            if alert.get("invoice_amount", 0) > 500000:
                recommendations.append({
                    "severity": "CRITICAL",
                    "category": "high_value_risk",
                    "message": (
                        f"High-value invoice ₹{alert['invoice_amount']:,.0f} "
                        f"from {alert.get('client_id', 'unknown')} predicted delayed. "
                        f"Direct escalation recommended."
                    ),
                })

    # Rule 6: Healthy state
    if not recommendations:
        recommendations.append({
            "severity": "INFO",
            "category": "healthy",
            "message": (
                f"Cash flow looks healthy. Predicted balance: ₹{predicted_balance:,.0f}. "
                f"No immediate actions required."
            ),
        })

    return recommendations
