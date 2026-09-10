import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, userId } = body;

    if (!password || !userId) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: users } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", userId)
      .limit(1);

    const user = users?.[0];

    if (!user) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
