"use client"

import { useState, useMemo } from "react"
import MetricCard from "@/app/components/MetricCard"
import HealthScoreCard from "@/app/components/HealthScore"
import AlertCard from "@/app/components/AlertCard"
import InvoiceTable from "@/app/components/InvoiceTable"
import ClientRiskSnapshot from "@/app/components/ClientRiskSnapshot"
import AddInvoiceModal from "@/app/components/modals/AddInvoiceModal"
import AddExpenseModal from "@/app/components/modals/AddExpenseModal"
import { METRICS, HEALTH_SCORE, INVOICES, CLIENTS, EXPENSES as MOCK_EXPENSES } from "@/lib/data"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useInvoiceContext } from "@/app/context/InvoiceContext"

export default function DashboardPage() {
  return <DashboardContent />
}

function DashboardContent() {
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const notifications = useQuery(api.data.getNotifications, { userId: "user-placeholder" as any })
  const realInvoices = useQuery(api.data.getInvoices, { userId: "user-placeholder" as any })
  const realExpenses = useQuery(api.data.getExpenses, { userId: "user-placeholder" as any })
  const { lastInvoice } = useInvoiceContext()
  
  console.log("Dashboard Rendered. Real Invoices:", realInvoices?.length, "Expenses:", realExpenses?.length);

  // Derive unique clients from real invoices
  const dynamicClients = useMemo(() => {
    if (!realInvoices?.length) return CLIENTS;
    const clientsMap = new Map();
    realInvoices.forEach((inv: any) => {
      const name = inv.clientId;
      if (!clientsMap.has(name)) {
        clientsMap.set(name, {
          id: name,
          clientName: name,
          riskLevel: inv.paymentStatus === "overdue" ? "high" : "low",
          onTimeProbability: inv.paymentStatus === "overdue" ? 35 : 88,
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          paymentTermsDays: 30
        });
      }
    });
    return Array.from(clientsMap.values());
  }, [realInvoices]);

  // --- Dynamic Real-Time Alert Selection ---
  const activeAlert = useMemo(() => {
    // 1. Prioritize real unread notifications from Convex
    if (notifications?.length) {
      const first = notifications[0] as any;
      return {
        id: first._id,
        severity: first.severity || "info",
        title: first.title,
        description: first.description,
        detectedAt: first.detectedAt || "Just now"
      };
    }

    // 2. Fallback: Generate an alert if there are overdue invoices
    const overdue = realInvoices?.filter((i: any) => i.paymentStatus === "overdue");
    if (overdue?.length) {
      const totalAmount = overdue.reduce((acc: number, val: any) => acc + val.invoiceAmount, 0);
      return {
        id: "dynamic-overdue",
        severity: "critical",
        title: `${overdue.length} Invoices Overdue`,
        description: `Your cash flow is exposed to ₹${(totalAmount / 100000).toFixed(1)}L in late payments. ML model suggests immediate follow-up.`,
        detectedAt: "Live Analysis"
      };
    }

    // 3. Info fallback
    return {
      id: "all-clear",
      severity: "info",
      title: "Cash Flow Stabilized",
      description: "No immediate payment risks detected. Your 30-day forecast remains positive.",
      detectedAt: "Just now"
    };
  }, [notifications, realInvoices]);

  // Combined Invoices
  const displayInvoices = realInvoices?.length
    ? realInvoices.map((inv: any) => {
        const baseId =
          inv.invoiceId ||
          (lastInvoice && lastInvoice.convexId === inv._id ? lastInvoice.invoiceId : inv._id.toString().slice(-4))

        return {
          ...inv,
          id: baseId,
          clientName: inv.clientId,
        }
      })
    : INVOICES.slice(0, 6);

  // Combined Expenses
  const displayExpenses = realExpenses?.length ? realExpenses.slice(0, 5) : MOCK_EXPENSES.slice(0, 5);

  // --- Dynamic Metrics Calculation ---
  const isDataReady = realInvoices !== undefined && realExpenses !== undefined;
  const hasUserInvoices = (realInvoices?.length || 0) > 0;
  const hasUserExpenses = (realExpenses?.length || 0) > 0;
  const hasData = hasUserInvoices || hasUserExpenses;

  // Calculate totals from Convex
  const paidInvoicesTotal = realInvoices?.filter((i: any) => i.paymentStatus === "paid").reduce((acc: number, i: any) => acc + i.invoiceAmount, 0) || 0;
  const outstandingInvoicesTotal = realInvoices?.filter((i: any) => i.paymentStatus === "outstanding" || i.paymentStatus === "overdue").reduce((acc: number, i: any) => acc + i.invoiceAmount, 0) || 0;
  const expensesTotal = realExpenses?.reduce((acc: number, e: any) => acc + e.amount, 0) || 0;
  
  // Logic: If there is user data, use ONLY user data (No mock base).
  // If there is no data at all yet, show the mock METRICS for design reference.
  const currentCashOnHand = hasData ? (paidInvoicesTotal - expensesTotal) : METRICS.cashOnHand;
  const currentExpectedInflow = hasUserInvoices ? outstandingInvoicesTotal : METRICS.expectedInflow30d;
  const currentCommittedOutflow = hasUserExpenses ? expensesTotal : METRICS.committedOutflow30d;
  
  // Net change is Inflow - Outflow
  const currentNetCashChange = hasData 
    ? (currentExpectedInflow - currentCommittedOutflow) 
    : METRICS.netCashChange;

  // --- Dynamic Health Score Calculation ---
  const overdueCount = realInvoices?.filter((i: any) => i.paymentStatus === "overdue").length || 0;
  const expenseLoad = hasUserExpenses ? (expensesTotal / 2000000) * 10 : 0; 
  const riskAdjustment = (overdueCount * 8) + expenseLoad;
  
  // Generate real insight message
  let healthInsight = "";
  if (hasUserInvoices) {
    if (overdueCount > 0) {
      const overdueAmount = realInvoices?.filter((i: any) => i.paymentStatus === "overdue").reduce((acc: number, i: any) => acc + i.invoiceAmount, 0) || 0;
      healthInsight = `Overdue alert: ₹${(overdueAmount / 100000).toFixed(1)}L pending across ${overdueCount} clients. Follow up required.`;
    } else {
      const earliestDue = realInvoices
        ?.filter((i: any) => i.paymentStatus === "outstanding")
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
      
      if (earliestDue) {
        healthInsight = `Next major payment from ${earliestDue.clientId} expected by ${formatDate(earliestDue.dueDate)}.`;
      } else {
        healthInsight = "No outstanding payment risks. Maintain current collection buffer.";
      }
    }
  }

  const dynamicHealthScore = {
    ...HEALTH_SCORE,
    total: hasData ? Math.max(10, Math.min(98, 85 - riskAdjustment)) : HEALTH_SCORE.total,
    invoiceHealth: hasData ? Math.max(5, Math.round(HEALTH_SCORE.invoiceHealth - riskAdjustment)) : HEALTH_SCORE.invoiceHealth,
    clientReliability: hasUserInvoices ? (overdueCount > 0 ? 65 : 92) : HEALTH_SCORE.clientReliability,
    insight: hasData ? healthInsight : undefined
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          icon="💰"
          value={formatCurrency(currentCashOnHand)}
          label="Cash on Hand"
          trend={realInvoices?.length || realExpenses?.length ? `Live Data Sync` : "↑ 8.3% vs last month"}
          trendUp={true}
          accent="green"
        />
        <MetricCard
          icon="📥"
          value={formatCurrency(currentExpectedInflow)}
          label="Expected Inflow (30d)"
          trend={realInvoices?.length ? `${realInvoices.length} invoices analyzed` : "↓ 3 invoices at risk"}
          accent="blue"
        />
        <MetricCard
          icon="📤"
          value={formatCurrency(currentCommittedOutflow)}
          label="Committed Outflow (30d)"
          trend={hasUserExpenses ? `${realExpenses.length} recurring expenses` : "Syncing Bills..."}
          trendNeutral
          accent="red"
        />
        <MetricCard
          icon="⚡"
          value={formatCurrency(currentNetCashChange)}
          label="Net Cash Change"
          trend={currentNetCashChange > 0 ? "Positive Cashflow" : "Increased Burn Rate"}
          trendUp={currentNetCashChange > 0}
          accent="yellow"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="flex flex-col gap-4">
          <HealthScoreCard data={dynamicHealthScore} />
          <AlertCard alert={activeAlert} />
          <InvoiceTable
            invoices={displayInvoices as any}
            onAddInvoice={() => setInvoiceOpen(true)}
          />
        </div>

        <div className="flex flex-col gap-4">
          <ClientRiskSnapshot clients={dynamicClients as any} invoices={displayInvoices as any} />

          <div className="bg-[#0D1117] border border-white/[0.06] rounded-2xl p-5">
            <h3 className="text-[13px] font-bold text-white mb-4">Real-Time Activity</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { val: (realInvoices?.length || 0).toString(), label: "Invoices Uploaded", color: "text-emerald-400" },
                { val: (realInvoices?.filter((i: any) => i.paymentStatus === "paid").length || 0).toString(), label: "Cleared Payments", color: "text-blue-400" },
                { val: (realInvoices?.filter((i: any) => i.paymentStatus === "overdue").length || 0).toString(), label: "Risk Invoices", color: "text-red-400" },
                { val: (notifications?.length || 0).toString(), label: "ML Alerts", color: "text-yellow-400" },
              ].map(({ val, label, color }) => (
                <div key={label} className="bg-[#131920] border border-white/[0.06] rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{val}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-[#0D1117] border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold text-white">Upcoming Expenses</h3>
              <button 
                onClick={() => setExpenseOpen(true)}
                className="text-[10px] font-bold text-emerald-400 hover:opacity-70 transition-opacity"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-col">
              {displayExpenses.map((exp: any) => (
                <div key={exp.id || exp._id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-[13px] font-semibold text-white truncate">{exp.description}</p>
                    <p className="text-[11px] text-slate-500">Due {formatDate(exp.dueDate)}</p>
                  </div>
                  <p className={`text-[13px] font-bold flex-shrink-0 ${exp.amount > 500000 ? "text-red-400" : "text-yellow-400"}`}>
                    {formatCurrency(exp.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddInvoiceModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />
      <AddExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} />
    </div>
  )
}