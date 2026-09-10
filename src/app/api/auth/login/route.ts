import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const debug: string[] = [];
  try {
    const body = await request.json();
    const { email, id_number, password } = body;
    debug.push(`Email: ${email}, ID: ${id_number}`);

    if (!email || !id_number || !password) {
      return NextResponse.json({ error: "All fields are required", debug }, { status: 400 });
    }

    const supabaseAdmin = createServiceClient();

    // First check if email exists
    const { data: emailUsers, error: emailError } = await supabaseAdmin
      .from("users")
      .select("id, email, id_number, password_hash, active_status, first_name, last_name, role, auth_id")
      .eq("email", email)
      .limit(1);

    debug.push(`Email check error: ${emailError?.message || "none"}`);
    debug.push(`Email found: ${emailUsers?.length || 0} users`);

    if (emailError || !emailUsers || emailUsers.length === 0) {
      return NextResponse.json({ error: "Invalid credentials", debug }, { status: 401 });
    }

    const user = emailUsers[0];
    debug.push(`User ID: ${user.id}, ID Number: ${user.id_number}`);
    debug.push(`Entered ID: ${id_number}`);
    debug.push(`ID match: ${user.id_number === id_number}`);

    // Check if id_number matches
    if (user.id_number !== id_number) {
      return NextResponse.json({ error: "Invalid credentials", debug }, { status: 401 });
    }

    debug.push(`Has password_hash: ${!!user.password_hash}, Length: ${user.password_hash?.length || 0}`);

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    debug.push(`Bcrypt match: ${valid}`);

    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials", debug }, { status: 401 });
    }

    // Check active status
    debug.push(`Active status: ${user.active_status}`);
    if (user.active_status !== "active") {
      return NextResponse.json({ error: "Account is deactivated", debug }, { status: 403 });
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
      debug,
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

    debug.push(`Supabase auth error: ${authError?.message || "none"}`);

    if (authError) {
      return NextResponse.json({ error: "Authentication failed: " + authError.message, debug }, { status: 401 });
    }

    return response;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    debug.push(`Unexpected: ${errMsg}`);
    return NextResponse.json({ error: "Internal server error", debug }, { status: 500 });
  }
}
