import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    // Check if user exists in our database
    const supabase = await createClient();
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, first_name, email")
      .eq("email", email)
      .single();

    if (!dbUser) {
      // Don't reveal if the email exists or not (security)
      return NextResponse.json({ message: "If the email exists, a reset link has been sent." });
    }

    // Generate recovery link using Supabase Admin API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://medisched-cert.vercel.app";
    const serviceClient = createServiceClient();
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    if (linkError || !linkData) {
      console.error("Failed to generate reset link:", linkError);
      return NextResponse.json({ error: "Failed to generate reset link" }, { status: 500 });
    }

    // The action_link is the URL the user needs to visit
    const resetUrl = linkData.properties.action_link;

    // Send email via Gmail SMTP
    const sent = await sendPasswordResetEmail(email, dbUser.first_name, resetUrl);

    if (!sent) {
      return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
    }

    return NextResponse.json({ message: "If the email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
