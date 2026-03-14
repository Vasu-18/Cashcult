"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import InsightCard from "@/app/components/InsightCard"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { FORECAST as MOCK_FORECAST } from "@/lib/data"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, Calendar, DollarSign, Clock, Shield } from "lucide-react"

// Chart Constants
const CHART_W = 700
const CHART_H = 260
const PAD_L = 50
const PAD_R = 10
const PAD_T = 20
const PAD_B = 30
const MIN_VAL = 0
const MAX_VAL = 2800000
const SAFE_THRESHOLD = 800000

function scaleX(i: number, total: number) {
  return PAD_L + (i / (total - 1)) * (CHART_W - PAD_L - PAD_R)
}

function scaleY(val: number) {
  return PAD_T + CHART_H - ((val - MIN_VAL) / (MAX_VAL - MIN_VAL)) * CHART_H
}

function buildPath(points: number[]) {
  return points.map((v, i) => `${i === 0 ? "M" : "L"}${scaleX(i, points.length).toFixed(1)},${scaleY(v).toFixed(1)}`).join(" ")
}

function buildArea(points: number[]) {
  const path = buildPath(points)
  const last = points.length - 1
  return `${path} L${scaleX(last, points.length).toFixed(1)},${(PAD_T + CHART_H).toFixed(1)} L${PAD_L},${(PAD_T + CHART_H).toFixed(1)} Z`
}

