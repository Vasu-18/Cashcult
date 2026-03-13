"use client"

import { useRouter } from "next/navigation"
import type { Alert } from "@/types/index"
import { formatDate, getSeverityColor, getSeverityDotColor, getSeverityLabel, getSeverityTextColor } from "@/lib/utils"

interface AlertCardProps {
  alert: Alert
}

export default function AlertCard({ alert }: AlertCardProps) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push("/dashboard/timeline")}
      className={`relative border rounded-2xl p-5 cursor-pointer hover:translate-x-1 transition-all duration-200 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:rounded-l-2xl before:bg-red-400 ${getSeverityColor(alert.severity)}`}
    >
      <div className={`flex items-center gap-2 text-[10px] font-bold tracking-[1.5px] uppercase mb-2 ${getSeverityTextColor(alert.severity)}`}>
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${getSeverityDotColor(alert.severity)}`} />
        {getSeverityLabel(alert.severity)}
      </div>

      <h3 className="text-[14px] font-bold text-white mb-1">{alert.title}</h3>
      <p className="text-[12px] text-slate-400 leading-relaxed">{alert.description}</p>

      <div className="flex items-center justify-between mt-3">
        <span className={`text-[11px] font-bold flex items-center gap-1 ${getSeverityTextColor(alert.severity)}`}>
          View on Timeline →
        </span>
        <span className="text-[10px] text-slate-600">
          Detected {formatDate(alert.detectedAt)}
        </span>
      </div>
    </div>
  )
}
