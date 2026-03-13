import type { Client } from "@/types/index"
import {
  formatCurrency,
  getPersonalityColor,
  getVarianceColor,
  getVarianceTextColor,
  formatVariance,
  getProbabilityColor,
} from "@/lib/utils"

interface ClientProfileProps {
  client: Client
}

const VAR_WIDTH: Record<string, number> = { late: 70, ontime: 55, early: 85 }

export default function ClientProfile({ client }: ClientProfileProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-5 pb-5 border-b border-white/[0.06]">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0"
          style={{ backgroundColor: client.color, color: client.id === "rajan" ? "#000" : "#fff" }}
        >
          {client.clientName[0]}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{client.clientName}</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Net {client.paymentTermsDays} · Avg invoice {formatCurrency(client.avgInvoiceSize)}
          </p>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border mt-2 ${getPersonalityColor(client.paymentPersonality)}`}>
            {client.paymentPersonality}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[11px] text-slate-500 mb-1">On-time probability</p>
          <p className={`text-4xl font-bold ${getProbabilityColor(client.onTimeProbability)}`}>
            {client.onTimeProbability}%
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">current invoice</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { val: `${client.avgDaysLate > 0 ? "+" : ""}${client.avgDaysLate}d`, label: "Avg days late/early", color: client.avgDaysLate > 0 ? "text-red-400" : "text-emerald-400" },
          { val: `${client.onTimeRate}%`, label: "On-time rate", color: "text-white" },
          { val: formatCurrency(client.avgInvoiceSize), label: "Avg invoice", color: "text-white" },
          { val: formatCurrency(client.largestInvoice), label: "Largest invoice", color: "text-white" },
        ].map(({ val, label, color }) => (
          <div key={label} className="bg-[#131920] border border-white/[0.06] rounded-xl p-3.5 text-center">
            <p className={`text-xl font-bold ${color}`}>{val}</p>
            <p className="text-[10px] text-slate-500 mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-500/[0.06] to-purple-500/[0.06] border border-blue-500/15 rounded-xl p-4">
        <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-blue-400 mb-2">
          ML Behavioral Insight
        </p>
        <p
          className="text-[13px] text-slate-400 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: client.behavioralInsight.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white'>$1</strong>") }}
        />
      </div>

      <div>
        <p className="text-[11px] font-bold tracking-[0.5px] uppercase text-slate-500 mb-3">
          Payment History
        </p>
        <div className="flex flex-col">
          {client.history.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
            >
              <span className="text-[11px] text-slate-500 w-16 flex-shrink-0">{item.date}</span>
              <span className="text-[12px] font-bold text-white w-14 flex-shrink-0">
                {formatCurrency(item.amount)}
              </span>
              <div className="flex-1 h-1.5 bg-[#131920] rounded-full relative">
                <div
                  className={`absolute left-0 top-0 h-1.5 rounded-full ${getVarianceColor(item.type)}`}
                  style={{ width: `${VAR_WIDTH[item.type]}%` }}
                />
              </div>
              <span className={`text-[11px] font-bold w-14 text-right ${getVarianceTextColor(item.type)}`}>
                {formatVariance(item.daysVariance)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
