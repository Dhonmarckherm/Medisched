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
    const { data: user } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
