import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
import { authRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimitResult = authRateLimit.resetPassword(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: `Too many reset attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` },
        { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
      );
    }

    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    // Use service client to bypass RLS (user is not logged in)
    const serviceClient = createServiceClient();
    const { data: dbUserData } = await serviceClient
      .from("users")
      .select("id, first_name, email, auth_id")
      .eq("email", email)
      .limit(1);

    const dbUser = dbUserData?.[0];

    if (!dbUser) {
      // Don't reveal if the email exists (security)
      return NextResponse.json({ message: "If the email exists, a reset link has been sent." });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store token in the users table
    const { error: updateError } = await serviceClient
      .from("users")
      .update({ reset_token: resetToken, reset_token_expiry: resetExpiry })
      .eq("id", dbUser.id);

    if (updateError) {
      console.error("Failed to store reset token:", updateError);
      return NextResponse.json({ error: "Failed to generate reset link" }, { status: 500 });
    }

    // Build direct link to our reset page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://medisched-cert.vercel.app";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    // Send email via Gmail SMTP (ISPSC CLINIC template)
    const sent = await sendPasswordResetEmail(email, dbUser.first_name, resetUrl);

    if (!sent) {
      return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
    }

    return NextResponse.json({ message: "Password reset email sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
