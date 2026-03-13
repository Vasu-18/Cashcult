interface MetricCardProps {
  icon: string
  value: string
  label: string
  trend: string
  trendUp?: boolean
  trendNeutral?: boolean
  accent: "green" | "blue" | "red" | "yellow"
}

const ACCENT_MAP = {
  green: {
    icon: "bg-emerald-400/10",
    glow: "before:bg-emerald-400",
    trend: "text-emerald-400",
  },
  blue: {
    icon: "bg-blue-400/10",
    glow: "before:bg-blue-400",
    trend: "text-blue-400",
  },
  red: {
    icon: "bg-red-400/10",
    glow: "before:bg-red-400",
    trend: "text-red-400",
  },
  yellow: {
    icon: "bg-yellow-400/10",
    glow: "before:bg-yellow-400",
    trend: "text-yellow-400",
  },
}

export default function MetricCard({
  icon,
  value,
  label,
  trend,
  trendUp,
  trendNeutral,
  accent,
}: MetricCardProps) {
  const colors = ACCENT_MAP[accent]

  const trendColor = trendNeutral
    ? "text-slate-500"
    : trendUp
    ? "text-emerald-400"
    : "text-red-400"

  return (
    <div className="relative bg-[#0D1117] border border-white/[0.06] rounded-2xl p-5 overflow-hidden hover:border-white/10 hover:-translate-y-0.5 transition-all duration-200">
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-base mb-4 ${colors.icon}`}>
        {icon}
      </div>
      <div className="text-[26px] font-bold text-white mb-1 tracking-tight">{value}</div>
      <div className="text-[12px] text-slate-500 mb-3">{label}</div>
      <div className={`text-[11px] font-bold ${trendColor}`}>{trend}</div>
    </div>
  )
}
