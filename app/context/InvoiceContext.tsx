"use client"

import { createContext, useContext, useState } from "react"

interface LastInvoiceMeta {
  convexId: string
  invoiceId: string
}

interface InvoiceContextValue {
  lastInvoice: LastInvoiceMeta | null
  setLastInvoice: (meta: LastInvoiceMeta | null) => void
}

const InvoiceContext = createContext<InvoiceContextValue | undefined>(undefined)

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [lastInvoice, setLastInvoice] = useState<LastInvoiceMeta | null>(null)

  return (
    <InvoiceContext.Provider value={{ lastInvoice, setLastInvoice }}>
      {children}
    </InvoiceContext.Provider>
  )
}

export function useInvoiceContext() {
  const ctx = useContext(InvoiceContext)
  if (!ctx) {
    throw new Error("useInvoiceContext must be used within an InvoiceProvider")
  }
  return ctx
}

