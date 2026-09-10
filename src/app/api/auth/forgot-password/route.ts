import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const debug: string[] = [];
  try {
    const { email } = await request.json();
    debug.push(`Email: ${email}`);

    if (!email) return NextResponse.json({ error: "Email is required", debug }, { status: 400 });

    // Use service client to bypass RLS (user is not logged in)
    const serviceClient = createServiceClient();
    const { data: dbUser, error: userError } = await serviceClient
      .from("users")
      .select("id, first_name, email")
      .eq("email", email)
      .single();

    debug.push(`User found: ${!!dbUser}, Error: ${userError?.message || "none"}`);

    if (!dbUser) {
      return NextResponse.json({ message: "If the email exists, a reset link has been sent.", debug });
    }

    debug.push(`User: ${dbUser.first_name} (${dbUser.id})`);

    // Generate recovery link using Supabase Admin API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://medisched-cert.vercel.app";
    debug.push(`App URL: ${appUrl}`);

    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    debug.push(`Link error: ${linkError?.message || "none"}`);
    debug.push(`Link data: ${linkData ? JSON.stringify(Object.keys(linkData)) : "null"}`);

    if (linkError || !linkData) {
      return NextResponse.json({ error: "Failed to generate reset link", debug }, { status: 500 });
    }

    // The action_link is the URL the user needs to visit
    const resetUrl = linkData.properties?.action_link;
    debug.push(`Reset URL: ${resetUrl ? "generated" : "MISSING"}`);

    if (!resetUrl) {
      debug.push(`Full linkData: ${JSON.stringify(linkData)}`);
      return NextResponse.json({ error: "No action_link in response", debug }, { status: 500 });
    }

    // Send email via Gmail SMTP
    debug.push(`Sending email to: ${email}`);
    const sent = await sendPasswordResetEmail(email, dbUser.first_name, resetUrl);
    debug.push(`Email sent: ${sent}`);

    if (!sent) {
      return NextResponse.json({ error: "Failed to send reset email", debug }, { status: 500 });
    }

    return NextResponse.json({ message: "Password reset email sent successfully!", debug });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    debug.push(`Unexpected error: ${errMsg}`);
    console.error("[forgot-password] Unexpected error:", error);
    return NextResponse.json({ error: `Unexpected: ${errMsg}`, debug }, { status: 500 });
  }
}
