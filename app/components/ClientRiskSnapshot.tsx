"use client"

import { useRouter } from "next/navigation"
import type { Client } from "@/types/index"
import { formatCurrency, formatDate, getRiskColor, getProbabilityColor } from "@/lib/utils"

interface ClientRiskSnapshotProps {
  clients: Client[]
  invoices: { clientId: string; invoiceAmount: number; dueDate: string }[]
}

export default function ClientRiskSnapshot({ clients, invoices }: ClientRiskSnapshotProps) {
  const router = useRouter()
  const topThree = clients.slice(0, 3)

  const getClientDue = (clientId: string) => {
    const inv = invoices.find((i) => i.clientId === clientId)
    return inv
      ? `${formatCurrency(inv.invoiceAmount)} due ${formatDate(inv.dueDate)}`
      : "No outstanding invoice"
  }

  return (
    <div className="bg-[#0D1117] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-white">Client Risk Snapshot</h3>
        <button
          onClick={() => router.push("/dashboard/clients")}
          className="text-[11px] font-bold text-emerald-400 hover:opacity-70 transition-opacity"
        >
          View all
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        {topThree.map((client) => (
          <div
            key={client.id}
            onClick={() => router.push(`/dashboard/clients?id=${client.id}`)}
            className="flex items-center gap-3 p-2.5 rounded-[10px] cursor-pointer hover:bg-white/[0.03] transition-all duration-150"
          >
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center font-black text-[13px] flex-shrink-0"
              style={{ backgroundColor: client.color, color: client.id === "rajan" ? "#000" : "#fff" }}
            >
              {client.clientName[0]}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white">{client.clientName}</p>
              <p className="text-[11px] text-slate-500">{getClientDue(client.id)}</p>
            </div>

            <div className="text-right mr-2">
              <p className={`text-[13px] font-bold ${getProbabilityColor(client.onTimeProbability)}`}>
                {client.onTimeProbability}%
              </p>
              <p className="text-[10px] text-slate-600">on time</p>
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getRiskColor(client.riskLevel)}`}>
              {client.riskLevel === "medium" ? "Med" : client.riskLevel.charAt(0).toUpperCase() + client.riskLevel.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
