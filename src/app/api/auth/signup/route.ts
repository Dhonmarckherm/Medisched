import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWelcomeEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, middle_name, email, id_number, password, course, year_level } = body;

    // Validate required fields
    if (!first_name || !last_name || !email || !id_number || !password) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Use anon client for auth (signUp), service client for DB operations (bypasses RLS)
    const supabase = await createClient();
    const supabaseAdmin = createServiceClient();

    // Check if email or ID number already exists
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .or(`email.eq.${email},id_number.eq.${id_number}`)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Email or ID Number already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      // Handle rate limit error
      if (authError.message.includes("rate limit") || authError.message.includes("over_email_send_rate_limit")) {
        return NextResponse.json(
          { error: "Too many signup attempts. Please wait a moment and try again." },
          { status: 429 }
        );
      }
      // Ignore "already registered" error if user exists in auth
      if (!authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        );
      }
    }

    // Create user in our database (using service client to bypass RLS)
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from("users")
      .insert({
        auth_id: authData.user?.id || null,
        email,
        id_number,
        password_hash,
        first_name,
        last_name,
        middle_name: middle_name || null,
        course: course || null,
        year_level: year_level || null,
        role: "student",
        active_status: "active",
      })
      .select()
      .limit(1);

    if (dbError || !dbUser || dbUser.length === 0) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, first_name).catch(() => {});

    return NextResponse.json(
      { message: "Account created successfully", user: dbUser[0] },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
