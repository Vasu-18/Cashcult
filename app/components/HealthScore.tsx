import type { HealthScore } from "@/types/index"

const BARS = [
  { label: "Cash Runway", key: "cashRunway" },
  { label: "Invoice Health", key: "invoiceHealth" },
  { label: "Client Reliability", key: "clientReliability" },
  { label: "Cash Buffer", key: "cashBuffer" },
] as const

interface HealthScoreCardProps {
  data: HealthScore
}

export default function HealthScoreCard({ data }: HealthScoreCardProps) {
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (data.total / 100) * circumference

  const statusLabel = data.total >= 70 ? "Healthy" : data.total >= 40 ? "At Risk" : "Critical"

  const statusColor = data.total >= 70 ? "text-emerald-400" : data.total >= 40 ? "text-yellow-400" : "text-red-400"
  const strokeColor = data.total >= 70 ? "#34d399" : data.total >= 40 ? "#fbbf24" : "#f87171"
  const shadowColor = data.total >= 70 ? "rgba(52, 211, 153, 0.4)" : data.total >= 40 ? "rgba(251, 191, 36, 0.4)" : "rgba(248, 113, 113, 0.4)"

  return (
    <div className="relative overflow-hidden bg-[#0D1117] border border-white/[0.06] rounded-2xl p-6 group hover:border-white/10 transition-colors duration-300">
      {/* Subtle Background Glow */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 opacity-20 blur-[50px] pointer-events-none rounded-full ${
        data.total >= 70 ? "bg-emerald-500" : data.total >= 40 ? "bg-yellow-500" : "bg-red-500"
      }`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <p className="text-[12px] font-bold tracking-[1.5px] uppercase text-white/50">
            Cash Health Score
          </p>
          <div className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[10px] text-white/40">
            Next 60 Days
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6 mb-6">
          <div className="relative w-[100px] h-[100px] flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
              <circle
                cx="45"
                cy="45"
                r="38"
                fill="none"
                stroke={strokeColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 4px ${shadowColor})` }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col shadow-xl">
              <span className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight drop-shadow-sm leading-none px-1">
                {data.total}
              </span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <p className={`text-lg font-black tracking-wide ${statusColor}`}>{statusLabel}</p>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                ↑ 4 pts
              </span>
            </div>
            <p className="text-[13px] text-slate-400 leading-relaxed max-w-[200px]">
              {data.insight || (data.total >= 70 ? "Your cash position is strong. Consider reinvesting." : "Monitor upcoming payments closely to avoid runway dips.")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {BARS.map(({ label, key }) => {
            const val = data[key]
            const pb = (val / 25) * 100
            const bC = pb >= 80 ? "bg-emerald-400" : pb >= 50 ? "bg-yellow-400" : "bg-red-400"
            const tC = pb >= 80 ? "text-emerald-400" : pb >= 50 ? "text-yellow-400" : "text-red-400"

            return (
              <div key={key} className="flex items-center gap-4">
                <span className="text-[11px] font-bold text-slate-400 w-[110px] flex-shrink-0 uppercase tracking-widest">{label}</span>
                <div className="flex-1 h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${bC} w-0 transition-all duration-1000 ease-out`}
                    style={{ width: `${pb}%` }}
                  />
                </div>
                <span className={`text-[12px] font-bold w-6 text-right ${tC}`}>{val}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
