import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail, sendStatusNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, name, status, details } = body;

    if (!type || !to) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let success = false;

    if (type === "welcome") {
      success = await sendWelcomeEmail(to, name || "Student");
    } else if (type === "status") {
      success = await sendStatusNotification(to, name || "Student", details?.requestType || "appointment", status || "Approved", details || {});
    } else {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Notify API error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
