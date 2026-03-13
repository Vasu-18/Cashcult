export function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  }
  return `₹${(amount / 1000).toFixed(0)}K`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) {
    // If parsing fails, return the original string so we never show "Invalid Date"
    return dateStr
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function getRiskColor(risk: string): string {
  if (risk === "high") return "text-red-400 bg-red-400/10 border-red-400/20"
  if (risk === "medium") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
  return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
}

export function getStatusColor(status: string): string {
  if (status === "overdue") return "text-red-400 bg-red-400/10 border-red-400/20"
  if (status === "outstanding") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
  return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
}

export function getStatusLabel(status: string): string {
  if (status === "overdue") return "Overdue"
  if (status === "outstanding") return "Outstanding"
  return "Paid"
}

export function getPersonalityColor(personality: string): string {
  if (personality === "Chronic Late Payer") return "text-red-400 bg-red-400/10 border-red-400/20"
  if (personality === "Early Bird") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
  if (personality === "Reliable") return "text-blue-400 bg-blue-400/10 border-blue-400/20"
  return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
}



export function getVarianceColor(type: string): string {
  if (type === "late") return "bg-red-400"
  if (type === "early") return "bg-sky-400"
  return "bg-emerald-400"
}

export function getVarianceTextColor(type: string): string {
  if (type === "late") return "text-red-400"
  if (type === "early") return "text-sky-400"
  return "text-emerald-400"
}

export function formatVariance(days: number): string {
  if (days < 0) return `${Math.abs(days)}d early`
  if (days === 0) return "On time"
  return `+${days}d late`
}

export function getProbabilityColor(prob: number): string {
  if (prob >= 80) return "text-emerald-400"
  if (prob >= 50) return "text-yellow-400"
  return "text-red-400"
}

export function getSeverityColor(severity: string): string {
  if (severity === "critical") return "border-red-400/20 bg-red-400/5"
  if (severity === "warning") return "border-yellow-400/20 bg-yellow-400/5"
  return "border-emerald-400/20 bg-emerald-400/5"
}

export function getSeverityDotColor(severity: string): string {
  if (severity === "critical") return "bg-red-400"
  if (severity === "warning") return "bg-yellow-400"
  return "bg-emerald-400"
}

export function getSeverityLabel(severity: string): string {
  if (severity === "critical") return "Critical Alert"
  if (severity === "warning") return "Warning"
  return "Info"
}

export function getSeverityTextColor(severity: string): string {
  if (severity === "critical") return "text-red-400"
  if (severity === "warning") return "text-yellow-400"
  return "text-emerald-400"
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
