"use client"

import { usePathname } from "next/navigation"
import { Bell, Plus, Menu } from "lucide-react"
import { UserButton, useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

const PAGE_META: Record<string, { title?: string; sub: string }> = {
  "/dashboard": {
    sub: "Cash Flow Overview & Dashboard",
  },
  "/dashboard/timeline": {
    title: "Cash Flow Timeline",
    sub: "Probabilistic 90-day forecast",
  },
  "/dashboard/clients": {
    title: "Client Intelligence",
    sub: "Payment behavior · Risk scores · Hidden patterns",
  },
}

interface HeaderProps {
  onAddInvoice: () => void
  onAddExpense: () => void
  onNotifications: () => void
  onMenuClick?: () => void
  hasNotifications?: boolean
}

export default function Header({ 
  onAddInvoice, 
  onAddExpense, 
  onNotifications, 
  onMenuClick,
  hasNotifications 
}: HeaderProps) {
  const pathname = usePathname()
  const meta = PAGE_META[pathname] ?? { title: "CashCult", sub: "" }
  const displayTitle = "CashCult"

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 bg-[#0D1117] border-b border-white/[0.06]">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-[14px] md:text-[15px] font-bold text-white truncate max-w-[120px] md:max-w-none">{displayTitle}</h1>
          <p className="hidden md:block text-[11px] text-slate-500 mt-0.5">{meta.sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          onClick={onNotifications}
          className="relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-[8px] border border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:text-white transition-all duration-150"
        >
          <Bell size={14} className="md:w-[15px] md:h-[15px]" />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400 border-2 border-[#0D1117]" />
          )}
        </button>

        <button
          onClick={onAddInvoice}
          className="flex items-center gap-1 px-2 md:px-3.5 py-1.5 md:py-2 rounded-[8px] border border-white/[0.08] text-slate-300 text-[10px] md:text-xs font-bold hover:bg-white/[0.04] hover:text-white transition-all duration-150"
        >
          <Plus size={12} className="md:w-[13px] md:h-[13px]" />
          <span className="hidden sm:inline">Add Invoice</span>
          <span className="sm:hidden">Invoice</span>
        </button>

        <button
          onClick={onAddExpense}
          className="flex items-center gap-1 px-2 md:px-3.5 py-1.5 md:py-2 rounded-[8px] bg-purple-400 text-white text-[10px] md:text-xs font-bold hover:bg-purple-500 transition-all duration-150 mr-1 md:mr-2"
        >
          <Plus size={12} className="md:w-[13px] md:h-[13px]" />
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Expense</span>
        </button>

        <div className="flex items-center pl-1 border-l border-white/[0.06] ml-1">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  )
}

