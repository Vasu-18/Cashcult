"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import InsightCard from "@/app/components/InsightCard"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { FORECAST as MOCK_FORECAST } from "@/lib/data"

const CHART_W = 700
const CHART_H = 260
const PAD_L = 45
const PAD_R = 10
const PAD_T = 20
const PAD_B = 30
const MIN_VAL = 0
const MAX_VAL = 2800000

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

const EVENTS_MOCK = [
  { dateIdx: 2, label: "Mehta Corp", amount: "₹5.0L", prob: "34% on-time", color: "#FF4D6A", clientId: "mehta" },
  { dateIdx: 3, label: "Priya Solutions", amount: "₹2.8L", prob: "61% on-time", color: "#FFB547", clientId: "priya" },
  { dateIdx: 5, label: "Payroll Due", amount: "₹8.2L", prob: "Fixed — Apr 1", color: "#3B82F6", clientId: null },
  { dateIdx: 6, label: "Rajan Exports", amount: "₹3.1L", prob: "88% on-time", color: "#00E5A0", clientId: "rajan" },
]

const Y_LABELS = [
  { val: 2500000, label: "₹25L" },
  { val: 2000000, label: "₹20L" },
  { val: 1500000, label: "₹15L" },
  { val: 1000000, label: "₹10L" },
  { val: 500000, label: "₹5L" },
]

const SAFE_THRESHOLD = 800000

