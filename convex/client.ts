import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createClient = mutation({
    args: {
        userId: v.id("users"),
        clientName: v.string(),
    },
    handler: async (ctx, args) => {
        const clientId = await ctx.db.insert("clients", {
            userId: args.userId,
            clientName: args.clientName,
        });
        return clientId;
    },
});