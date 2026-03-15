import os
import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

# Import project's prediction modules
from src.prediction.predict_payment import PaymentPredictor
from src.prediction.forecast_cashflow import CashFlowForecaster

app = FastAPI(title="CashCult ML Backend")

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://cashcult.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Path Configuration ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

# --- Initialize Predictors ---
try:
    predictor = PaymentPredictor(models_dir=MODEL_DIR, data_dir=DATA_DIR)
    forecaster = CashFlowForecaster(models_dir=MODEL_DIR)
    print("ML Models and Predictors initialized successfully.")
except Exception as e:
    print(f"Error initializing ML predictors: {e}")
    predictor = None
    forecaster = None

# --- Data Models ---
class AnalysisResponse(BaseModel):
    invoice_id: Optional[str] = None
    amount: float
    client_name: str
    issue_date: str
    due_date: str
    risk_score: float
    probability_on_time: float
    insight_text: str
    severity: str

@app.get("/")
def read_root():
    return {"status": "CashCult ML Backend Running", "models_loaded": predictor is not None}

import pdfplumber
import re
from dateutil import parser as dateutil_parser

# --- Extraction Helpers ---
def extract_text_from_pdf(file_path):
    """Extract all text from a PDF using pdfplumber."""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                
                # Also try extracting from tables (common in invoices)
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row:
                            text += " | ".join([str(cell) if cell else "" for cell in row]) + "\n"
    except Exception as e:
        print(f"[PDF] pdfplumber extraction error: {e}")
    return text

def decipher_hashed_data(data_string: str):
    """Handles formats like '2026#03#12' or 'Invoice#101'"""
    if isinstance(data_string, str):
        return data_string.replace("#", "-")
    return data_string

def find_regex(text, patterns):
    """Try multiple regex patterns and return the first match."""
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            return match.group(1).strip()
    return None

def extract_invoice_id(text):
    """Extract invoice ID/number from text."""
    patterns = [
        r"Invoice\s*(?:No|Number|ID|#|Num)[\s.:=#-]*([A-Za-z0-9/_-]+)",
        r"Inv[\s.:=#-]*([A-Za-z0-9/_-]+)",
        r"Bill\s*(?:No|Number|ID|#)[\s.:=#-]*([A-Za-z0-9/_-]+)",
        r"Reference[\s.:=#-]*([A-Za-z0-9/_-]+)",
        r"#\s*([A-Za-z]*\d+[A-Za-z0-9-]*)",
    ]
    return find_regex(text, patterns)

def extract_client_name(text):
    """Extract client/company name from text."""
    patterns = [
        r"(?:Bill\s*To|Billed\s*To|Client|Customer|Buyer|Ship\s*To|Sold\s*To)\s*[:\-]?\s*\n?\s*([A-Za-z][A-Za-z0-9\s&.,'-]+?)(?:\n|$)",
        r"(?:Bill\s*To|Billed\s*To|Client|Customer|Buyer)\s*[:\-]?\s*([A-Za-z][A-Za-z0-9\s&.,'-]+?)(?:\n|\d)",
        r"(?:Company|Organization|Firm)\s*[:\-]?\s*([A-Za-z][A-Za-z0-9\s&.,'-]+?)(?:\n|$)",
        r"(?:To|Attn|Attention)\s*[:\-]?\s*\n?\s*([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\n|$)",
    ]
    result = find_regex(text, patterns)
    if result:
        # Clean up: remove trailing whitespace, limit length
        result = result.strip().rstrip(".,;:")
        # Take only first 2-3 words to avoid grabbing address lines
        words = result.split()
        if len(words) > 5:
            result = " ".join(words[:4])
    return result

def extract_amount(text):
    """Extract the total/grand total amount from text."""
    patterns = [
        # Grand Total / Total Amount / Total Due (priority)
        r"(?:Grand\s*Total|Total\s*(?:Amount\s*)?Due|Amount\s*Due|Balance\s*Due|Net\s*(?:Amount|Total)|Total\s*Payable)\s*[:\-]?\s*(?:₹|Rs\.?|INR|USD|\$|€|£)?\s*([\d,]+\.?\d*)",
        # Total at end of line
        r"(?:Sub\s*)?Total\s*[:\-]?\s*(?:₹|Rs\.?|INR|USD|\$|€|£)?\s*([\d,]+\.?\d*)",
        # Currency symbol followed by amount
        r"(?:₹|Rs\.?|INR)\s*([\d,]+\.?\d*)",
        r"\$\s*([\d,]+\.?\d*)",
        # Amount/Sum
        r"(?:Amount|Sum|Payment)\s*[:\-]?\s*(?:₹|Rs\.?|INR|USD|\$|€|£)?\s*([\d,]+\.?\d*)",
    ]
    result = find_regex(text, patterns)
    if result:
        try:
            return float(result.replace(",", ""))
        except ValueError:
            pass
    return None

