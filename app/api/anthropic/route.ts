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

      const mockText = `Dear ${clientName},

I hope this email finds you well and that your team is having a productive week.

I am writing to formally follow up regarding Invoice #INV-OVERDUE, which is currently past its designated due date. We deeply value our ongoing working relationship with you and strive to ensure all administrative matters are resolved smoothly so we can continue focusing on our shared goals.

Could you please confirm the current status of this payment at your earliest convenience? If the invoice is already being processed by your accounts payable team, I would greatly appreciate a brief update on the expected timeline. 

If you require any further documentation, banking details, or an updated copy of the invoice to process this request, please do not hesitate to reach out to me directly. 

Thank you for your prompt attention to this matter. We look forward to continuing our successful partnership.

Best regards,

${senderName}
${businessName}`

      return NextResponse.json({
        text: mockText
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
