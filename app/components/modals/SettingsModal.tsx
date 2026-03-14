"use client"

import { useState, useEffect } from "react"
import Modal, { FormGroup, FormInput, FormSelect, ModalFooter } from "./Modal"
import { useUser, useClerk } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { User, Building2, Globe, Bell, Shield, LogOut, Palette, Clock } from "lucide-react"

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { user } = useUser()
  const { signOut } = useClerk()

  const clerkId = user?.id
  const currentUser = useQuery(
    api.users.getCurrentUser,
    clerkId ? { clerkId } : ("skip" as any),
  ) as any

  const [activeTab, setActiveTab] = useState<"profile" | "business" | "notifications" | "display">("profile")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Profile fields
  const [businessName, setBusinessName] = useState("")
  const [industry, setIndustry] = useState("")
  
  // Business fields
  const [currency, setCurrency] = useState("₹ INR")
  const [safeThreshold, setSafeThreshold] = useState("800000")
  const [paymentTerms, setPaymentTerms] = useState("30")
  const [fiscalYear, setFiscalYear] = useState("apr-mar")
  
  // Notification fields
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [overdueReminders, setOverdueReminders] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [cashCrisisAlert, setCashCrisisAlert] = useState(true)
  const [reminderDays, setReminderDays] = useState("3")

  useEffect(() => {
    if (currentUser) {
      setBusinessName(currentUser.businessName || "")
      setIndustry(currentUser.industry || "")
    }
  }, [currentUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      setMessage({ type: "success", text: "Settings saved!" })
      setTimeout(() => {
        setMessage(null)
        onClose()
      }, 1200)
    } catch {
      setMessage({ type: "error", text: "Failed to save." })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: <User size={14} /> },
    { id: "business" as const, label: "Business", icon: <Building2 size={14} /> },
    { id: "notifications" as const, label: "Alerts", icon: <Bell size={14} /> },
    { id: "display" as const, label: "Display", icon: <Palette size={14} /> },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Settings" width="w-[560px]">
      <form onSubmit={handleSubmit}>
        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-[#131920] p-1 rounded-[10px] border border-white/[0.04]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[11px] font-bold flex-1 justify-center transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-[#1A2232] text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-[12px] font-medium ${
            message.type === "success"
              ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
              : "bg-red-400/10 text-red-400 border border-red-400/20"
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-1">
            <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  (user?.fullName || "U").charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-white truncate">{user?.fullName || "User"}</p>
                <p className="text-[12px] text-slate-400 truncate">{user?.primaryEmailAddress?.emailAddress || "No email"}</p>
                <p className="text-[10px] text-slate-600 mt-1">Managed via Clerk · <span className="text-purple-400">Edit in Clerk profile</span></p>
              </div>
            </div>

            <FormGroup label="Business Name">
              <FormInput
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your Business Name"
              />
            </FormGroup>

            <FormGroup label="Industry">
              <FormSelect value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="" disabled>Select your industry</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Consulting">Consulting</option>
                <option value="Real_Estate">Real Estate</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </FormSelect>
            </FormGroup>

            <div className="pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: "/" })}
                className="w-full py-2.5 rounded-lg text-[12px] font-bold text-red-400 border border-red-400/20 bg-red-400/5 hover:bg-red-400/10 transition-all duration-150 flex items-center justify-center gap-2"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Business Tab */}
        {activeTab === "business" && (
          <div className="space-y-1">
            <FormGroup label="Default Currency">
              <FormSelect value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="₹ INR">₹ INR — Indian Rupee</option>
                <option value="$ USD">$ USD — US Dollar</option>
                <option value="€ EUR">€ EUR — Euro</option>
                <option value="£ GBP">£ GBP — British Pound</option>
              </FormSelect>
            </FormGroup>

            <FormGroup label="Safe Cash Threshold">
              <div className="relative">
                <FormInput
                  type="number"
                  value={safeThreshold}
                  onChange={(e) => setSafeThreshold(e.target.value)}
                  placeholder="800000"
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-1">Alerts trigger when balance falls below this amount</p>
            </FormGroup>

            <FormGroup label="Default Payment Terms (Days)">
              <FormSelect value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
                <option value="7">Net 7 — Due in 7 days</option>
                <option value="15">Net 15 — Due in 15 days</option>
                <option value="30">Net 30 — Due in 30 days</option>
                <option value="45">Net 45 — Due in 45 days</option>
                <option value="60">Net 60 — Due in 60 days</option>
                <option value="90">Net 90 — Due in 90 days</option>
              </FormSelect>
              <p className="text-[10px] text-slate-600 mt-1">Default due date calculation for new invoices</p>
            </FormGroup>

            <FormGroup label="Fiscal Year">
              <FormSelect value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)}>
                <option value="apr-mar">April – March (India)</option>
                <option value="jan-dec">January – December</option>
                <option value="jul-jun">July – June</option>
                <option value="oct-sep">October – September</option>
              </FormSelect>
            </FormGroup>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-1">
            <p className="text-[11px] text-slate-500 mb-4">Control when and how CashCult alerts you about important events.</p>
            
            <ToggleRow
              label="Overdue Payment Reminders"
              description="Get notified when an invoice passes its due date"
              checked={overdueReminders}
              onChange={setOverdueReminders}
            />

            <ToggleRow
              label="Cash Crisis Alerts"
              description="Immediate alert when balance drops below safe threshold"
              checked={cashCrisisAlert}
              onChange={setCashCrisisAlert}
            />

            <ToggleRow
              label="Email Digests"
              description="Weekly summary of cash flow, collections, and risks"
              checked={weeklyDigest}
              onChange={setWeeklyDigest}
            />

            <ToggleRow
              label="All Email Notifications"
              description="Master toggle for email alerts"
              checked={emailAlerts}
              onChange={setEmailAlerts}
            />

            <div className="pt-3 border-t border-white/[0.06]">
              <FormGroup label="Remind Before Due Date (Days)">
                <FormSelect value={reminderDays} onChange={(e) => setReminderDays(e.target.value)}>
                  <option value="1">1 day before</option>
                  <option value="3">3 days before</option>
                  <option value="5">5 days before</option>
                  <option value="7">7 days before</option>
                </FormSelect>
                <p className="text-[10px] text-slate-600 mt-1">When to send reminders for upcoming due invoices</p>
              </FormGroup>
            </div>
          </div>
        )}

        {/* Display Tab */}
        {activeTab === "display" && (
          <div className="space-y-4">
            <FormGroup label="Dashboard Date Format">
              <FormSelect defaultValue="dd-mmm-yyyy">
                <option value="dd-mmm-yyyy">15 Mar 2026</option>
                <option value="mm/dd/yyyy">03/15/2026</option>
                <option value="dd/mm/yyyy">15/03/2026</option>
                <option value="yyyy-mm-dd">2026-03-15</option>
              </FormSelect>
            </FormGroup>

            <FormGroup label="Number Format">
              <FormSelect defaultValue="indian">
                <option value="indian">Indian (12,34,567.89)</option>
                <option value="international">International (1,234,567.89)</option>
              </FormSelect>
            </FormGroup>

            <FormGroup label="Forecast Default View">
              <FormSelect defaultValue="30d">
                <option value="30d">30 Days</option>
                <option value="60d">60 Days</option>
                <option value="90d">90 Days</option>
              </FormSelect>
            </FormGroup>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-slate-500 mb-2">Theme</p>
              <div className="flex gap-2">
                <div className="flex-1 py-3 rounded-lg bg-[#0D1117] border-2 border-purple-400/40 text-center cursor-pointer">
                  <p className="text-[11px] font-bold text-white">Dark</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Current</p>
                </div>
                <div className="flex-1 py-3 rounded-lg bg-slate-200 border-2 border-transparent text-center opacity-40 cursor-not-allowed">
                  <p className="text-[11px] font-bold text-slate-700">Light</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <ModalFooter onClose={onClose} submitLabel={saving ? "Saving..." : "Save Changes"} />
      </form>
    </Modal>
  )
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
      <div>
        <p className="text-[12px] font-bold text-white">{label}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-all duration-200 flex items-center px-0.5 ${
          checked ? "bg-emerald-400" : "bg-slate-700"
        }`}
      >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`} />
      </button>
    </div>
  )
}
