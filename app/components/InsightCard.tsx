"use client"

import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"

interface InsightCardProps {
  severity: "critical" | "warning" | "safe" | "info"
  date: string
  text: string
  clientId?: string
  clientLabel?: string
}

const SEVERITY_MAP: Record<string, { dot: string; label: string; color: string }> = {
  critical: { dot: "🔴", label: "Critical", color: "text-red-400" },
  warning: { dot: "🟡", label: "Watch", color: "text-yellow-400" },
  safe: { dot: "🟢", label: "Safe", color: "text-emerald-400" },
  info: { dot: "🔵", label: "Insight", color: "text-blue-400" },
}

export default function InsightCard({ severity, date, text, clientId, clientLabel }: InsightCardProps) {
  const router = useRouter()
  const s = SEVERITY_MAP[severity]

  return (
    <div className="bg-[#0D1117] border border-white/[0.06] rounded-xl p-4">
      <div className={`flex items-center gap-1.5 text-[10px] font-bold tracking-[1px] uppercase mb-2 ${s.color}`}>
        {s.dot} {s.label} · {formatDate(date)}
      </div>
      <p
        className="text-[12px] text-slate-400 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: text }}
      />
      {clientId && clientLabel && (
        <button
          onClick={() => router.push(`/dashboard/clients?id=${clientId}`)}
          className="mt-2.5 text-[11px] font-bold text-emerald-400 flex items-center gap-1 hover:opacity-70 transition-opacity"
        >
          → {clientLabel}
        </button>
      )}
    </div>
  )
}
