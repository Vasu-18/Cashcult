"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: string
}

export default function Modal({ open, onClose, title, children, width = "w-[480px]" }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-[#0D1117] border border-white/10 rounded-2xl p-7 ${width} max-w-full animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:text-white transition-all duration-150"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[12px] font-bold text-slate-400">{label}</label>
      {children}
    </div>
  )
}

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3.5 py-2.5 rounded-[10px] border border-white/[0.06] bg-[#131920] text-white text-[13px] font-medium placeholder-slate-600 outline-none focus:border-emerald-400/40 transition-colors"
    />
  )
}

export function FormSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-3.5 py-2.5 rounded-[10px] border border-white/[0.06] bg-[#131920] text-white text-[13px] font-medium outline-none focus:border-emerald-400/40 transition-colors appearance-none"
    />
  )
}

export function ModalFooter({ onClose, submitLabel }: { onClose: () => void; submitLabel: string }) {
  return (
    <div className="flex gap-2.5 mt-6">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-2.5 rounded-[10px] border border-white/[0.06] text-slate-400 text-[13px] font-bold hover:bg-white/[0.04] transition-all duration-150"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="flex-[2] py-2.5 rounded-[10px] bg-emerald-400 text-black text-[13px] font-black hover:bg-emerald-300 transition-all duration-150"
      >
        {submitLabel}
      </button>
    </div>
  )
}
