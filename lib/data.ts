import type {
  Invoice,
  Client,
  Alert,
  ForecastData,
  HealthScore,
  DashboardMetrics,
  Expense,
} from "@/types/index"

export const METRICS: DashboardMetrics = {
  cashOnHand: 1420000,
  expectedInflow30d: 2380000,
  committedOutflow30d: 1850000,
  netCashChange: 530000,
}

export const HEALTH_SCORE: HealthScore = {
  total: 71,
  cashRunway: 20,
  invoiceHealth: 15,
  clientReliability: 13,
  cashBuffer: 23,
}

export const ALERTS: Alert[] = [
  {
    id: "alert-001",
    severity: "critical",
    title: "Payroll risk on April 1st",
    description:
      "Client Mehta's ₹5L invoice due Mar 20 — based on 11 past invoices, Mehta pays 14 days late on amounts above ₹3L. Cash may drop below ₹8L threshold between Mar 28–Apr 4.",
    detectedAt: "2026-03-10",
  },
  {
    id: "alert-002",
    severity: "warning",
    title: "Priya Solutions 61% on-time probability",
    description: "Monitor closely — if delayed 5+ days combined with Mehta, cash runway drops to 6 days.",
    detectedAt: "2026-03-11",
  },
  {
    id: "alert-003",
    severity: "info",
    title: "Rajan Exports paid ₹3.1L — 3 days early",
    description: "Cash position improved. Buffer restored above safe threshold.",
    detectedAt: "2026-03-09",
  },
]

export const INVOICES: Invoice[] = [
  {
    id: "INV-001",
    clientId: "mehta",
    clientName: "Mehta Corp",
    invoiceAmount: 500000,
    invoiceIssueDate: "2026-03-01",
    dueDate: "2026-03-20",
    paidDate: null,
    paymentStatus: "overdue",
  },
  {
    id: "INV-002",
    clientId: "priya",
    clientName: "Priya Solutions",
    invoiceAmount: 280000,
    invoiceIssueDate: "2026-03-05",
    dueDate: "2026-03-28",
    paidDate: null,
    paymentStatus: "outstanding",
  },
  {
    id: "INV-003",
    clientId: "rajan",
    clientName: "Rajan Exports",
    invoiceAmount: 310000,
    invoiceIssueDate: "2026-03-08",
    dueDate: "2026-04-05",
    paidDate: null,
    paymentStatus: "outstanding",
  },
  {
    id: "INV-004",
    clientId: "nova",
    clientName: "Nova Retail",
    invoiceAmount: 180000,
    invoiceIssueDate: "2026-02-28",
    dueDate: "2026-03-15",
    paidDate: "2026-03-12",
    paymentStatus: "paid",
  },
  {
    id: "INV-005",
    clientId: "arya",
    clientName: "Arya Tech",
    invoiceAmount: 750000,
    invoiceIssueDate: "2026-01-10",
    dueDate: "2026-03-10",
    paidDate: "2026-03-09",
    paymentStatus: "paid",
  },
  {
    id: "INV-006",
    clientId: "mehta",
    clientName: "Mehta Corp",
    invoiceAmount: 120000,
    invoiceIssueDate: "2026-02-15",
    dueDate: "2026-03-01",
    paidDate: "2026-03-03",
    paymentStatus: "paid",
  },
]

