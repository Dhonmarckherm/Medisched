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
      // Don't reveal if the email exists (security)
      return NextResponse.json({ message: "If the email exists, a reset link has been sent.", debug });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    debug.push(`Token generated: ${resetToken.substring(0, 16)}...`);
    debug.push(`User ID: ${dbUser.id}`);

    // Store token in the users table
    const { data: updateResult, error: updateError } = await serviceClient
      .from("users")
      .update({ reset_token: resetToken, reset_token_expiry: resetExpiry })
      .eq("id", dbUser.id)
      .select("id, reset_token")
      .single();

    debug.push(`Update error: ${updateError?.message || "none"}`);
    debug.push(`Update result: ${updateResult ? "OK" : "FAILED"}`);

    if (updateError) {
      debug.push(`Update error details: ${JSON.stringify(updateError)}`);
      return NextResponse.json({ error: "Failed to generate reset link", debug }, { status: 500 });
    }

    // Verify token was stored
    const { data: verifyUser } = await serviceClient
      .from("users")
      .select("reset_token")
      .eq("id", dbUser.id)
      .single();
    debug.push(`Verify token stored: ${verifyUser?.reset_token ? "YES" : "NO"}`);

    // Build direct link to our reset page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://medisched-cert.vercel.app";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    debug.push(`Reset URL: ${resetUrl.substring(0, 60)}...`);

    // Send email via Gmail SMTP (ISPSC CLINIC template)
    const sent = await sendPasswordResetEmail(email, dbUser.first_name, resetUrl);
    debug.push(`Email sent: ${sent}`);

    if (!sent) {
      return NextResponse.json({ error: "Failed to send reset email", debug }, { status: 500 });
    }

    return NextResponse.json({ message: "Password reset email sent.", debug });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    debug.push(`Unexpected: ${errMsg}`);
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: `An unexpected error occurred: ${errMsg}`, debug }, { status: 500 });
  }
}
