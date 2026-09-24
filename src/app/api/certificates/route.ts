import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTodayISOManila } from "@/lib/date";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dbUserData } = await supabase
    .from("users").select("id, role").eq("auth_id", user.id).limit(1);
  const dbUser = dbUserData?.[0];
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isAdminOrNurse = dbUser.role === "admin" || dbUser.role === "nurse";

  let query = supabase.from("certificates").select("*, users(email)")
    .order("created_at", { ascending: false })
    .limit(500); // guard against unbounded payloads; UI paginates client-side
  if (!isAdminOrNurse) query = query.eq("user_id", dbUser.id);

  const { data } = await query;
  return NextResponse.json({ certificates: data || [] });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: dbUserData } = await supabase
      .from("users").select("*").eq("auth_id", user.id).limit(1);
    const dbUser = dbUserData?.[0];
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { purpose, date_needed, contact_number, email, remarks } = body;

    if (!purpose || !date_needed) {
      return NextResponse.json({ error: "Purpose and date needed are required" }, { status: 400 });
    }

    const today = getTodayISOManila();
    if (date_needed < today) {
      return NextResponse.json({ error: "Date cannot be in the past" }, { status: 400 });
    }

    if (purpose.length > 500) {
      return NextResponse.json({ error: "Purpose must be 500 characters or fewer" }, { status: 400 });
    }
    if (remarks && remarks.length > 300) {
      return NextResponse.json({ error: "Remarks must be 300 characters or fewer" }, { status: 400 });
    }
    if (contact_number && !/^(09\d{9}|\+639\d{9})$/.test(contact_number.trim())) {
      return NextResponse.json({ error: "Contact number must be a valid format (e.g., 09XXXXXXXXX)" }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("certificates")
      .insert({
        user_id: dbUser.id,
        lastname: dbUser.last_name,
        firstname: dbUser.first_name,
        middlename: dbUser.middle_name,
        student_id: dbUser.id_number,
        course: dbUser.course,
        year_level: dbUser.year_level,
        purpose,
        date_needed,
        contact_number: contact_number || null,
        email: email || null,
        remarks: remarks || null,
        status: "Pending",
      })
      .select()
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ certificate: data?.[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
