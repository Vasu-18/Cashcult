"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, Plus } from "lucide-react"
import ClientProfile from "@/app/components/ClientProfile"
import AddClientModal from "@/app/components/modals/AddClientModal"
import { CLIENTS } from "@/lib/data"
import { getRiskColor } from "@/lib/utils"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Client } from "@/types/index"

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-500 text-sm">Loading clients...</div>}>
      <ClientsContent />
    </Suspense>
  )
}

function ClientsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addClientOpen, setAddClientOpen] = useState(false)

  const realInvoices = useQuery(api.data.getInvoices, { userId: "user-placeholder" as any })

  // Derive unique clients from invoices
  const dynamicClients = useMemo(() => {
    if (!realInvoices?.length) return CLIENTS;

    const clientsMap = new Map();
    
    realInvoices.forEach((inv : any) => {
      const name = inv.clientId; // We stored name here
      if (!clientsMap.has(name)) {
        clientsMap.set(name, {
          id: name,
          clientName: name,
          riskLevel: inv.paymentStatus === "overdue" ? "high" : "low",
          paymentTermsDays: 30,
          onTimeProbability: inv.paymentStatus === "overdue" ? 45 : 85,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          // Use some mock data for fields we don't track yet
          avgDaysLate: 4,
          onTimeRate: 92,
          avgInvoiceSize: inv.invoiceAmount,
          largestInvoice: inv.invoiceAmount,
          paymentPersonality: "Reliable",
          behavioralInsight: "Payment patterns are shifting. Recommendation: Shorten Net terms to 15 days.",
          history: [
            { date: inv.invoiceIssueDate, amount: inv.invoiceAmount, daysVariance: 0, type: "ontime" }
          ]
        });
      } else {
        // Update risk if any invoice is overdue
        if (inv.paymentStatus === "overdue") {
          const c = clientsMap.get(name);
          c.riskLevel = "high";
          c.onTimeProbability = 45;
        }
      }
    });

    return Array.from(clientsMap.values());
  }, [realInvoices]);

  useEffect(() => {
    const id = searchParams.get("id")
    if (id) {
        setSelectedId(id)
    } else if (dynamicClients.length > 0 && !selectedId) {
        setSelectedId(dynamicClients[0].id)
    }
  }, [searchParams, dynamicClients])

  const filtered = dynamicClients.filter((c) =>
    c.clientName.toLowerCase().includes(search.toLowerCase())
  )

  const selected = dynamicClients.find((c) => c.id === selectedId) ?? dynamicClients[0]

  const handleSelect = (id: string) => {
    setSelectedId(id)
    router.push(`/dashboard/clients?id=${id}`, { scroll: false })
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-5 h-auto lg:h-[calc(100vh-112px)]">
      <div className="bg-[#0D1117] border border-white/[0.06] rounded-2xl p-4 flex flex-col overflow-hidden">
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-8 pr-3 py-2.5 rounded-[9px] border border-white/[0.06] bg-[#131920] text-white text-[13px] placeholder-slate-600 outline-none focus:border-emerald-400/30 transition-colors"
          />
        </div>

        <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-slate-600 px-1 mb-2">
          {filtered.length} Clients · Sorted by Risk
        </p>

        <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
          {filtered.map((client) => (
            <div
              key={client.id}
              onClick={() => handleSelect(client.id)}
              className={`flex items-center gap-3 p-2.5 rounded-[10px] cursor-pointer transition-all duration-150 border ${
                selectedId === client.id
                  ? "bg-emerald-400/[0.08] border-emerald-400/15"
                  : "border-transparent hover:bg-white/[0.03]"
              }`}
            >
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center font-black text-[13px] flex-shrink-0"
                style={{ backgroundColor: client.color, color: client.id === "rajan" ? "#000" : "#fff" }}
              >
                {client.clientName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-semibold truncate ${selectedId === client.id ? "text-emerald-400" : "text-white"}`}>
                  {client.clientName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {client.riskLevel === "high" ? "High" : client.riskLevel === "medium" ? "Med" : "Low"} Risk · Net {client.paymentTermsDays}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${getRiskColor(client.riskLevel)}`}>
                {client.riskLevel === "medium" ? "Med" : client.riskLevel.charAt(0).toUpperCase() + client.riskLevel.slice(1)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 mt-2 border-t border-white/[0.06]">
          <button
            onClick={() => setAddClientOpen(true)}
            className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 hover:opacity-70 transition-opacity"
          >
            <Plus size={12} /> Add New Client
          </button>
        </div>
      </div>

      <div className="bg-[#0D1117] border border-white/[0.06] rounded-2xl p-4 md:p-7 overflow-y-auto">
        <ClientProfile client={selected} />
      </div>

      <AddClientModal open={addClientOpen} onClose={() => setAddClientOpen(false)} />
    </div>
  )
}
