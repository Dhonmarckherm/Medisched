import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWelcomeEmail } from "@/lib/email";
import crypto from "crypto";
import { authRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimitResult = authRateLimit.resendVerification(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: `Too many resend attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` },
        { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabaseAdmin = createServiceClient();

    // Find user by email
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, first_name, active_status, verification_token, verification_token_expires_at")
      .eq("email", email)
      .limit(1);

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
    }

    const user = users[0];

    if (user.active_status === "active") {
      return NextResponse.json({ error: "Account is already verified" }, { status: 400 });
    }

    // Generate new token
    const verification_token = crypto.randomBytes(32).toString("hex");
    const token_expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Update token in DB
    await supabaseAdmin
      .from("users")
      .update({ verification_token, verification_token_expires_at: token_expires_at })
      .eq("id", user.id);

    // Build verify URL — use production URL to avoid exposing preview URLs
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://medisched-cert.vercel.app";
    const verifyUrl = `${siteUrl}/verify-email?token=${verification_token}`;

    // Send email
    await sendWelcomeEmail(email, user.first_name, verifyUrl);

    return NextResponse.json({ message: "Verification email sent! Check your inbox." });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }
}
