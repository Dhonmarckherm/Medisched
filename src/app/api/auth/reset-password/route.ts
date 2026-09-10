import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const debug: string[] = [];
  try {
    const { token, new_password } = await request.json();
    debug.push(`Token received: ${token ? token.substring(0, 16) + '...' : 'MISSING'}`);
    debug.push(`Password length: ${new_password?.length || 0}`);

    if (!token || !new_password) {
      return NextResponse.json({ error: "Token and new password are required", debug }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters", debug }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Find user with this reset token that hasn't expired
    const { data: user, error: findError } = await serviceClient
      .from("users")
      .select("id, auth_id, email, first_name, reset_token, reset_token_expiry")
      .eq("reset_token", token)
      .single();

    debug.push(`Find error: ${findError?.message || "none"}`);
    debug.push(`User found: ${!!user}`);
    if (user) {
      debug.push(`User: ${user.email}`);
      debug.push(`Token match: ${user.reset_token === token}`);
      debug.push(`Token expiry: ${user.reset_token_expiry}`);
      debug.push(`Now: ${new Date().toISOString()}`);
      debug.push(`Expired: ${user.reset_token_expiry ? new Date(user.reset_token_expiry) < new Date() : "no expiry set"}`);
    }

    if (findError || !user) {
      return NextResponse.json({ error: `Invalid or expired reset link. ${findError?.message || "No user found."}`, debug }, { status: 400 });
    }

    // Check if token has expired
    if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one.", debug }, { status: 400 });
    }

    // Update the password via Supabase Admin API
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(user.auth_id, {
      password: new_password,
    });

    debug.push(`Password update error: ${updateError?.message || "none"}`);

    if (updateError) {
      return NextResponse.json({ error: `Failed to update password: ${updateError.message}`, debug }, { status: 500 });
    }

    // Clear the reset token
    await serviceClient
      .from("users")
      .update({ reset_token: null, reset_token_expiry: null })
      .eq("id", user.id);

    return NextResponse.json({ message: "Password reset successfully", debug });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    debug.push(`Unexpected: ${errMsg}`);
    console.error("Reset password error:", error);
    return NextResponse.json({ error: `Unexpected: ${errMsg}`, debug }, { status: 500 });
  }
}
