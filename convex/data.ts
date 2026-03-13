import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createInvoice = mutation({
  args: {
    userId: v.string(),
    clientName: v.string(),
    amount: v.number(),
    issueDate: v.string(),
    dueDate: v.string(),
    status: v.union(v.literal("paid"), v.literal("outstanding"), v.literal("overdue")),
    fileName: v.optional(v.string()),
    invoiceId: v.optional(v.string()),
    paidDate: v.optional(v.string()),
    // Add ML specific arguments
    riskScore: v.optional(v.number()),
    onTimeProb: v.optional(v.number()),
    insightText: v.optional(v.string()),
    severity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invoiceId = await ctx.db.insert("invoices", {
      userId: args.userId as any,
      clientId: args.clientName as any, 
      invoiceAmount: args.amount,
      invoiceIssueDate: args.issueDate,
      dueDate: args.dueDate,
      paymentStatus: args.status,
      fileName: args.fileName,
      invoiceId: args.invoiceId,
      paidDate: args.paidDate ?? null,
    });

    // Add a notification with real ML results
    // Map 'safe' (from ML) to 'info' as required by notifications schema
    const notificationSeverity = args.severity === "safe" ? "info" : (args.severity || "info");

    await ctx.db.insert("notifications", {
      userId: args.userId as any,
      title: "New AI Analysis Ready",
      description: args.insightText || `Invoice for ${args.clientName} has been processed. Risk Score: ${args.riskScore || 'Analyzed'}`,
      severity: notificationSeverity as any,
      isRead: false,
      detectedAt: new Date().toISOString(),
    });

    // Add an insight with real ML results
    await ctx.db.insert("insights", {
      userId: args.userId as any,
      severity: (args.severity as any) || "warning",
      date: args.dueDate,
      text: args.insightText || `ML Analysis: ${args.clientName} shows patterns consistent with late payments.`,
      clientLabel: "View profile",
    });

    return invoiceId;
  },
});

export const createExpense = mutation({
  args: {
    userId: v.string(),
    description: v.string(),
    amount: v.number(),
    dueDate: v.string(),
    category: v.string(),
    isRecurring: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenses", {
      userId: args.userId,
      description: args.description,
      amount: args.amount,
      dueDate: args.dueDate,
      category: args.category,
      isRecurring: args.isRecurring,
    });
  },
});

export const getExpenses = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

export const getInvoices = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
  },
});

export const getNotifications = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
  },
});

export const markNotificationsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect();
    
    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

export const getInsights = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("insights")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});
