import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json({ error: "ID and type are required" }, { status: 400 });
    }

    if (!["appointment", "certificate", "user"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify admin role
    const { data: users } = await supabase
      .from("users")
      .select("role, is_super_admin")
      .eq("auth_id", user.id)
      .limit(1);

    const dbUser = users?.[0];
    if (!dbUser || !["admin", "clinic_nurse"].includes(dbUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle user deletion
    if (type === "user") {
      const supabaseAdmin = createServiceClient();

      // Get target user
      const { data: targetUsers } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", id)
        .limit(1);

      if (!targetUsers || targetUsers.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const targetUser = targetUsers[0];

      // Can't delete super admin
      if (targetUser.is_super_admin) {
        return NextResponse.json({ error: "Cannot delete super admin" }, { status: 403 });
      }

      // Only super admin can delete admin/nurse
      if (["admin", "nurse"].includes(targetUser.role) && !dbUser.is_super_admin) {
        return NextResponse.json({ error: "Only super admin can delete staff accounts" }, { status: 403 });
      }

      // Delete associated appointments and certificates
      await supabaseAdmin.from("appointments").delete().eq("user_id", id);
      await supabaseAdmin.from("certificates").delete().eq("user_id", id);

      // Delete the user from our database
      const { error: dbError } = await supabaseAdmin.from("users").delete().eq("id", id);
      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }

      // Try to delete from Supabase Auth (best effort)
      if (targetUser.auth_id) {
        await supabaseAdmin.auth.admin.deleteUser(targetUser.auth_id).catch(() => {});
      }

      return NextResponse.json({ message: "User and associated records deleted successfully" });
    }

    // Handle appointment/certificate deletion
    const table = type === "appointment" ? "appointments" : "certificates";
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: `${type} deleted successfully` });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
