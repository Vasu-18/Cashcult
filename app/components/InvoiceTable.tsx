import type { Invoice } from "@/types/index"
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils"

interface InvoiceTableProps {
  invoices: Invoice[]
  onAddInvoice: () => void
}

export default function InvoiceTable({ invoices, onAddInvoice }: InvoiceTableProps) {
  return (
    <div className="bg-[#0D1117] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[13px] font-bold text-white">Recent Invoices</h3>
        <button
          onClick={onAddInvoice}
          className="text-[11px] font-bold text-emerald-400 hover:opacity-70 transition-opacity"
        >
          + Add Invoice
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Invoice ID", "Client", "Amount", "Issue Date", "Due Date", "Paid Date", "Status"].map((h) => (
                <th
                  key={h}
                  className="pb-3 text-[10px] font-bold tracking-[0.5px] uppercase text-slate-600 text-left last:text-center whitespace-nowrap pr-4 last:pr-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="py-3 pr-4 text-[12px] font-semibold text-slate-500 font-mono">
                  #{inv.id}
                </td>
                <td className="py-3 pr-4 text-[13px] font-semibold text-white whitespace-nowrap">
                  {inv.clientName}
                </td>
                <td className="py-3 pr-4 text-[13px] font-bold text-white whitespace-nowrap">
                  {formatCurrency(inv.invoiceAmount)}
                </td>
                <td className="py-3 pr-4 text-[12px] text-slate-500 whitespace-nowrap">
                  {formatDate(inv.invoiceIssueDate)}
                </td>
                <td className="py-3 pr-4 text-[12px] text-slate-500 whitespace-nowrap">
                  {formatDate(inv.dueDate)}
                </td>
                <td className="py-3 pr-4 text-[12px] text-slate-500 whitespace-nowrap">
                  {inv.paidDate ? formatDate(inv.paidDate) : "—"}
                </td>
                <td className="py-3 text-center">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusColor(inv.paymentStatus)}`}>
                    {getStatusLabel(inv.paymentStatus)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
