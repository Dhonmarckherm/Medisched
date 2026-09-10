import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { current_password, new_password } = await request.json();

    if (!current_password || !new_password) {
      return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user with password_hash
    const { data: users } = await supabase
      .from("users")
      .select("id, auth_id, password_hash")
      .eq("auth_id", user.id)
      .limit(1);

    const dbUser = users?.[0];
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify current password
    const valid = await bcrypt.compare(current_password, dbUser.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 12);

    // Update both Supabase Auth and users table
    const serviceClient = createServiceClient();
    const { error: authError } = await serviceClient.auth.admin.updateUserById(dbUser.auth_id, {
      password: new_password,
    });

    if (authError) {
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    // Update password_hash in users table
    await serviceClient
      .from("users")
      .update({ password_hash })
      .eq("id", dbUser.id);

    return NextResponse.json({ message: "Password changed successfully" });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
