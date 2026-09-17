import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { first_name, last_name, middle_name, id_number, course, year_level, contact_number, email } = body;

    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: "First name, last name, and email are required" }, { status: 400 });
    }

    // Get current user data
    const serviceClient = createServiceClient();
    const { data: dbUsers } = await serviceClient
      .from("users")
      .select("id, auth_id, email")
      .eq("auth_id", user.id)
      .limit(1);

    const dbUser = dbUsers?.[0];
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if email is taken by another user
    if (email !== dbUser.email) {
      const { data: existing } = await serviceClient
        .from("users")
        .select("id")
        .eq("email", email)
        .neq("id", dbUser.id)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json({ error: "Email is already taken by another user" }, { status: 400 });
      }
    }

    // Update users table
    const { error: updateError } = await serviceClient
      .from("users")
      .update({
        first_name, last_name,
        middle_name: middle_name || null,
        id_number: id_number || "",
        course: course || null,
        year_level: year_level || null,
        contact_number: contact_number || null,
        email,
      })
      .eq("id", dbUser.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // If email changed, also update Supabase Auth
    if (email !== dbUser.email && dbUser.auth_id) {
      try {
        await serviceClient.auth.admin.updateUserById(dbUser.auth_id, {
          email,
          email_confirm: true,
        });
      } catch (authErr) {
        console.error("Failed to sync email with Supabase Auth:", authErr);
        // Don't fail the whole request — email updated in our DB
      }
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