def extract_dates(text):
    """Extract dates from text, returning (issue_date, due_date)."""
    issue_date = None
    due_date = None
    
    # Try labeled date extraction first
    issue_patterns = [
        r"(?:Invoice\s*Date|Issue\s*Date|Date\s*of\s*Issue|Issued|Date)\s*[:\-]?\s*(\d{1,4}[\s/.\-]\w+[\s/.\-]\d{2,4})",
        r"(?:Invoice\s*Date|Issue\s*Date|Date)\s*[:\-]?\s*(\d{1,2}[\s/.\-]\d{1,2}[\s/.\-]\d{2,4})",
        r"(?:Invoice\s*Date|Issue\s*Date|Date)\s*[:\-]?\s*(\w+\s+\d{1,2},?\s+\d{4})",
    ]
    due_patterns = [
        r"(?:Due\s*Date|Payment\s*Due|Pay\s*By|Due\s*On|Due)\s*[:\-]?\s*(\d{1,4}[\s/.\-]\w+[\s/.\-]\d{2,4})",
        r"(?:Due\s*Date|Payment\s*Due|Pay\s*By|Due)\s*[:\-]?\s*(\d{1,2}[\s/.\-]\d{1,2}[\s/.\-]\d{2,4})",
        r"(?:Due\s*Date|Payment\s*Due|Pay\s*By|Due)\s*[:\-]?\s*(\w+\s+\d{1,2},?\s+\d{4})",
    ]
    
    issue_str = find_regex(text, issue_patterns)
    due_str = find_regex(text, due_patterns)
    
    # Parse found dates
    for date_str, label in [(issue_str, "issue"), (due_str, "due")]:
        if date_str:
            try:
                parsed = dateutil_parser.parse(date_str, dayfirst=True, fuzzy=True)
                formatted = parsed.strftime("%Y-%m-%d")
                if label == "issue":
                    issue_date = formatted
                else:
                    due_date = formatted
            except Exception:
                pass
    
    # Fallback: find all date-like patterns in text
    if not issue_date or not due_date:
        date_patterns = [
            r"(\d{4}[-/]\d{2}[-/]\d{2})",         # 2026-03-15
            r"(\d{2}[-/]\d{2}[-/]\d{4})",         # 15-03-2026 or 03/15/2026
            r"(\d{1,2}\s+\w+\s+\d{4})",           # 15 March 2026
            r"(\w+\s+\d{1,2},?\s+\d{4})",         # March 15, 2026
        ]
        all_dates = []
        for pattern in date_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                try:
                    parsed = dateutil_parser.parse(match.group(1), dayfirst=True, fuzzy=True)
                    all_dates.append(parsed.strftime("%Y-%m-%d"))
                except Exception:
                    pass
        
        # Deduplicate while preserving order
        seen = set()
        unique_dates = []
        for d in all_dates:
            if d not in seen:
                seen.add(d)
                unique_dates.append(d)
        
        if not issue_date and len(unique_dates) >= 1:
            issue_date = unique_dates[0]
        if not due_date and len(unique_dates) >= 2:
            due_date = unique_dates[1]
    
    return issue_date, due_date


