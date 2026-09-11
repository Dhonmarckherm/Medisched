import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail, sendStatusNotification } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/service";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, name, status, details, userId } = body;

    if (!type || !to) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let success = false;

    if (type === "welcome") {
      success = await sendWelcomeEmail(to, name || "Student");
    } else if (type === "status") {
      success = await sendStatusNotification(to, name || "Student", details?.requestType || "appointment", status || "Approved", details || {});

      // Also create in-app notification
      if (userId) {
        const requestType = details?.requestType || "appointment";
        const isApproved = status === "Approved";
        const notifType = requestType === "certificate"
          ? (isApproved ? "certificate_approved" : "certificate_rejected")
          : (isApproved ? "appointment_approved" : "appointment_rejected");
        const link = requestType === "certificate" ? "/certificates" : "/appointments";

        await createNotification({
          user_id: userId,
          type: notifType,
          title: `${requestType === "certificate" ? "Certificate" : "Appointment"} ${status}`,
          message: `Your ${requestType} request has been ${status.toLowerCase()}.${details?.purpose ? ` Purpose: ${details.purpose}` : ""}`,
          link,
        });
      }
    } else {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    return NextResponse.json({ success });
  } catch (error) {
    console.error("Notify API error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
