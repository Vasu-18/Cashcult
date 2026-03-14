# CashCult — AI-Powered Cash Flow Intelligence for Small Businesses

## Inspiration

Honestly, the idea came from watching my dad stress over cash flow in his small business. He'd have invoices out to clients, expenses piling up, and no real way to know if he could make payroll next month without sitting down with a spreadsheet for hours. That's crazy to us — it's 2026, and small business owners are still guessing when their money will show up.

We realized that big corporations have entire finance teams and expensive tools like SAP or Oracle to predict cash flow. But the small guys — freelancers, agencies, local shops — they get nothing. Just a bank balance and a prayer. So we thought: what if we could bring that same predictive power to a small business owner through a clean, simple dashboard? No finance degree required. Just upload your invoices and let the ML do its thing.

That's how CashCult was born.

## What it does

CashCult is a real-time cash flow intelligence platform. You upload your invoices (PDF or manual entry), and our ML pipeline automatically:

- **Extracts invoice data** from PDFs using smart text parsing — amounts, dates, client names, all pulled automatically
- **Predicts payment delays** using XGBoost trained on historical payment patterns
- **Scores client risk** so you know which clients are likely to pay late
- **Forecasts your cash position** 30/60/90 days out using Prophet, with optimistic, likely, and worst-case scenarios
- **Generates actionable insights** — not just "your cash is low" but "you have ₹5.2L stuck in 3 overdue invoices, follow up with these clients this week"

The dashboard is built to answer one question: **"Will I have enough cash next month?"** — and then tell you exactly what to do about it.

## How we built it

The stack came together pretty naturally:

**Frontend:** Next.js with React — we wanted something fast and modern. The dashboard uses a dark theme with custom SVG charts (no heavy charting library). Everything updates in real-time through Convex, so when you upload an invoice, the dashboard reflects it instantly. Clerk handles auth so we didn't have to build login from scratch.

**Backend (ML):** Python FastAPI server running three ML models:
- **XGBoost** for payment delay prediction and risk scoring — we trained it on synthetic business transaction data with features like invoice amount, client history, and payment terms
- **Prophet** for time-series cash flow forecasting — it picks up seasonal patterns (like end-of-quarter payment rushes)
- A **Kaplan-Meier survival model** for estimating the probability of on-time payment

**PDF Extraction:** This was a fun one. We use pdfplumber to pull text from invoices, then run it through a regex pipeline with 15+ patterns to handle different invoice formats — Indian invoices with ₹ symbols, US invoices with $, different date formats, table-based layouts. It's not perfect, but it handles most real-world invoices surprisingly well.

**Database:** Convex for real-time data sync. It's like having a database that also handles your websockets. When an invoice gets analyzed, the result flows straight to every connected client without us writing any pub/sub code.

**Infrastructure:** The whole thing runs locally — Next.js dev server, Convex cloud, and the Python ML server on port 8000. For the hackathon, this just works.

## Challenges we ran into

Where do we even start.

**PDF parsing is a nightmare.** Every invoice looks different. Some have tables, some have free-form text, some use weird Unicode characters for currency symbols. Our first regex attempt extracted the phone number as the invoice amount. We went through probably 20+ iterations of the extraction logic, adding more patterns each time, before it became reliable enough. Even now, heavily stylized invoices can trip it up.

**The Convex schema was surprisingly strict.** We kept getting validation errors because we were passing `null` for optional fields. Turns out Convex doesn't allow `null` — you either provide a value or don't include the field at all. Small thing, but it caused a lot of head-scratching at 1 AM.

**Getting the ML models to return useful insights, not just numbers.** A risk score of 0.73 means nothing to a business owner. We spent a lot of time figuring out how to translate model outputs into plain English recommendations — "follow up with this client" or "your payroll is at risk, make sure enough invoices clear first." That translation layer was harder than training the models themselves.

**Real-time everything.** Making the frontend update instantly when backend data changes — invoice uploaded, ML processes it, Convex stores results, dashboard updates — all without the user refreshing. Getting that pipeline smooth took effort, especially handling loading states and making sure the UI doesn't flash empty data.

## What we learned

- **ML is only useful if people understand it.** Spending time on the "insight translation" — turning model outputs into human-readable recommendations — was probably the most impactful work we did. A beautiful model that nobody understands is worthless.
- **PDF parsing humbles you.** We went in thinking "how hard can it be, it's just text" and came out respecting every developer who's ever built a document processing pipeline.
- **Convex is genuinely great** for hackathons. Real-time sync without writing subscription logic saved us hours. But you do need to respect its type system — it's strict for a reason.
- **Design matters more than features.** We could have added 10 more ML models, but the time we spent making the dashboard actually readable — clear cards, actionable text, color-coded severity — made a bigger difference than any additional algorithm would have.

## What's next for CashCult

- **Multi-currency support** with real-time exchange rates
- **Automated payment reminders** — email clients directly when invoices are approaching due dates
- **Bank account integration** via Plaid for automatic transaction import
- **Team collaboration** — multiple users per business with role-based access
- **Mobile app** — because business owners check cash flow from their phone, not a laptop

We built CashCult because we genuinely believe small businesses deserve better financial tools. Not dumbed-down versions of enterprise software, but something built from the ground up for how they actually work. This hackathon was just the start.
