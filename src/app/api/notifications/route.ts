import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// GET /api/notifications — Fetch notifications for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseAdmin = createServiceClient();
    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("auth_id", user.id)
      .limit(1);

    if (!dbUser?.[0]) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userId = dbUser[0].id;
    const userRole = dbUser[0].role;

    // Fetch notifications based on role
    let query = supabaseAdmin
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    // For students: only their own notifications
    // For admins/nurses: all notifications
    if (userRole === "student") {
      query = query.eq("user_id", userId);
    }

    const { data: notifications } = await query;

    // Count unread
    const { count: unreadCount } = await supabaseAdmin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .eq("user_id", userId);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// PATCH /api/notifications — Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { ids } = body; // array of notification IDs to mark as read

    const supabaseAdmin = createServiceClient();

    if (ids && ids.length > 0) {
      await supabaseAdmin
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", ids);
    } else {
      // Mark all as read for this user
      const { data: dbUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .limit(1);

      if (dbUser?.[0]) {
        await supabaseAdmin
          .from("notifications")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("user_id", dbUser[0].id)
          .eq("is_read", false);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ error: "Failed to mark notifications" }, { status: 500 });
  }
}
