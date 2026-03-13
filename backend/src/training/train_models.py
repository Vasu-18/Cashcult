"""
Model Training Pipeline.

End-to-end pipeline: load data → clean → engineer features →
train all models → evaluate → save to models/saved_models/.
"""

import os
import sys
import json
from datetime import datetime

# Add project root to path
PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, PROJECT_ROOT)

from src.data_processing.loader import load_all_datasets
from src.data_processing.cleaner import clean_all
from src.features.feature_engineering import build_feature_dataset
from src.models.client_risk_model import ClientRiskModel
from src.models.delay_prediction_model import DelayPredictionModel
from src.models.cashflow_forecast_model import CashFlowForecastModel


def run_training_pipeline(data_dir: str = None, models_dir: str = None):
    """
    Execute the full training pipeline.

    Steps:
        1. Load all datasets from data/
        2. Clean and preprocess
        3. Engineer features
        4. Train client risk model
        5. Train delay prediction model
        6. Train cash flow forecast model
        7. Save all models
        8. Save evaluation report

    Args:
        data_dir: Path to data directory (default: PROJECT_ROOT/data).
        models_dir: Path to save models (default: PROJECT_ROOT/models/saved_models).
    """
    if data_dir is None:
        data_dir = os.path.join(PROJECT_ROOT, "data")
    if models_dir is None:
        models_dir = os.path.join(PROJECT_ROOT, "models", "saved_models")

    os.makedirs(models_dir, exist_ok=True)

    print("=" * 60)
    print("  CASH FLOW INTELLIGENCE — TRAINING PIPELINE")
    print("=" * 60)

    # --- Step 1: Load Data ---
    print("\n📂 Step 1: Loading datasets...")
    datasets = load_all_datasets(data_dir)

    if "invoices" not in datasets:
        raise FileNotFoundError(
            "invoices.csv is required. Run data/generate_data.py first."
        )

    # --- Step 2: Clean Data ---
    print("\n🧹 Step 2: Cleaning data...")
    datasets = clean_all(datasets)

    # --- Step 3: Feature Engineering ---
    print("\n🔧 Step 3: Engineering features...")
    feature_df = build_feature_dataset(
        invoices=datasets["invoices"],
        clients=datasets.get("clients"),
    )

    # Save feature dataset for reference
    feature_path = os.path.join(data_dir, "features.csv")
    feature_df.to_csv(feature_path, index=False)
    print(f"  Feature dataset saved to {feature_path}")

    evaluation_report = {
        "timestamp": datetime.now().isoformat(),
        "data_stats": {
            "total_invoices": len(datasets["invoices"]),
            "total_clients": len(datasets.get("clients", [])),
            "total_transactions": len(datasets.get("transactions", [])),
            "feature_dataset_rows": len(feature_df),
        },
    }

    # --- Step 4: Train Client Risk Model ---
    print("\n" + "=" * 60)
    print("  🎯 Step 4: Training Client Risk Model")
    print("=" * 60)
    risk_model = ClientRiskModel()
    risk_results = risk_model.train(feature_df)
    risk_model.save(models_dir)
    evaluation_report["client_risk_model"] = risk_results

    # --- Step 5: Train Payment Delay Model ---
    print("\n" + "=" * 60)
    print("  ⏱️  Step 5: Training Payment Delay Model")
    print("=" * 60)
    delay_model = DelayPredictionModel()
    delay_results = delay_model.train(feature_df)
    delay_model.save(models_dir)
    evaluation_report["delay_prediction_model"] = delay_results

    # --- Step 6: Train Cash Flow Forecast Model ---
    print("\n" + "=" * 60)
    print("  📈 Step 6: Training Cash Flow Forecast Model")
    print("=" * 60)
    if "transactions" in datasets:
        forecast_model = CashFlowForecastModel()
        forecast_results = forecast_model.train(datasets["transactions"])
        forecast_model.save(models_dir)
        evaluation_report["cashflow_forecast_model"] = forecast_results
    else:
        print("  ⚠️  Skipping — transactions.csv not found")

    # --- Step 7: Save Evaluation Report ---
    report_path = os.path.join(models_dir, "evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(evaluation_report, f, indent=2, default=str)

    print("\n" + "=" * 60)
    print("  ✅ TRAINING COMPLETE")
    print("=" * 60)
    print(f"\n  Models saved to: {models_dir}")
    print(f"  Evaluation report: {report_path}")
    print(f"\n  Evaluation Summary:")
    print(f"  {'Model':<30} {'Best Metric':<20}")
    print(f"  {'-'*50}")

    if "client_risk_model" in evaluation_report:
        best_risk = max(
            risk_results.items(), key=lambda x: x[1].get("f1_score", 0)
        )
        print(f"  Client Risk Model            F1={best_risk[1]['f1_score']:.4f} ({best_risk[0]})")

    if "delay_prediction_model" in evaluation_report:
        best_delay = min(
            delay_results.items(), key=lambda x: x[1].get("mae", float("inf"))
        )
        print(f"  Delay Prediction Model        MAE={best_delay[1]['mae']:.4f} ({best_delay[0]})")

    if "cashflow_forecast_model" in evaluation_report:
        for flow_type in ["inflow", "outflow"]:
            if flow_type in forecast_results:
                m = forecast_results[flow_type]
                print(f"  Forecast ({flow_type:<7})          MAPE={m['mape']:.2f}%")

    return evaluation_report


if __name__ == "__main__":
    run_training_pipeline()
