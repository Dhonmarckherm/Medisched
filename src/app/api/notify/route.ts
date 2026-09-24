import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail, sendStatusNotification } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    // Require an authenticated staff (admin/nurse) session — this endpoint can
    // send email and write in-app notifications, so it must never be public.
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabaseAdmin = createServiceClient();
    const { data: caller } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("auth_id", authUser.id)
      .limit(1);
    const callerRole = caller?.[0]?.role;
    if (callerRole !== "admin" && callerRole !== "nurse") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
