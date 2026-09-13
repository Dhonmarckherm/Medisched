import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { dbRateLimit } from "@/lib/rateLimitDb";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET - Check if system is activated
export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "license_activated")
      .single();

    const isActivated = data?.setting_value === "true";

    return NextResponse.json({ activated: isActivated });
  } catch {
    // If table doesn't exist yet, treat as not activated
    return NextResponse.json({ activated: false });
  }
}

// POST - Validate license key and activate system
export async function POST(request: NextRequest) {
  try {
    // Rate limit license attempts (5 per 5 minutes per IP)
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimitResult = await dbRateLimit.licenseAttempt(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: `Too many license attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` },
        { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
      );
    }

    const body = await request.json();
    const { key } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "License key is required" }, { status: 400 });
    }

    // Get the correct license key from environment variable
    const correctKey = process.env.LICENSE_KEY;

    if (!correctKey) {
      return NextResponse.json(
        { error: "License system not configured. Contact the developer." },
        { status: 500 }
      );
    }

    // Validate the key (case-insensitive, trim whitespace)
    if (key.trim().toUpperCase() !== correctKey.trim().toUpperCase()) {
      return NextResponse.json(
        { error: "Invalid license key. Please check and try again." },
        { status: 401 }
      );
    }

    // Key is valid — activate the system
    const supabase = getAdminClient();

    await supabase
      .from("system_settings")
      .update({ setting_value: "true", updated_at: new Date().toISOString() })
      .eq("setting_key", "license_activated");

    await supabase
      .from("system_settings")
      .update({ setting_value: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("setting_key", "activated_at");

    return NextResponse.json({
      success: true,
      message: "System activated successfully! Welcome to MEDISCHED CERT.",
    });
  } catch (error) {
    console.error("License activation error:", error);
    return NextResponse.json(
      { error: "Failed to activate license. Please try again." },
      { status: 500 }
    );
  }
}
