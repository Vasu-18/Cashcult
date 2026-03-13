"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, TrendingUp, Users, Settings, X, Home } from "lucide-react"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import logo from "@/assets/brainwave-symbol.svg"

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Cash Flow", href: "/dashboard/timeline", icon: TrendingUp },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
]

interface SidebarProps {
  onSettingsOpen: () => void
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ onSettingsOpen, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()

  const clerkId = user?.id
  const currentUser = useQuery(
    api.users.getCurrentUser,
    clerkId ? { clerkId } : ("skip" as any),
  ) as any

  const businessName: string =
    (currentUser && currentUser.businessName) || user?.fullName || "Your Business"

  const rawIndustry: string | undefined = currentUser?.industry
  const industryLabel =
    rawIndustry === "Real_Estate"
      ? "Real Estate"
      : rawIndustry || "Set industry in onboarding"

  const initials =
    businessName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "C"

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-[240px] bg-[#0D1117] border-r border-white/[0.06] flex flex-col
      transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
    `}>
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image src={logo} alt="logo" height={36} width={36} className="flex-shrink-0" />
          <span className="font-bold text-[25px] text-white tracking-tight">
            Cash<span className="text-purple-400">Cult</span>
          </span>
        </Link>
        <button 
          onClick={onClose}
          className="lg:hidden p-1 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 pt-4">
        <p className="px-2 mb-2 text-[10px] font-bold tracking-[2px] uppercase text-slate-600">
          Main
        </p>
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all duration-150 border ${active
                  ? "bg-purple-400/10 text-purple-400 border-purple-400/15"
                  : "text-slate-400 border-transparent hover:bg-white/[0.04] hover:text-white"
                  }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </div>

        <p className="px-2 mt-5 mb-2 text-[10px] font-bold tracking-[2px] uppercase text-slate-600">
          Account
        </p>
        <button
          onClick={onSettingsOpen}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium text-slate-400 border border-transparent hover:bg-white/[0.04] hover:text-white transition-all duration-150"
        >
          <Settings size={15} />
          Settings
        </button>
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 p-2.5 rounded-[10px] cursor-pointer hover:bg-white/[0.04] transition-all duration-150">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {businessName}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {industryLabel}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
