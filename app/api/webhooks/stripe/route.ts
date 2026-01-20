import { NextRequest, NextResponse } from "next/server";
import { handleWebhookEvent } from "@/services/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "No signature provided" },
        { status: 400 }
      );
    }

    const result = await handleWebhookEvent(body, signature);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Note: In Next.js App Router, request.text() handles raw body parsing
// No need for bodyParser config - it's only needed in Pages Router