function formatCurrency(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`
  return `₹${val.toFixed(0)}`
}

const Y_LABELS = [
  { val: 2500000, label: "₹25L" },
  { val: 2000000, label: "₹20L" },
  { val: 1500000, label: "₹15L" },
  { val: 1000000, label: "₹10L" },
  { val: 500000, label: "₹5L" },
]

export default function TimelinePage() {
  const router = useRouter()
  const [range, setRange] = useState("30d")
  const [tooltip, setTooltip] = useState<{ x: number; y: number; event: any } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [mlForecast, setMlForecast] = useState<any>(null)

  const realInvoices = useQuery(api.data.getInvoices, { userId: "user-placeholder" as any })
  const realInsights = useQuery(api.data.getInsights, { userId: "user-placeholder" as any })
  const realExpenses = useQuery(api.data.getExpenses, { userId: "user-placeholder" as any })
  
  useEffect(() => {
    async function fetchForecast() {
      try {
        const res = await fetch("http://localhost:8000/forecast")
        if (res.ok) {
          const data = await res.json()
          if (!data.error) {
            setMlForecast({
              dates: data.dates.map((d: string) => {
                const parts = d.split('-')
                return parts.length > 2 ? `${parts[1]}/${parts[2]}` : d
              }),
              p25: data.p25_risk,
              p50: data.p50_likely,
              p75: data.p75_optimistic
            })
          }
        }
      } catch (err) {
        console.error("Forecasting Error:", err)
      }
    }
    fetchForecast()
  }, [])

  const baseForecast = mlForecast || { 
    dates: [...MOCK_FORECAST.dates],
    p25: [...MOCK_FORECAST.p25],
    p50: [...MOCK_FORECAST.p50],
    p75: [...MOCK_FORECAST.p75]
  }

  const total = baseForecast.dates.length

  // --- Compute real metrics ---
  const metrics = useMemo(() => {
    const invoices = realInvoices || []
    const expenses = realExpenses || []
    
    const totalInflow = invoices.filter((i: any) => i.paymentStatus === "paid").reduce((a: number, i: any) => a + i.invoiceAmount, 0)
    const expectedInflow = invoices.filter((i: any) => i.paymentStatus === "outstanding").reduce((a: number, i: any) => a + i.invoiceAmount, 0)
    const overdueInflow = invoices.filter((i: any) => i.paymentStatus === "overdue").reduce((a: number, i: any) => a + i.invoiceAmount, 0)
    const totalExpenses = expenses.reduce((a: number, e: any) => a + e.amount, 0)
    
    const p50End = baseForecast.p50[baseForecast.p50.length - 1] || 0
    const p50Start = baseForecast.p50[0] || 0
    const cashTrend = p50End - p50Start
    const cashTrendPct = p50Start > 0 ? ((cashTrend / p50Start) * 100) : 0

    // Days until cash dips below safe threshold
    const daysUntilCrisis = baseForecast.p25.findIndex((v: number) => v < SAFE_THRESHOLD)
    
    // Cash runway: how many months of expenses the current balance covers
    const monthlyBurn = totalExpenses > 0 ? totalExpenses : 500000
    const runway = p50Start > 0 ? (p50Start / monthlyBurn) : 0

    return {
      currentBalance: p50Start,
      projectedBalance: p50End,
      cashTrend,
      cashTrendPct,
      totalInflow,
      expectedInflow,
      overdueInflow,
      totalExpenses,
      daysUntilCrisis: daysUntilCrisis >= 0 ? daysUntilCrisis * (range === "90d" ? 3 : range === "60d" ? 2 : 1) : -1,
      runway,
      invoiceCount: invoices.length,
      overdueCount: invoices.filter((i: any) => i.paymentStatus === "overdue").length,
      paidCount: invoices.filter((i: any) => i.paymentStatus === "paid").length,
    }
  }, [realInvoices, realExpenses, baseForecast, range])

  // --- Dynamic insight generation ---
  const actionableInsights = useMemo(() => {
    const list: any[] = []
    if (!realInvoices || !realExpenses) return list

    const overdue = realInvoices.filter((i: any) => i.paymentStatus === "overdue")
    const outstanding = realInvoices.filter((i: any) => i.paymentStatus === "outstanding")
    
    // Critical: Cash below threshold in forecast
    if (metrics.daysUntilCrisis >= 0 && metrics.daysUntilCrisis < 14) {
      list.push({
        _id: "cash-crisis",
        severity: "critical",
        date: new Date().toISOString(),
        text: `<strong>Cash crisis in ~${metrics.daysUntilCrisis} days.</strong> Your P25 risk scenario shows balance falling below ₹8L safety threshold. Action: Accelerate collections on outstanding invoices worth ${formatCurrency(metrics.expectedInflow)} or defer non-essential expenses.`,
        clientLabel: "View Invoices"
      })
    }

    // Critical: Overdue invoices
    if (overdue.length > 0) {
      const totalOverdue = overdue.reduce((a: number, i: any) => a + i.invoiceAmount, 0)
      list.push({
        _id: "overdue-alert",
        severity: "critical",
        date: new Date().toISOString(),
        text: `<strong>${formatCurrency(totalOverdue)} stuck in ${overdue.length} overdue invoice${overdue.length > 1 ? 's' : ''}.</strong> This money was expected but hasn't arrived. Send payment reminders or escalate to account managers this week.`,
        clientLabel: "View Overdue"
      })
    }

    // Warning: High burn rate
    if (metrics.totalExpenses > metrics.totalInflow * 0.8 && metrics.totalExpenses > 0) {
      list.push({
        _id: "burn-rate",
        severity: "warning",
        date: new Date().toISOString(),
        text: `<strong>Your expenses (${formatCurrency(metrics.totalExpenses)}) are close to your income.</strong> Consider reviewing recurring expenses or negotiating better terms with vendors. Current runway: ${metrics.runway.toFixed(1)} months.`,
        clientLabel: "Manage Expenses"
      })
    }

    // Warning: Large outstanding amount
    if (outstanding.length > 2 && metrics.expectedInflow > 500000) {
      list.push({
        _id: "collections",
        severity: "warning",
        date: new Date().toISOString(),
        text: `<strong>${formatCurrency(metrics.expectedInflow)} in ${outstanding.length} outstanding invoices.</strong> Send early payment reminders to clients. Even 10% faster collection can improve cash position by ${formatCurrency(metrics.expectedInflow * 0.1)}.`,
        clientLabel: "Follow Up"
      })
    }

    // Info: Healthy collections
    if (metrics.paidCount > 2) {
      list.push({
        _id: "positive-trend",
        severity: "info",
        date: new Date().toISOString(),
        text: `<strong>Good news — ${metrics.paidCount} invoices cleared.</strong> Total collected: ${formatCurrency(metrics.totalInflow)}. Keep momentum by reviewing remaining outstanding invoices and setting automated reminders for due dates.`,
        clientLabel: "View Collected"
      })
    }

    // Info: Forecast trend
    if (metrics.cashTrendPct > 5) {
      list.push({
        _id: "growth-trend",
        severity: "info",
        date: new Date().toISOString(),
        text: `<strong>Cash position improving by ${metrics.cashTrendPct.toFixed(0)}% over the forecast period.</strong> Consider allocating surplus to an emergency fund (target 3 months of expenses ≈ ${formatCurrency(metrics.totalExpenses * 3)}).`,
        clientLabel: "Plan Ahead"
      })
    }

    return list
  }, [realInvoices, realExpenses, metrics])

  const dynamicEvents = realInvoices?.map((inv: any, i: number) => {
    const idx = (i % (baseForecast.dates.length - 2)) + 1
    return {
      dateIdx: idx,
      label: inv.clientId,
      amount: `₹${(inv.invoiceAmount / 100000).toFixed(1)}L`,
      prob: inv.paymentStatus === "paid" ? "Paid" : inv.paymentStatus === "overdue" ? "Overdue" : "Outstanding",
      color: inv.paymentStatus === "paid" ? "#00E5A0" : inv.paymentStatus === "overdue" ? "#FF4D6A" : "#FFB547",
      clientId: inv.clientId,
      status: inv.paymentStatus
    }
  }) || []

  return (
    <div className="flex flex-col gap-5">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={<DollarSign size={16} />}
          label="Projected Balance"
          value={formatCurrency(metrics.projectedBalance)}
          sub={`${metrics.cashTrendPct >= 0 ? "+" : ""}${metrics.cashTrendPct.toFixed(1)}% from today`}
          trend={metrics.cashTrendPct >= 0 ? "up" : "down"}
        />
        <SummaryCard
          icon={<ArrowUpRight size={16} />}
          label="Expected Inflow"
          value={formatCurrency(metrics.expectedInflow + metrics.overdueInflow)}
          sub={`${metrics.overdueCount > 0 ? `${metrics.overdueCount} overdue` : "All on track"}`}
          trend={metrics.overdueCount > 0 ? "warn" : "up"}
        />
        <SummaryCard
          icon={<ArrowDownRight size={16} />}
          label="Committed Outflow"
          value={formatCurrency(metrics.totalExpenses)}
          sub={`Runway: ${metrics.runway > 0 ? metrics.runway.toFixed(1) : "N/A"} months`}
          trend="neutral"
        />
        <SummaryCard
          icon={<Shield size={16} />}
          label="Cash Safety"
          value={metrics.daysUntilCrisis >= 0 ? `${metrics.daysUntilCrisis}d to risk` : "Safe"}
          sub={metrics.daysUntilCrisis >= 0 ? "Below ₹8L threshold" : "Above safe threshold"}
          trend={metrics.daysUntilCrisis >= 0 && metrics.daysUntilCrisis < 14 ? "down" : "up"}
        />
      </div>

      {/* Range Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-[#131920] border border-white/[0.06] rounded-[10px] p-1 gap-0.5">
          {["30d", "60d", "90d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-[8px] text-xs font-bold transition-all duration-150 ${
                range === r ? "bg-[#1A2232] text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {[
            { color: "bg-emerald-400", label: "Optimistic" },
            { color: "bg-blue-400", label: "Most Likely" },
            { color: "bg-red-400 opacity-60", label: "Worst Case" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <div className={`w-2 h-2 rounded-sm ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Chart + Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        {/* Chart */}
        <div className="bg-[#0D1117] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[14px] font-bold text-white">Cash Position Forecast</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">3 scenarios based on ML prediction of payment patterns</p>
            </div>
            <p className="text-[11px] text-slate-500">{baseForecast.dates[0]} — {baseForecast.dates[baseForecast.dates.length - 1]}</p>
          </div>

          <div className="relative overflow-visible">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CHART_W} ${PAD_T + CHART_H + PAD_B}`}
              className="w-full"
              style={{ height: 300 }}
            >
              <defs>
                <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5A0" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#00E5A0" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4D6A" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#FF4D6A" stopOpacity="0" />
                </linearGradient>
              </defs>

              {Y_LABELS.map(({ val, label }) => (
                <g key={val}>
                  <line x1={PAD_L} y1={scaleY(val)} x2={CHART_W - PAD_R} y2={scaleY(val)} stroke="#1E293B" strokeWidth="1" />
                  <text x="4" y={scaleY(val) + 4} fontSize="8" fill="#334155" fontFamily="monospace">{label}</text>
                </g>
              ))}

              {/* Safe threshold line */}
              <line x1={PAD_L} y1={scaleY(SAFE_THRESHOLD)} x2={CHART_W - PAD_R} y2={scaleY(SAFE_THRESHOLD)} stroke="#FF4D6A" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
              <text x={PAD_L + 4} y={scaleY(SAFE_THRESHOLD) - 4} fontSize="8" fill="#FF4D6A" opacity="0.6" fontFamily="sans-serif">Safe Threshold ₹8L</text>

              {/* Area fills */}
              <path d={buildArea(baseForecast.p75)} fill="url(#gG)" />
              <path d={buildPath(baseForecast.p75)} fill="none" stroke="#00E5A0" strokeWidth="1.5" opacity="0.7" />

              <path d={buildArea(baseForecast.p50)} fill="url(#gB)" />
              <path d={buildPath(baseForecast.p50)} fill="none" stroke="#3B82F6" strokeWidth="2" />

              <path d={buildArea(baseForecast.p25)} fill="url(#gR)" />
              <path d={buildPath(baseForecast.p25)} fill="none" stroke="#FF4D6A" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.5" />

              {/* Event dots */}
              {dynamicEvents.map((ev: any, i: number) => {
                const x = scaleX(ev.dateIdx, total)
                const y = PAD_T - 8
                return (
                  <g key={i}>
                    <line x1={x} y1={PAD_T} x2={x} y2={PAD_T + CHART_H} stroke={ev.color} strokeWidth="1" strokeDasharray="3,4" opacity="0.25" />
                    <circle
                      cx={x}
                      cy={y}
                      r="7"
                      fill={ev.color}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setTooltip({ x, y: y - 10, event: ev })}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => ev.clientId && router.push(`/dashboard/clients?id=${ev.clientId}`)}
                    />
                  </g>
                )
              })}

              {tooltip && (
                <g>
                  <rect x={tooltip.x - 70} y={tooltip.y - 65} width="150" height="70" rx="8" fill="#131920" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <text x={tooltip.x - 60} y={tooltip.y - 46} fontSize="10" fill="#00E5A0" fontWeight="700" fontFamily="sans-serif">{tooltip.event.label}</text>
                  <text x={tooltip.x - 60} y={tooltip.y - 31} fontSize="9" fill="#94A3B8" fontFamily="sans-serif">Amount: {tooltip.event.amount}</text>
                  <text x={tooltip.x - 60} y={tooltip.y - 17} fontSize="9" fill="#94A3B8" fontFamily="sans-serif">{tooltip.event.prob}</text>
                </g>
              )}

              {baseForecast.dates.map((d: any, i: number) => (
                i % 2 === 0 && (
                  <text key={i} x={scaleX(i, total)} y={PAD_T + CHART_H + 16} fontSize="8" fill="#334155" textAnchor="middle" fontFamily="sans-serif">{d}</text>
                )
              ))}
            </svg>
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> On-time Payment
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Outstanding
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" /> Overdue
            </div>
            <p className="ml-auto text-[11px] text-emerald-400">👆 Hover dots · Click to view client</p>
          </div>
        </div>

        {/* Right Panel: Actionable Insights */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[13px] font-bold text-white flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-400" />
            What You Should Do Next
          </h3>

          {actionableInsights.length > 0 ? actionableInsights.map((insight: any) => (
            <InsightCard
              key={insight._id}
              severity={insight.severity}
              date={insight.date}
              text={insight.text}
              clientId={insight.clientId}
              clientLabel={insight.clientLabel}
            />
          )) : (
            <div className="bg-[#0D1117] border border-emerald-400/20 rounded-xl p-4 text-center">
              <CheckCircle size={20} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-[12px] text-emerald-400 font-bold">All Clear</p>
              <p className="text-[11px] text-slate-500 mt-1">No immediate actions needed. Cash flow looks healthy.</p>
            </div>
          )}

          {/* Invoice insights from ML */}
          {realInsights?.map((insight: any) => (
            <InsightCard
              key={insight._id}
              severity={insight.severity}
              date={insight.date}
              text={insight.text}
              clientId={insight.clientId}
              clientLabel={insight.clientLabel}
            />
          ))}

          {/* Cash Flow Breakdown */}
          <div className="bg-[#0D1117] border border-white/[0.06] rounded-xl p-4">
            <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-slate-500 mb-3">Cash Flow Breakdown</p>
            
            <div className="space-y-3">
              <FlowRow label="Collected (Paid)" amount={metrics.totalInflow} color="text-emerald-400" icon={<CheckCircle size={12} />} />
              <FlowRow label="Outstanding" amount={metrics.expectedInflow} color="text-yellow-400" icon={<Clock size={12} />} />
              <FlowRow label="Overdue" amount={metrics.overdueInflow} color="text-red-400" icon={<AlertTriangle size={12} />} />
              <div className="border-t border-white/[0.06] pt-2">
                <FlowRow label="Total Expenses" amount={metrics.totalExpenses} color="text-blue-400" icon={<ArrowDownRight size={12} />} />
              </div>
              <div className="border-t border-white/[0.06] pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-bold text-white">Net Position</span>
                  <span className={`text-[13px] font-black ${(metrics.totalInflow + metrics.expectedInflow - metrics.totalExpenses) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatCurrency(metrics.totalInflow + metrics.expectedInflow - metrics.totalExpenses)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Model Confidence */}
          <div className="bg-gradient-to-br from-emerald-400/[0.04] to-blue-400/[0.04] border border-emerald-400/10 rounded-xl p-4">
            <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-emerald-400 mb-3">Model Confidence</p>
            {[
              { label: "Prophet Forecast", val: 87, color: "bg-emerald-400" },
              { label: "Payment Risk Model", val: 92, color: "bg-blue-400" },
              { label: "Client Scoring", val: 85, color: "bg-purple-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="mb-2.5">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-white font-bold">{val}%</span>
                </div>
                <div className="h-1 bg-[#131920] rounded-full">
                  <div className={`h-1 rounded-full ${color}`} style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Helper Components ---

function SummaryCard({ icon, label, value, sub, trend }: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  trend: "up" | "down" | "warn" | "neutral"
}) {
  const trendColors = {
    up: "text-emerald-400",
    down: "text-red-400",
    warn: "text-yellow-400",
    neutral: "text-slate-400",
  }
  const bgColors = {
    up: "from-emerald-400/5 to-transparent",
    down: "from-red-400/5 to-transparent",
    warn: "from-yellow-400/5 to-transparent",
    neutral: "from-slate-400/5 to-transparent",
  }

  return (
    <div className={`bg-gradient-to-br ${bgColors[trend]} bg-[#0D1117] border border-white/[0.06] rounded-xl p-4`}>
      <div className={`w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center mb-3 ${trendColors[trend]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[1px] mb-1">{label}</p>
      <p className="text-[18px] font-black text-white">{value}</p>
      <p className={`text-[11px] mt-1 ${trendColors[trend]}`}>{sub}</p>
    </div>
  )
}

function FlowRow({ label, amount, color, icon }: {
  label: string
  amount: number
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className="text-[11px] text-slate-400">{label}</span>
      </div>
      <span className={`text-[12px] font-bold ${color}`}>{formatCurrency(amount)}</span>
    </div>
  )
}
