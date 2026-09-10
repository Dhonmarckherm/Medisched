import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const debug: string[] = [];
  try {
    const { email } = await request.json();
    debug.push(`Email: ${email}`);

    if (!email) return NextResponse.json({ error: "Email is required", debug }, { status: 400 });

    // Use service client to bypass RLS (user is not logged in)
    const serviceClient = createServiceClient();
    const { data: dbUser, error: userError } = await serviceClient
      .from("users")
      .select("id, first_name, email, auth_id")
      .eq("email", email)
      .single();

    debug.push(`User found: ${!!dbUser}, Error: ${userError?.message || "none"}`);

    if (!dbUser) {
      return NextResponse.json({ message: "If the email exists, a reset link has been sent.", debug });
    }

    debug.push(`User: ${dbUser.first_name} (${dbUser.id})`);

    // Generate our own secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now

    // Store token in the users table
    const { error: updateError } = await serviceClient
      .from("users")
      .update({ reset_token: resetToken, reset_token_expiry: resetExpiry })
      .eq("id", dbUser.id);

    debug.push(`Token stored: ${!updateError}, Error: ${updateError?.message || "none"}`);

    if (updateError) {
      return NextResponse.json({ error: `Failed to store token: ${updateError.message}`, debug }, { status: 500 });
    }

    // Build direct link to our reset page (no Supabase redirect!)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://medisched-cert.vercel.app";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    debug.push(`Reset URL: ${resetUrl}`);

    // Send email via Gmail SMTP (ISPSC CLINIC template)
    debug.push(`Sending via Gmail SMTP to: ${email}`);
    const sent = await sendPasswordResetEmail(email, dbUser.first_name, resetUrl);
    debug.push(`Email sent: ${sent}`);

    if (!sent) {
      return NextResponse.json({ error: "Failed to send reset email", debug }, { status: 500 });
    }

    return NextResponse.json({ message: "Password reset email sent via ISPSC CLINIC!", debug });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    debug.push(`Unexpected error: ${errMsg}`);
    console.error("[forgot-password] Unexpected error:", error);
    return NextResponse.json({ error: `Unexpected: ${errMsg}`, debug }, { status: 500 });
  }
}
