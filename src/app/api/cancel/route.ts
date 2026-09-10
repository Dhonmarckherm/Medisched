import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { id, type } = await request.json();

    if (!id || !type) {
      return NextResponse.json({ error: "ID and type are required" }, { status: 400 });
    }

    if (!["appointment", "certificate"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user's DB id
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .limit(1);

    const dbUser = users?.[0];
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const table = type === "appointment" ? "appointments" : "certificates";

    // Verify the item belongs to this user and is still pending
    const { data: items } = await supabase
      .from(table)
      .select("id, status, user_id")
      .eq("id", id)
      .limit(1);

    const item = items?.[0];
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.user_id !== dbUser.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (item.status !== "Pending") return NextResponse.json({ error: "Can only cancel pending items" }, { status: 400 });

    // Update status to Cancelled
    const { error } = await supabase
      .from(table)
      .update({ status: "Cancelled" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: `${type} cancelled successfully` });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