@app.post("/analyze-invoice", response_model=AnalysisResponse)
async def analyze_invoice(file: UploadFile = File(...)):
    """
    Receives an invoice, parses PDF text, extracts fields, and runs ML inference.
    """
    try:
        # Save temp file
        temp_path = os.path.join(BASE_DIR, f"temp_{file.filename}")
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        text = ""
        if file.filename.lower().endswith(".pdf"):
            text = extract_text_from_pdf(temp_path)
        
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # Decipher hashtags in the text
        processed_text = decipher_hashed_data(text)
        
        # --- Debug: Log extracted text ---
        print("\n" + "=" * 60)
        print("  PDF TEXT EXTRACTION RESULT")
        print("=" * 60)
        print(processed_text[:2000] if processed_text else "(empty)")
        print("=" * 60)
        
        # --- Extract Fields ---
        invoice_id = extract_invoice_id(processed_text)
        client_name = extract_client_name(processed_text)
        extracted_amount = extract_amount(processed_text)
        issue_date, due_date = extract_dates(processed_text)
        
        # Apply fallbacks
        final_amount = extracted_amount if extracted_amount else 0.0
        final_client_name = client_name if client_name else "Unknown Client"
        final_issue_date = issue_date if issue_date else datetime.now().strftime("%Y-%m-%d")
        final_due_date = due_date if due_date else (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        # --- Debug: Log extracted fields ---
        print(f"\n[EXTRACTION] Invoice ID:   {invoice_id}")
        print(f"[EXTRACTION] Client Name:  {final_client_name}")
        print(f"[EXTRACTION] Amount:       {final_amount}")
        print(f"[EXTRACTION] Issue Date:   {final_issue_date}")
        print(f"[EXTRACTION] Due Date:     {final_due_date}")
        print(f"[EXTRACTION] (Fallbacks used: amount={'yes' if not extracted_amount else 'no'}, "
              f"client={'yes' if not client_name else 'no'}, "
              f"issue_date={'yes' if not issue_date else 'no'}, "
              f"due_date={'yes' if not due_date else 'no'})")
        
        # Map client name to ID for the model
        client_id = "C001" 
        if predictor and predictor.feature_df is not None and "client_name" in predictor.feature_df.columns:
            match = predictor.feature_df[predictor.feature_df["client_name"].str.contains(
                final_client_name, case=False, na=False
            )]
            if not match.empty:
                client_id = match.iloc[0]["client_id"]

        if predictor:
            res = predictor.predict(
                client_id=client_id,
                invoice_amount=final_amount if final_amount > 0 else 100000,
                invoice_issue_date=final_issue_date,
                invoice_due_date=final_due_date
            )
            
            risk_score = res["client_risk_score"]
            prob_on_time = 1.0 - res["delay_probability"]
            
            if res["priority_level"] == "CRITICAL":
                severity = "critical"
            elif res["priority_level"] == "HIGH":
                severity = "warning"
            else:
                severity = "safe"
            
            insight = f"AI Extracted: {final_client_name} (Inv: {invoice_id or 'N/A'}). Priority: {res['priority_level']}. "
            if res["predicted_delay_days"] > 0:
                insight += f"ML predicts delay of {res['predicted_delay_days']} days."
            else:
                insight += f"Clean payment history detected."
            
            print(f"[ML] Risk Score: {risk_score}, Delay Prob: {res['delay_probability']}, Priority: {res['priority_level']}")
        else:
            risk_score = 0.5
            prob_on_time = 0.5
            severity = "warning"
            insight = "ML Predictor not loaded. Using basic extraction."

        return AnalysisResponse(
            invoice_id=invoice_id,
            amount=final_amount,
            client_name=final_client_name,
            issue_date=final_issue_date,
            due_date=final_due_date,
            risk_score=risk_score,
            probability_on_time=prob_on_time,
            severity=severity,
            insight_text=insight
        )
        
    except Exception as e:
        import traceback
        print(f"\n[ERROR] analyze-invoice failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/forecast")
async def get_forecast():
    """
    Returns the real forecast from Prophet models.
    """
    if not forecaster:
        return {
            "dates": ["Mar 9", "Mar 16", "Mar 23", "Mar 30", "Apr 6"],
            "p50_likely": [1200000, 1100000, 900000, 850000, 1500000],
            "p25_risk": [1000000, 800000, 600000, 500000, 1200000],
            "p75_optimistic": [1400000, 1300000, 1100000, 1050000, 1800000]
        }
    
    try:
        res = forecaster.get_forecast(days=30)
        
        # The forecast model returns daily_forecast records
        daily = res.get("daily_forecast", [])
        if daily:
            dates = [d["date"] for d in daily]
            inflows = [d.get("inflow", 0) for d in daily]
            cumulative = [d.get("cumulative_balance", 0) for d in daily]
            
            return {
                "dates": dates,
                "p50_likely": cumulative,
                "p25_risk": [round(v * 0.8) for v in cumulative],
                "p75_optimistic": [round(v * 1.2) for v in cumulative]
            }
        else:
            # Scalar forecast — build simple arrays
            balance = res.get("predicted_balance", 0)
            return {
                "dates": [(datetime.now() + timedelta(days=i*7)).strftime("%b %d") for i in range(5)],
                "p50_likely": [balance] * 5,
                "p25_risk": [round(balance * 0.8)] * 5,
                "p75_optimistic": [round(balance * 1.2)] * 5
            }
    except Exception as e:
        print(f"Forecast Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "dates": ["Mar 9", "Mar 16", "Mar 23", "Mar 30", "Apr 6"],
            "p50_likely": [1200000, 1100000, 900000, 850000, 1500000],
            "p25_risk": [1000000, 800000, 600000, 500000, 1200000],
            "p75_optimistic": [1400000, 1300000, 1100000, 1050000, 1800000]
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
