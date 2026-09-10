import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, new_password } = await request.json();

    if (!token || !new_password) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Find user with this reset token
    const { data: users, error: findError } = await serviceClient
      .from("users")
      .select("id, auth_id, email, first_name, reset_token_expiry")
      .eq("reset_token", token)
      .limit(1);

    if (findError || !users || users.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 });
    }

    const user = users[0];

    // Check if token has expired
    if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    // Update the password via Supabase Admin API
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(user.auth_id, {
      password: new_password,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json({ error: `Failed to update password: ${updateError.message}` }, { status: 500 });
    }

    // Also update the password_hash in the users table (used by login bcrypt check)
    const password_hash = await bcrypt.hash(new_password, 12);

    // Clear the reset token and update password hash
    await serviceClient
      .from("users")
      .update({ reset_token: null, reset_token_expiry: null, password_hash })
      .eq("id", user.id);

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
