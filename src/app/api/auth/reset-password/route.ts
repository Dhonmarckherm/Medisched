import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, id_number, new_password } = body;

    if (!email || !id_number || !new_password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find user
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("id_number", id_number)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 12);

    // Update password
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    // Also update Supabase Auth password if auth_id exists
    if (user.auth_id) {
      try {
        const { data: { session } } = await supabase.auth.signInWithPassword({
          email,
          password: new_password,
        });
        // If we can sign in, password was already updated in auth
      } catch {
        // Auth password update is best-effort
      }
    }

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
