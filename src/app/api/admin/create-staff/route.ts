import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWelcomeEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if current user is super admin
    const { data: currentUser } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .limit(1);

    if (!currentUser || currentUser.length === 0 || !currentUser[0].is_super_admin) {
      return NextResponse.json({ error: "Only super admin can create staff accounts" }, { status: 403 });
    }

    const body = await request.json();
    const { first_name, last_name, middle_name, email, id_number, password, role } = body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }

    // Validate role - only admin or nurse allowed
    if (!["admin", "nurse"].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Only admin or nurse allowed." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for staff accounts
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create user in our database
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .insert({
        auth_id: authData.user?.id || null,
        email,
        id_number: id_number || `STAFF-${Date.now()}`,
        password_hash,
        first_name,
        last_name,
        middle_name: middle_name || null,
        role,
        is_super_admin: false,
        active_status: "active",
      })
      .select()
      .limit(1);

    if (dbError || !dbUser || dbUser.length === 0) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, first_name).catch(() => {});

    return NextResponse.json(
      { message: `${role} account created successfully`, user: dbUser[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create staff account error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
