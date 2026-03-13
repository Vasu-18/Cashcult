"use client"

import { useState } from "react"
import Sidebar from "@/app/components/Sidebar"
import Header from "@/app/components/Header"
import AddInvoiceModal from "@/app/components/modals/AddInvoiceModal"
import AddExpenseModal from "@/app/components/modals/AddExpenseModal"
import AddClientModal from "@/app/components/modals/AddClientModal"
import NotificationsModal from "@/app/components/modals/NotificationsModal"
import SettingsModal from "@/app/components/modals/SettingsModal"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { InvoiceProvider } from "@/app/context/InvoiceContext"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [clientOpen, setClientOpen] = useState(false)
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const notifications = useQuery(api.data.getNotifications, { userId: "user-placeholder" as any })
  const markRead = useMutation(api.data.markNotificationsRead)
  const hasNewNotifications = !!notifications?.some((n: any) => !n.isRead)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)
  
  const handleOpenNotifications = async () => {
    setNotifsOpen(true)
    await markRead({ userId: "user-placeholder" as any })
  }

  return (
    <InvoiceProvider>
      <div className="flex h-screen bg-[#080B12] overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        <Sidebar
          onSettingsOpen={() => setSettingsOpen(true)}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        <div className="flex flex-col flex-1 min-w-0">
          <Header
            onAddInvoice={() => setInvoiceOpen(true)}
            onAddExpense={() => setExpenseOpen(true)}
            onNotifications={handleOpenNotifications}
            onMenuClick={toggleSidebar}
            hasNotifications={hasNewNotifications}
          />
          <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {children}
          </main>
        </div>

        <AddInvoiceModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />
        <AddExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} />
        <AddClientModal open={clientOpen} onClose={() => setClientOpen(false)} />
        <NotificationsModal open={notifsOpen} onClose={() => setNotifsOpen(false)} />
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </InvoiceProvider>
  )
}
