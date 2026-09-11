import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Find user with this verification token
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("verification_token", token)
      .limit(1);

    if (error || !users || users.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    const user = users[0];

    // Check if already verified
    if (user.active_status === "active") {
      return NextResponse.json(
        { message: "Account already verified", already_verified: true },
        { status: 200 }
      );
    }

    // Check if token has expired (1 hour expiry)
    if (user.verification_token_expires_at) {
      const expiresAt = new Date(user.verification_token_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: "Verification link has expired. Please sign up again to receive a new verification email." },
          { status: 400 }
        );
      }
    }

    // Activate the user and clear the token
    const { error: updateError } = await supabase
      .from("users")
      .update({ 
        active_status: "active",
        verification_token: null 
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to verify account" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Account verified successfully", verified: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
