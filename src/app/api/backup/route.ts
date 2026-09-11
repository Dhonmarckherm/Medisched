import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// POST /api/backup — Create a backup export
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify admin role
    const supabaseAdmin = createServiceClient();
    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .limit(1);

    if (!dbUser?.[0] || dbUser[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Export all tables
    const [users, appointments, certificates, accommodations, activityLogs] = await Promise.all([
      supabaseAdmin.from("users").select("*").order("created_at"),
      supabaseAdmin.from("appointments").select("*").order("created_at"),
      supabaseAdmin.from("certificates").select("*").order("created_at"),
      supabaseAdmin.from("accommodations").select("*").order("created_at"),
      supabaseAdmin.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(500),
    ]);

    const backup = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      exported_by: user.email,
      data: {
        users: users.data || [],
        appointments: appointments.data || [],
        certificates: certificates.data || [],
        accommodations: accommodations.data || [],
        activity_logs: activityLogs.data || [],
      },
      stats: {
        total_users: (users.data || []).length,
        total_appointments: (appointments.data || []).length,
        total_certificates: (certificates.data || []).length,
        total_accommodations: (accommodations.data || []).length,
        total_activity_logs: (activityLogs.data || []).length,
      },
    };

    // Log the backup action
    const adminUser = dbUser[0];
    await supabaseAdmin.from("activity_logs").insert({
      user_id: (await supabaseAdmin.from("users").select("id").eq("auth_id", user.id).limit(1)).data?.[0]?.id,
      action: "database_backup",
      details: `Database backup created. ${backup.stats.total_users} users, ${backup.stats.total_appointments} appointments, ${backup.stats.total_certificates} certificates.`,
      type: "system",
    });

    return NextResponse.json({ backup });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}

// GET /api/backup — Get backup stats
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseAdmin = createServiceClient();
    const [users, appointments, certificates] = await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("appointments").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("certificates").select("id", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      stats: {
        total_users: users.count || 0,
        total_appointments: appointments.count || 0,
        total_certificates: certificates.count || 0,
      },
    });
  } catch (error) {
    console.error("Backup stats error:", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
