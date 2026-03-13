// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        businessName: v.string(),
        industry: v.string(),
    }),

    clients: defineTable({
        userId: v.string(),
        clientName: v.string(),
    }),

    invoices: defineTable({
        userId: v.string(),
        clientId: v.string(),
        invoiceAmount: v.number(),
        invoiceIssueDate: v.string(),
        dueDate: v.string(),
        paidDate: v.optional(v.string()),
        paymentStatus: v.union(
            v.literal("paid"),
            v.literal("outstanding"),
            v.literal("overdue")
        ),
        fileName: v.optional(v.string()),
    }),

    notifications: defineTable({
        userId: v.string(),
        title: v.string(),
        description: v.string(),
        severity: v.union(v.literal("critical"), v.literal("warning"), v.literal("info")),
        isRead: v.boolean(),
        detectedAt: v.string(),
    }),

    insights: defineTable({
        userId: v.string(),
        clientId: v.optional(v.string()),
        severity: v.union(v.literal("critical"), v.literal("warning"), v.literal("safe")),
        date: v.string(),
        text: v.string(),
        clientLabel: v.optional(v.string()),
    }),

    expenses: defineTable({
        userId: v.string(),
        description: v.string(),
        amount: v.number(),
        dueDate: v.string(),
        category: v.string(),
        isRecurring: v.boolean(),
    }),
});