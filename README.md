<div align="center">

# 💰 CashCult

**AI-Powered Cash Flow Intelligence for Small Businesses**

*Stop guessing. Start knowing.*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)](https://python.org/)
[![Convex](https://img.shields.io/badge/Convex-Realtime_DB-orange)](https://convex.dev/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-purple?logo=clerk)](https://clerk.com/)

</div>

---

CashCult helps small business owners understand their cash flow — not through confusing spreadsheets, but through intelligent predictions and plain-English recommendations. Upload your invoices, and our ML models tell you who's likely to pay late, when your cash might dip below safety, and exactly what to do about it.

## ✨ Features

### 📄 Smart Invoice Processing
- Upload PDFs and automatically extract client name, amount, dates, and invoice ID
- Supports multiple formats — Indian ₹, USD $, EUR €, various date styles
- Extracts data from both text-based and table-based invoice layouts

### 🤖 ML-Powered Predictions
- **Payment Risk Scoring** — XGBoost model predicts which clients will pay late
- **Delay Forecasting** — Estimates how many days a payment will be delayed
- **Cash Flow Forecast** — Prophet-based 30/60/90-day probabilistic forecast with optimistic, likely, and worst-case scenarios

### 📊 Actionable Dashboard
- **Summary Cards** — Projected balance, expected inflows, committed outflows, cash runway
- **"What You Should Do Next"** — Plain-English recommendations, not just graphs
- **Cash Flow Breakdown** — Clear view of collected, outstanding, overdue, and expenses
- **Client Intelligence** — Risk scores and payment behavior analysis per client

### ⚙️ Configurable Settings
- Business profile with industry selection
- Safe cash threshold alerts
- Payment terms (Net 7 to Net 90)
- Notification preferences with toggle controls
- Display customization (date format, number format, currency)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React, TypeScript, TailwindCSS |
| **Auth** | Clerk |
| **Database** | Convex (real-time sync) |
| **ML Backend** | Python, FastAPI, XGBoost, Prophet |
| **PDF Parsing** | pdfplumber, python-dateutil |
| **Charts** | Custom SVG (zero dependencies) |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A [Convex](https://convex.dev) account
- A [Clerk](https://clerk.com) account

### 1. Clone the repo

```bash
git clone https://github.com/Vasu-18/Cashcult.git
cd Cashcult
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Set up environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
```

### 5. Initialize Convex

```bash
npx convex dev
```

This will deploy the schema and start watching for changes.

### 6. Start the ML backend

```bash
cd backend
python main.py
```

The FastAPI server runs at `http://localhost:8000`.

### 7. Start the frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
CashCult/
├── app/                    # Next.js app router
│   ├── components/         # UI components (Header, Sidebar, Modals)
│   ├── dashboard/          # Dashboard pages
│   │   ├── page.tsx        # Main dashboard
│   │   ├── timeline/       # Cash flow forecast page
│   │   └── clients/        # Client intelligence page
│   └── (auth)/             # Clerk auth pages
├── convex/                 # Convex schema, mutations, queries
│   ├── schema.ts           # Database schema
│   ├── data.ts             # Data mutations & queries
│   └── users.ts            # User management
├── backend/                # Python ML backend
│   ├── main.py             # FastAPI server + PDF extraction
│   ├── src/prediction/     # ML model classes
│   └── models/             # Trained model files (.pkl)
├── lib/                    # Shared utilities and mock data
└── public/                 # Static assets
```

## 🧠 How the ML Works

1. **Invoice Upload** → PDF text is extracted using pdfplumber with 15+ regex patterns
2. **Feature Engineering** → Client ID, amount, dates, and payment history are prepared
3. **Risk Prediction** → XGBoost classifies payment risk and predicts delay days
4. **Forecast** → Prophet generates a probabilistic cash position forecast
5. **Insight Generation** → Model outputs are translated into actionable business recommendations

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze-invoice` | Upload and analyze a PDF invoice |
| `GET` | `/forecast` | Get 30-day cash flow forecast |
| `POST` | `/predict-payment` | Predict payment delay for a client |

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ at International Hack 2026**

</div>
