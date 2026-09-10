import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log("[forgot-password] Request email:", email);

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    // Use service client to bypass RLS (user is not logged in)
    const serviceClient = createServiceClient();
    const { data: dbUser, error: userError } = await serviceClient
      .from("users")
      .select("id, first_name, email")
      .eq("email", email)
      .single();

    console.log("[forgot-password] DB user found:", !!dbUser, "Error:", userError?.message);

    if (!dbUser) {
      return NextResponse.json({ message: "If the email exists, a reset link has been sent." });
    }

    // Generate recovery link using Supabase Admin API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://medisched-cert.vercel.app";
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    console.log("[forgot-password] Link error:", linkError?.message);
    console.log("[forgot-password] Link data keys:", linkData ? Object.keys(linkData) : "null");

    if (linkError || !linkData) {
      console.error("[forgot-password] Failed to generate reset link:", linkError);
      return NextResponse.json({ error: "Failed to generate reset link" }, { status: 500 });
    }

    // The action_link is the URL the user needs to visit
    const resetUrl = linkData.properties?.action_link;
    console.log("[forgot-password] Reset URL:", resetUrl ? "generated" : "MISSING");

    if (!resetUrl) {
      console.error("[forgot-password] No action_link in response. Full data:", JSON.stringify(linkData, null, 2));
      return NextResponse.json({ error: "Failed to generate reset link" }, { status: 500 });
    }

    // Send email via Gmail SMTP
    console.log("[forgot-password] Sending email to:", email, "Name:", dbUser.first_name);
    const sent = await sendPasswordResetEmail(email, dbUser.first_name, resetUrl);
    console.log("[forgot-password] Email sent:", sent);

    if (!sent) {
      return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
    }

    return NextResponse.json({ message: "If the email exists, a reset link has been sent." });
  } catch (error) {
    console.error("[forgot-password] Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
