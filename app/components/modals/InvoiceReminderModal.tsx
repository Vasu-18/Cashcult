"use client"

import { useState, useEffect, useMemo } from "react"
import { Copy, RefreshCw, Check, X, ChevronDown } from "lucide-react"
import Modal from "./Modal"
import type { Invoice } from "@/types/index"
import { CLIENTS } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { CONSTANTS } from "@/lib/config"

interface InvoiceReminderModalProps {
  open: boolean
  onClose: () => void
  invoices: Invoice[]
}

export default function InvoiceReminderModal({ open, onClose, invoices }: InvoiceReminderModalProps) {
  const [emailContent, setEmailContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("")
  
  // Setup User Context
  const { user } = useUser()
  const clerkId = user?.id
  const currentUser = useQuery(
    api.users.getCurrentUser,
    clerkId ? { clerkId } : ("skip" as any),
  ) as any

  const senderName = user?.firstName || user?.fullName || "Your Name"
  const businessName: string = (currentUser && currentUser.businessName) || user?.fullName || "Your Business"

  // Setup Invoice Context
  const overdueInvoices = useMemo(() => {
    return invoices.filter(i => i.paymentStatus === "overdue")
  }, [invoices])

  useEffect(() => {
    if (open && overdueInvoices.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(overdueInvoices[0].id)
    }
  }, [open, overdueInvoices, selectedInvoiceId])

  const invoice = useMemo(() => {
    return overdueInvoices.find(i => i.id === selectedInvoiceId) || overdueInvoices[0]
  }, [overdueInvoices, selectedInvoiceId])

  // Context Computations
  const contextData = useMemo(() => {
    if (!invoice) return null
    const today = new Date()
    const dueDate = new Date(invoice.dueDate)
    const diffTime = Math.abs(today.getTime() - dueDate.getTime())
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const client = CLIENTS.find(c => c.clientName === invoice.clientName || c.id === invoice.clientId)
    
    return {
      daysOverdue,
      paymentPersonality: client?.paymentPersonality || "Unknown",
      avgDaysLate: client?.avgDaysLate || 0
    }
  }, [invoice])

  // Email Generator Function
  const generateEmail = async () => {
    if (!invoice || !contextData) return
    setIsLoading(true)
    setIsError(false)

    const userMessage = `Write a payment reminder email for:
- Client to Email: ${invoice.clientName}
- Our Company Name: ${businessName}
- Sender Name: ${senderName}
- Invoice ID: ${invoice.id}  
- Amount: ${formatCurrency(invoice.invoiceAmount)}
- Due Date: ${invoice.dueDate}
- Days Overdue: ${contextData.daysOverdue}
- Client Payment History: ${contextData.paymentPersonality} — typically pays ${contextData.avgDaysLate} days late

Write a highly impressive, articulate, and professional payment reminder email. The tone should be firm, polished, and maintain excellent business rapport. Provide structured details about the invoice, a formal request for payment status, and a polite but clear call to action. Ensure it is appropriately detailed and slightly longer than a basic reminder. Ensure you explicitly use the Sender Name and Our Company Name in the formal sign-off, and address the Client respectfully by name.`

    try {
      const response = await fetch(CONSTANTS.ROUTES.API_ANTHROPIC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          systemPrompt: CONSTANTS.PROMPTS.REMINDER_SYSTEM,
          fallbackData: { clientName: invoice.clientName, businessName, senderName }
        })
      })

      if (!response.ok) throw new Error("Failed to generate email via internal API")
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      setEmailContent(data.text || "Failed to parse response.")
    } catch (err) {
      console.error(err)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Effect Bindings
  useEffect(() => {
    if (open && invoice) {
      generateEmail()
    } else if (!open) {
      // Reset state gracefully when modal closes
      setEmailContent("")
      setIsError(false)
      setIsLoading(false)
      setCopied(false)
      setSelectedInvoiceId("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedInvoiceId])

  const handleCopy = async () => {
    if (!emailContent) return
    await navigator.clipboard.writeText(emailContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Render Handlers
  if (open && overdueInvoices.length === 0) {
    return <AllCaughtUpView open={open} onClose={onClose} />
  }

  if (!invoice || !contextData) return null

  return (
    <Modal open={open} onClose={onClose} title="Smart Reminders" width="w-[600px]">
      <div className="flex flex-col">

        {overdueInvoices.length > 1 && (
          <InvoiceSelector 
            invoices={overdueInvoices}
            selectedId={selectedInvoiceId}
            onSelect={setSelectedInvoiceId}
          />
        )}

        <InvoiceContextStrip 
          invoice={invoice} 
          daysOverdue={contextData.daysOverdue} 
          paymentPersonality={contextData.paymentPersonality} 
        />

        <EmailEditor 
          emailContent={emailContent}
          onChange={setEmailContent}
          isLoading={isLoading}
          isError={isError}
          onRetry={generateEmail}
        />

        <ActionButtons 
          onClose={onClose}
          onRegenerate={generateEmail}
          onCopy={handleCopy}
          isLoading={isLoading}
          isError={isError}
          copied={copied}
        />
      </div>
    </Modal>
  )
}

// ----------------------------------------------------------------------
// MODULAR SUB-COMPONENTS
// ----------------------------------------------------------------------

function AllCaughtUpView({ open, onClose }: { open: boolean, onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Smart Reminders" width="w-[400px]">
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
          <Check size={24} className="text-emerald-400" />
        </div>
        <h3 className="text-[16px] font-bold text-white mb-2">All Caught Up!</h3>
        <p className="text-[13px] text-slate-400 mb-6">You have no overdue invoices to send reminders for.</p>
        <button 
          onClick={onClose} 
          className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 text-[13px] font-bold transition-all"
        >
          Great
        </button>
      </div>
    </Modal>
  )
}

function InvoiceSelector({ invoices, selectedId, onSelect }: { invoices: Invoice[], selectedId: string, onSelect: (id: string) => void }) {
  return (
    <div className="mb-5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
        Select Overdue Invoice ({invoices.length})
      </label>
      <div className="relative">
        <select 
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full bg-[#131920] border border-white/[0.06] rounded-xl pl-4 pr-10 py-3 text-[13px] font-bold text-white outline-none cursor-pointer focus:border-emerald-400/40 appearance-none transition-colors"
        >
          {invoices.map(inv => (
            <option key={inv.id} value={inv.id}>
              {inv.clientName} (#{inv.id}) — {formatCurrency(inv.invoiceAmount)}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  )
}

function InvoiceContextStrip({ invoice, daysOverdue, paymentPersonality }: { invoice: Invoice, daysOverdue: number, paymentPersonality: string }) {
  return (
    <div className="bg-[#131920] border border-white/[0.06] rounded-xl p-4 mb-5 flex flex-wrap gap-4 items-center justify-between">
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Client</p>
        <p className="text-[13px] font-bold text-white">{invoice.clientName}</p>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Invoice</p>
        <p className="text-[13px] font-mono text-white">#{invoice.id}</p>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Amount Overdue</p>
        <p className="text-[13px] font-bold text-red-400">{formatCurrency(invoice.invoiceAmount)}</p>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Overdue</p>
        <p className="text-[13px] font-bold text-red-400">{daysOverdue} Days</p>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Behavior</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-500/30 text-orange-400 bg-orange-500/10">
          {paymentPersonality}
        </span>
      </div>
    </div>
  )
}

function EmailEditor({ emailContent, onChange, isLoading, isError, onRetry }: { emailContent: string, onChange: (val: string) => void, isLoading: boolean, isError: boolean, onRetry: () => void }) {
  return (
    <div className="mb-5 relative">
      <p className="text-[12px] font-bold text-slate-400 mb-2">Generated Draft</p>
      {isLoading ? (
        <div className="bg-[#131920] border border-white/[0.06] rounded-xl p-4 w-full min-h-[200px] flex flex-col gap-3 animate-pulse">
          <div className="h-4 bg-white/5 rounded w-3/4" />
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-5/6" />
          <div className="h-4 bg-white/5 rounded w-1/2 mt-4" />
          <div className="h-4 bg-white/5 rounded w-2/3" />
        </div>
      ) : isError ? (
        <div className="bg-[#131920] border border-red-500/20 rounded-xl p-6 w-full min-h-[200px] flex flex-col items-center justify-center text-center">
          <p className="text-red-400 text-[13px] mb-3">Failed to generate AI reminder.</p>
          <button 
            onClick={onRetry} 
            className="text-xs font-bold bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            Retry Generation
          </button>
        </div>
      ) : (
        <textarea
          value={emailContent}
          onChange={(e) => onChange(e.target.value)}
          className="bg-[#131920] border border-white/[0.06] rounded-xl p-4 text-sm text-slate-300 w-full min-h-[200px] focus:outline-none focus:border-emerald-400/40 transition-colors resize-y"
        />
      )}
    </div>
  )
}

function ActionButtons({ onClose, onRegenerate, onCopy, isLoading, isError, copied }: { onClose: () => void, onRegenerate: () => void, onCopy: () => void, isLoading: boolean, isError: boolean, copied: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-[10px] text-[13px] font-bold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
      >
        Close
      </button>
      <button
        onClick={onRegenerate}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold text-emerald-400 hover:bg-emerald-400/10 border border-emerald-400/20 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        Regenerate
      </button>
      <button
        onClick={onCopy}
        disabled={isLoading || isError}
        className="flex items-center gap-2 px-5 py-2 rounded-[10px] text-[13px] font-black bg-emerald-400 text-black hover:bg-emerald-300 transition-colors disabled:opacity-50"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied!" : "Copy Email"}
      </button>
    </div>
  )
}
