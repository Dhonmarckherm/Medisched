import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST — log a new activity
export async function POST(request: NextRequest) {
  try {
    const { action, target_type, target_id, details } = await request.json();
    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user info
    const { data: users } = await supabase
      .from("users")
      .select("id, first_name, last_name, role")
      .eq("auth_id", user.id)
      .limit(1);

    const dbUser = users?.[0];
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { error } = await supabase.from("activity_logs").insert({
      user_id: dbUser.id,
      user_name: `${dbUser.first_name} ${dbUser.last_name}`,
      user_role: dbUser.role,
      action,
      target_type: target_type || null,
      target_id: target_id || null,
      details: details || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Activity logged" });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

// GET — fetch activity logs (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify admin
    const { data: users } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .limit(1);

    const dbUser = users?.[0];
    if (!dbUser || !["admin", "nurse"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [], total: count || 0, page });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