export const CLIENTS: Client[] = [
  {
    id: "mehta",
    clientName: "Mehta Corp",
    paymentTermsDays: 30,
    riskLevel: "high",
    onTimeProbability: 34,
    avgDaysLate: 14,
    onTimeRate: 27,
    avgInvoiceSize: 420000,
    largestInvoice: 780000,
    paymentPersonality: "Chronic Late Payer",
    color: "#FF4D6A",
    behavioralInsight:
      "Mehta Corp pays an average of 14 days late on invoices above ₹3L, but pays within 5 days on smaller amounts. This pattern has held across 11 out of 11 invoices in the last 2 years. Confidence: Very High.",
    history: [
      { date: "Feb 2026", amount: 500000, daysVariance: 16, type: "late" },
      { date: "Jan 2026", amount: 120000, daysVariance: 2, type: "ontime" },
      { date: "Dec 2025", amount: 480000, daysVariance: 12, type: "late" },
      { date: "Nov 2025", amount: 360000, daysVariance: 18, type: "late" },
      { date: "Oct 2025", amount: 210000, daysVariance: 4, type: "ontime" },
    ],
  },
  {
    id: "priya",
    clientName: "Priya Solutions",
    paymentTermsDays: 45,
    riskLevel: "medium",
    onTimeProbability: 61,
    avgDaysLate: 6,
    onTimeRate: 61,
    avgInvoiceSize: 290000,
    largestInvoice: 450000,
    paymentPersonality: "Inconsistent",
    color: "#FFB547",
    behavioralInsight:
      "Priya Solutions shows high variance in payment timing — some invoices arrive 3 days early, others up to 18 days late. No clear pattern tied to invoice size. Recommend building in a 7-day buffer when forecasting Priya payments.",
    history: [
      { date: "Feb 2026", amount: 280000, daysVariance: -3, type: "early" },
      { date: "Jan 2026", amount: 320000, daysVariance: 14, type: "late" },
      { date: "Dec 2025", amount: 190000, daysVariance: 2, type: "ontime" },
      { date: "Nov 2025", amount: 250000, daysVariance: 18, type: "late" },
      { date: "Oct 2025", amount: 300000, daysVariance: -1, type: "ontime" },
    ],
  },
  {
    id: "rajan",
    clientName: "Rajan Exports",
    paymentTermsDays: 30,
    riskLevel: "low",
    onTimeProbability: 88,
    avgDaysLate: -2,
    onTimeRate: 88,
    avgInvoiceSize: 310000,
    largestInvoice: 520000,
    paymentPersonality: "Reliable",
    color: "#00E5A0",
    behavioralInsight:
      "Rajan Exports is your most reliable payer — pays 2 days early on average. Has never exceeded 4 days late across 14 invoices. Safe to include Rajan payments as near-certain in your cash forecast.",
    history: [
      { date: "Feb 2026", amount: 310000, daysVariance: -4, type: "early" },
      { date: "Jan 2026", amount: 280000, daysVariance: -1, type: "early" },
      { date: "Dec 2025", amount: 350000, daysVariance: 2, type: "ontime" },
      { date: "Nov 2025", amount: 220000, daysVariance: -3, type: "early" },
      { date: "Oct 2025", amount: 410000, daysVariance: 4, type: "ontime" },
    ],
  },
  {
    id: "nova",
    clientName: "Nova Retail",
    paymentTermsDays: 15,
    riskLevel: "low",
    onTimeProbability: 94,
    avgDaysLate: -5,
    onTimeRate: 94,
    avgInvoiceSize: 180000,
    largestInvoice: 300000,
    paymentPersonality: "Early Bird",
    color: "#3B82F6",
    behavioralInsight:
      "Nova Retail consistently pays 4–6 days before due date. Appears to batch payments every Friday. Schedule invoices to arrive on Monday for fastest processing.",
    history: [
      { date: "Feb 2026", amount: 180000, daysVariance: -6, type: "early" },
      { date: "Jan 2026", amount: 220000, daysVariance: -4, type: "early" },
      { date: "Dec 2025", amount: 150000, daysVariance: -5, type: "early" },
      { date: "Nov 2025", amount: 280000, daysVariance: -3, type: "early" },
      { date: "Oct 2025", amount: 120000, daysVariance: 1, type: "ontime" },
    ],
  },
  {
    id: "arya",
    clientName: "Arya Tech",
    paymentTermsDays: 60,
    riskLevel: "medium",
    onTimeProbability: 55,
    avgDaysLate: 9,
    onTimeRate: 55,
    avgInvoiceSize: 620000,
    largestInvoice: 910000,
    paymentPersonality: "Inconsistent",
    color: "#8B5CF6",
    behavioralInsight:
      "Arya Tech has long payment terms (Net 60) and frequently extends beyond that by 7–12 days on larger invoices. Pattern suggests internal approval delays for invoices above ₹5L. Consider splitting large invoices into milestones.",
    history: [
      { date: "Jan 2026", amount: 750000, daysVariance: 11, type: "late" },
      { date: "Nov 2025", amount: 420000, daysVariance: 3, type: "ontime" },
      { date: "Sep 2025", amount: 880000, daysVariance: 14, type: "late" },
      { date: "Jul 2025", amount: 510000, daysVariance: 7, type: "late" },
      { date: "May 2025", amount: 600000, daysVariance: 2, type: "ontime" },
    ],
  },
]

export const EXPENSES: Expense[] = [
  { id: "exp-001", description: "Office Rent", amount: 120000, dueDate: "2026-03-25", category: "Rent", isRecurring: true },
  { id: "exp-002", description: "Salaries (6 staff)", amount: 820000, dueDate: "2026-04-01", category: "Salary", isRecurring: true },
  { id: "exp-003", description: "Adobe Suite", amount: 18000, dueDate: "2026-03-20", category: "Software", isRecurring: true },
  { id: "exp-004", description: "AWS Server", amount: 45000, dueDate: "2026-03-22", category: "Software", isRecurring: false },
]

export const FORECAST: ForecastData = {
  dates: ["Mar 9","Mar 14","Mar 19","Mar 24","Mar 29","Apr 3","Apr 8","Apr 13","Apr 18","Apr 23","Apr 28","May 3"],
  p25: [1420000,1380000,1520000,1680000,1280000,820000,1350000,1580000,1720000,1850000,1980000,2100000],
  p50: [1420000,1450000,1620000,1820000,1480000,1100000,1650000,1880000,2020000,2150000,2280000,2400000],
  p75: [1420000,1520000,1720000,1960000,1680000,1380000,1950000,2180000,2320000,2450000,2580000,2700000],
}
