export const ENV = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || "",
}

export const CONSTANTS = {
  MODELS: {
    ANTHROPIC: "claude-sonnet-4-20250514",
  },
  ROUTES: {
    API_ANTHROPIC: "/api/anthropic",
  },
  PROMPTS: {
    REMINDER_SYSTEM: "You are a professional business communication assistant. Write a payment reminder email that is firm but maintains the business relationship. Never be rude. Always be specific with amounts and dates.",
  }
}
