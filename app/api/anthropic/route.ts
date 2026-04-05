import { NextResponse } from "next/server"
import { ENV, CONSTANTS } from "@/lib/config"

export async function POST(request: Request) {
  try {
    const { userMessage, systemPrompt, fallbackData } = await request.json()

    // Retrieve the API key securely from environment variables using config wrapper
    const apiKey = ENV.ANTHROPIC_API_KEY

    // PRODUCTION LEVEL GRACEFUL FALLBACK: 
    // If the developer hasn't configured their Anthropic API key yet,
    // we return a smartly mocked generated email so the UI components can still be tested fully.
    if (!apiKey) {
      console.warn("ANTHROPIC_API_KEY is missing. Using fallback mock data for testing.")
      
      const { clientName = "Client", businessName = "Your Business", senderName = "Your Name" } = fallbackData || {}

      return NextResponse.json({
        text: `Dear ${clientName},\n\nI hope this email finds you well.\n\nThis is a gentle reminder that your recent invoice is currently past its due date. We value our working relationship and would appreciate it if you could prioritize this payment at your earliest convenience.\n\nPlease let us know if you have any questions or require an updated copy of the invoice.\n\nBest regards,\n${senderName}\n${businessName}`
      })
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CONSTANTS.MODELS.ANTHROPIC,
        max_tokens: 1000,
        messages: [{ role: "user", content: userMessage }],
        system: systemPrompt,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Anthropic API Error:", errorData)
      return NextResponse.json({ error: "Failed to generate email from Anthropic" }, { status: response.status })
    }

    const data = await response.json()
    const emailText = data.content?.[0]?.text
    
    return NextResponse.json({ text: emailText })
  } catch (error) {
    console.error("Internal API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
