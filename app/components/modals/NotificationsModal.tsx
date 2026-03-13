"use client"

import Modal from "./Modal"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { formatDate, getSeverityLabel, getSeverityTextColor } from "@/lib/utils"
// For demo purposes, we'll still fallback to ALERTS if Convex returns empty
import { ALERTS as MOCK_ALERTS } from "@/lib/data"

interface NotificationsModalProps {
  open: boolean
  onClose: () => void
}

const ICONS = { critical: "🔴", warning: "🟡", info: "🟢" }

export default function NotificationsModal({ open, onClose }: NotificationsModalProps) {
  // In a real app, we'd pass the actual userId. For demo, we use a placeholder or handle null.
  const realNotifications = useQuery(api.data.getNotifications, { userId: "user-placeholder" as any })

  const alerts = (realNotifications && realNotifications.length ? realNotifications : MOCK_ALERTS) as any[]

  return (
    <Modal open={open} onClose={onClose} title="Notifications" width="w-full max-w-md">
      <div className="flex flex-col max-h-[60vh] overflow-y-auto">
        {alerts.map((alert: any) => (
          <div
            key={alert.id || alert._id}
            className="flex gap-3 py-3 border-b border-white/[0.04] last:border-0"
          >
            <span className="text-base flex-shrink-0">
              {ICONS[alert.severity as keyof typeof ICONS] || "🟢"}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-[11px] font-bold tracking-[1.4px] uppercase mb-1 ${getSeverityTextColor(
                  alert.severity as any,
                )}`}
              >
                {getSeverityLabel(alert.severity as any)}
              </p>
              {alert.title && (
                <p className="text-[13px] font-semibold text-white leading-snug truncate">
                  {alert.title}
                </p>
              )}
              <p className="text-[12px] text-slate-400 leading-relaxed mt-0.5">
                {alert.description}
              </p>
              <p className="text-[10px] text-slate-600 mt-1">
                {formatDate(alert.detectedAt)}
              </p>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="text-center text-[12px] text-slate-600 mt-4 italic">No notifications found.</p>
        )}
        <p className="text-center text-[12px] text-slate-600 mt-4">You're all caught up</p>
      </div>
    </Modal>
  )
}
