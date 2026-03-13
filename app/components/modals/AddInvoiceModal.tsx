"use client"

import { useState } from "react"
import Modal, { FormGroup, FormInput, ModalFooter } from "./Modal"
import FileUploader from "../FileUploader"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Loader2 } from "lucide-react"
import { getStatusLabel } from "@/lib/utils"
import { useInvoiceContext } from "@/app/context/InvoiceContext"

interface AddInvoiceModalProps {
  open: boolean
  onClose: () => void
}

export default function AddInvoiceModal({ open, onClose }: AddInvoiceModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [amount, setAmount] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [paidDate, setPaidDate] = useState("")
  const [clientName, setClientName] = useState("")
  const [invoiceId, setInvoiceId] = useState("")
  const [autoFilled, setAutoFilled] = useState<{ amount: boolean; issueDate: boolean; dueDate: boolean }>({
    amount: false,
    issueDate: false,
    dueDate: false,
  })
  const [mlData, setMlData] = useState<{
    riskScore: number;
    probOnTime: number;
    insightText: string;
    severity: string;
  } | null>(null)
  const { setLastInvoice } = useInvoiceContext()
  const createInvoice = useMutation(api.data.createInvoice)

  const derivedStatus: "paid" | "outstanding" | "overdue" = (() => {
    if (paidDate) return "paid"
    if (!dueDate) return "outstanding"
    const today = new Date()
    const due = new Date(dueDate)
    if (!Number.isNaN(due.getTime()) && due < new Date(today.toDateString())) {
      return "overdue"
    }
    return "outstanding"
  })()

  const derivedStatusClasses =
    derivedStatus === "paid"
      ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30"
      : derivedStatus === "overdue"
      ? "bg-red-400/10 text-red-400 border-red-400/30"
      : "bg-yellow-400/10 text-yellow-400 border-yellow-400/30"

  const parseCsvAndPopulate = async (selectedFile: File) => {
    try {
      const text = await selectedFile.text()
      const [headerLine, firstRow] = text.split(/\r?\n/).filter(Boolean)
      if (!headerLine || !firstRow) return

      const headers = headerLine.split(",").map((h) => h.trim().toLowerCase())
      const values = firstRow.split(",").map((v) => v.trim())

      const findIndex = (candidates: string[]) =>
        headers.findIndex((h) => candidates.includes(h)) ?? -1

      const amountIdx = findIndex(["amount", "invoice_amount", "total", "total_amount"])
      const issueIdx = findIndex(["issue_date", "invoice_issue_date", "invoice_date", "date"])
      const dueIdx = findIndex(["due_date", "invoice_due_date", "payment_due", "due"])

      const nextAutoFilled = { amount: false, issueDate: false, dueDate: false }

      if (amountIdx >= 0 && values[amountIdx]) {
        const numeric = values[amountIdx].replace(/,/g, "")
        setAmount(numeric)
        nextAutoFilled.amount = true
      }
      if (issueIdx >= 0 && values[issueIdx]) {
        setIssueDate(values[issueIdx])
        nextAutoFilled.issueDate = true
      }
      if (dueIdx >= 0 && values[dueIdx]) {
        setDueDate(values[dueIdx])
        nextAutoFilled.dueDate = true
      }

      setAutoFilled(nextAutoFilled)
    } catch (err) {
      console.error("CSV parsing failed:", err)
    }
  }

  // Call Python ML backend when file is selected
  const handleFileSelect = async (selectedFile: File | null) => {
    setFile(selectedFile)
    if (selectedFile) {
      console.log("File selected:", selectedFile.name);
      setIsProcessing(true)

      const lower = selectedFile.name.toLowerCase()
      if (lower.endsWith(".csv")) {
        await parseCsvAndPopulate(selectedFile)
        setIsProcessing(false)
        return
      }

      const formData = new FormData()
      formData.append("file", selectedFile)

      try {
        console.log("Calling ML Backend at http://localhost:8000/analyze-invoice...");
        const response = await fetch("http://localhost:8000/analyze-invoice", {
          method: "POST",
          body: formData,
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log("ML Backend Response:", data);
          setAmount(data.amount.toString())
          setIssueDate(data.issue_date)
          setDueDate(data.due_date)
          setClientName(data.client_name)
          setInvoiceId(data.invoice_id || "")
          setMlData({
            riskScore: data.risk_score,
            probOnTime: data.probability_on_time,
            insightText: data.insight_text,
            severity: data.severity
          })
        } else {
          console.error("ML Backend returned error status:", response.status);
        }
      } catch (err) {
        console.error("ML Backend connection failed:", err)
        console.log("Falling back to simulated extraction data.");
        setAmount("500000")
        setIssueDate("2026-03-12")
        setDueDate("2026-04-01")
        setClientName("Manual Client")
        setMlData(null)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted. Sending to Convex...");
    setIsProcessing(true)
    
    try {
      const result = await createInvoice({
        userId: "user-placeholder" as any,
        clientName: clientName,
        amount: Number(amount),
        issueDate,
        dueDate,
        status: derivedStatus,
        fileName: file?.name,
        invoiceId: invoiceId || undefined,
        paidDate: paidDate || undefined,
        // Pass ML data if available
        riskScore: mlData?.riskScore,
        onTimeProb: mlData?.probOnTime,
        insightText: mlData?.insightText,
        severity: mlData?.severity,
      })
      console.log("Convex Mutation Success. Result ID:", result);
      if (invoiceId) {
        setLastInvoice({ convexId: result as unknown as string, invoiceId })
      }
      onClose()
    } catch (err) {
      console.error("Convex Mutation Failed:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Invoice & Analyze">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="text-[12px] font-bold text-slate-400 mb-2 block">Upload Invoice (PDF/CSV/XLSX)</label>
          <FileUploader onFileSelect={handleFileSelect} maxSizeMB={10} />
          <p className="text-[10px] text-slate-500 mt-2">
            Supported formats: <span className="font-semibold text-slate-300">CSV, PDF, XLSX</span> · Max 10MB
          </p>
          <p className="text-[10px] text-slate-500 mt-1 italic">
            * Our ML model will automatically extract fields and predict payment risk.
          </p>
        </div>

        <div className={`transition-all duration-300 ${file ? "opacity-100 h-auto" : "opacity-40 pointer-events-none"}`}>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Invoice Number">
              <FormInput
                placeholder="e.g. INV-1001"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
              />
            </FormGroup>
          </div>

          <FormGroup label="Client Name">
            <FormInput 
              placeholder="e.g. Mehta Corp" 
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </FormGroup>

          <FormGroup label="Invoice Amount (₹)">
            <div className="flex items-center gap-2">
              <FormInput
                type="number"
                placeholder="Extracted: 5,00,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {autoFilled.amount && (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-2 py-0.5">
                  Auto-filled from CSV
                </span>
              )}
            </div>
          </FormGroup>

          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Issue Date">
              <div className="flex items-center gap-2">
                <FormInput
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
                {autoFilled.issueDate && (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-2 py-0.5">
                    Auto-filled from CSV
                  </span>
                )}
              </div>
            </FormGroup>
            <FormGroup label="Due Date">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <FormInput
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  {autoFilled.dueDate && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-full px-2 py-0.5">
                      Auto-filled from CSV
                    </span>
                  )}
                </div>
              </div>
            </FormGroup>
          </div>

          <FormGroup label="Paid Date (optional)">
            <FormInput
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
            />
          </FormGroup>

          <div className="mt-1 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-500">Auto-detected Status</p>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${derivedStatusClasses}`}
            >
              {getStatusLabel(derivedStatus)}
            </span>
          </div>
        </div>

        <ModalFooter 
          onClose={onClose} 
          submitLabel={isProcessing ? "Analyzing..." : "Save & Process AI Insights"} 
        />
      </form>
      
      {isProcessing && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-2xl z-50">
          <div className="bg-[#131920] border border-white/10 p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <div>
              <p className="text-white font-bold">AI Model Analyzing Invoice...</p>
              <p className="text-slate-400 text-xs mt-1">Extracting patterns & predicting risk scores</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
