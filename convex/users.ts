import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
    args: {
        clerkId: v.string(),
        businessName: v.string(),
        industry: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            businessName: args.businessName,
            industry: args.industry,
        });
        return userId;
    },
});

export const getCurrentUser = query({
    args: {
        clerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
            .first();

        return user;
    },
});