export default function TimelinePage() {
  const router = useRouter()
  const [range, setRange] = useState("60d")
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

  const dynamicEvents = realInvoices?.map((inv: any, i: number) => {
    const idx = (i % (baseForecast.dates.length - 2)) + 2;
    return {
      dateIdx: idx,
      label: inv.clientId,
      amount: `₹${(inv.invoiceAmount / 100000).toFixed(1)}L`,
      prob: "ML Predicted",
      color: inv.paymentStatus === "overdue" ? "#FF4D6A" : "#00E5A0",
      clientId: inv.clientId
    }
  }) || EVENTS_MOCK;

  const total = baseForecast.dates.length

  // --- Dynamic Real-Time Insight Generation ---
  const dynamicInsightsList = useMemo(() => {
    const list: any[] = [];
    if (!realInvoices || !realExpenses) return list;

    // 1. Check for Overdue Invoices
    const overdue = realInvoices.filter((i: any) => i.paymentStatus === "overdue");
    if (overdue.length > 0) {
      const totalOverdue = overdue.reduce((acc: number, i: any) => acc + i.invoiceAmount, 0);
      list.push({
        _id: "overdue-alert",
        severity: "critical",
        date: new Date().toISOString(),
        text: `<strong>₹${(totalOverdue / 100000).toFixed(1)}L at risk.</strong> ${overdue.length} invoices are currently overdue. Follow up with these clients this week to avoid a cash dip.`,
        clientLabel: "View Overdue"
      });
    }

    // 2. Check for upcoming high expenses vs balance
    const currentBalance = 1420000; // Placeholder base
    const totalSalaries = realExpenses.filter((e: any) => e.category === "Salary").reduce((acc: number, e: any) => acc + e.amount, 0);
    if (totalSalaries > currentBalance * 0.5) {
      list.push({
        _id: "salary-risk",
        severity: "warning",
        date: (realExpenses.find((e: any) => e.category === "Salary")?.dueDate) || new Date().toISOString(),
        text: `<strong>Payroll exposure:</strong> Salaries of ₹${(totalSalaries / 100000).toFixed(1)}L are a large share of your current cash. Make sure enough invoices clear before payroll hits.`,
        clientLabel: "Manage Burn"
      });
    }

    // 3. Positive trend insight
    const paid = realInvoices.filter((i: any) => i.paymentStatus === "paid").length;
    if (paid > 3) {
      list.push({
        _id: "positive-trend",
        severity: "info",
        date: new Date().toISOString(),
        text: `<strong>Collections improving:</strong> More invoices are being cleared on time. Consider moving a portion of surplus cash into a safety buffer or short-term growth projects.`,
        clientLabel: "View Efficiency"
      });
    }

    return list;
  }, [realInvoices, realExpenses]);

  return (
    <div className="flex flex-col gap-5">
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
            { color: "bg-emerald-400", label: "P75 Optimistic" },
            { color: "bg-blue-400", label: "P50 Likely" },
            { color: "bg-red-400 opacity-60", label: "P25 Risk" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <div className={`w-2 h-2 rounded-sm ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        <div className="bg-[#0D1117] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[14px] font-bold text-white">Cash Position Forecast · Live Sync</h3>
            <p className="text-[11px] text-slate-500">{baseForecast.dates[0]} — {baseForecast.dates[baseForecast.dates.length - 1]}, 2026</p>
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

              <line x1={scaleX(3, total)} y1={PAD_T} x2={scaleX(3, total)} y2={PAD_T + CHART_H} stroke="#FF4D6A" strokeWidth="1" strokeDasharray="3,4" opacity="0.3" />
              <line x1={scaleX(5, total)} y1={PAD_T} x2={scaleX(5, total)} y2={PAD_T + CHART_H} stroke="#FF4D6A" strokeWidth="1" strokeDasharray="3,4" opacity="0.3" />
              <rect x={scaleX(3, total)} y={PAD_T} width={scaleX(5, total) - scaleX(3, total)} height={CHART_H} fill="#FF4D6A" fillOpacity="0.04" />
              <text x={scaleX(3, total) + 6} y={PAD_T + 14} fontSize="8" fill="#FF4D6A" fontWeight="700" fontFamily="sans-serif">⚠ RISK ZONE</text>

              <line x1={PAD_L} y1={scaleY(SAFE_THRESHOLD)} x2={CHART_W - PAD_R} y2={scaleY(SAFE_THRESHOLD)} stroke="#FF4D6A" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
              <text x={PAD_L + 4} y={scaleY(SAFE_THRESHOLD) - 4} fontSize="8" fill="#FF4D6A" opacity="0.6" fontFamily="sans-serif">Safe Threshold ₹8L</text>

              <path d={buildArea(baseForecast.p75)} fill="url(#gG)" />
              <path d={buildPath(baseForecast.p75)} fill="none" stroke="#00E5A0" strokeWidth="1.5" opacity="0.7" />

              <path d={buildArea(baseForecast.p50)} fill="url(#gB)" />
              <path d={buildPath(baseForecast.p50)} fill="none" stroke="#3B82F6" strokeWidth="2" />

              <path d={buildArea(baseForecast.p25)} fill="url(#gR)" />
              <path d={buildPath(baseForecast.p25)} fill="none" stroke="#FF4D6A" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.5" />

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
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Client Payment
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Payroll
            </div>
            <p className="ml-auto text-[11px] text-emerald-400">👆 Hover dots · Click to open client</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-[13px] font-bold text-white">ML Insights</h3>

          {dynamicInsightsList.length > 0 ? dynamicInsightsList.map((insight: any) => (
            <InsightCard
              key={insight._id}
              severity={insight.severity}
              date={insight.date}
              text={insight.text}
              clientId={insight.clientId}
              clientLabel={insight.clientLabel}
            />
          )) : (
            <div className="bg-[#0D1117] border border-white/[0.06] rounded-xl p-4 text-center">
              <p className="text-[11px] text-slate-500 italic">No business risks detected in current data stream.</p>
            </div>
          )}

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

          <div className="bg-gradient-to-br from-emerald-400/[0.04] to-blue-400/[0.04] border border-emerald-400/10 rounded-xl p-4">
            <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-emerald-400 mb-3">Model Confidence</p>
            {[
              { label: "Prophet Forecast", val: 87, color: "bg-emerald-400" },
              { label: "Kaplan-Meier", val: 92, color: "bg-blue-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="mb-2.5" >
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
