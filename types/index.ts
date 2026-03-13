export type PaymentStatus = "paid" | "outstanding" | "overdue"
export type RiskLevel = "low" | "medium" | "high"
export type PaymentPersonality = "Chronic Late Payer" | "Early Bird" | "Reliable" | "Inconsistent"
export type AlertSeverity = "critical" | "warning" | "info"

export interface Invoice {
  id: string
  clientId: string
  clientName: string
  invoiceAmount: number
  invoiceIssueDate: string
  dueDate: string
  paidDate: string | null
  paymentStatus: PaymentStatus
}

export interface Client {
  id: string
  clientName: string
  paymentTermsDays: number
  riskLevel: RiskLevel
  onTimeProbability: number
  avgDaysLate: number
  onTimeRate: number
  avgInvoiceSize: number
  largestInvoice: number
  paymentPersonality: PaymentPersonality
  behavioralInsight: string
  color: string
  history: PaymentHistoryItem[]
}

export interface PaymentHistoryItem {
  date: string
  amount: number
  daysVariance: number
  type: "early" | "ontime" | "late"
}

export interface Alert {
  id: string
  severity: AlertSeverity
  title: string
  description: string
  detectedAt: string
}

export interface ForecastData {
  dates: string[]
  p25: number[]
  p50: number[]
  p75: number[]
}

export interface HealthScore {
  total: number
  cashRunway: number
  invoiceHealth: number
  clientReliability: number
  cashBuffer: number
  insight?: string
}

export interface DashboardMetrics {
  cashOnHand: number
  expectedInflow30d: number
  committedOutflow30d: number
  netCashChange: number
}

export interface Expense {
  id: string
  description: string
  amount: number
  dueDate: string
  category: string
  isRecurring: boolean
}
