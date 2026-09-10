import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, id_number, password } = body;

    if (!email || !id_number || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const supabaseAdmin = createServiceClient();

    // Find user by email
    const { data: emailUsers, error: emailError } = await supabaseAdmin
      .from("users")
      .select("id, email, id_number, password_hash, active_status, first_name, last_name, role, auth_id")
      .eq("email", email)
      .limit(1);

    if (emailError || !emailUsers || emailUsers.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = emailUsers[0];

    // Check if id_number matches
    if (user.id_number !== id_number) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check active status
    if (user.active_status !== "active") {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
    }

    // Create a fresh server client with cookies to sign in
    const cookieStore = await cookies();
    let response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              cookieStore.set(name, value)
            );
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Sign in - this triggers setAll which sets cookies on the response
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: "Authentication failed: " + authError.message }, { status: 401 });
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
