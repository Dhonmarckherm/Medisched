import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@supabase/supabase-js";

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

    // Use resetPasswordForEmail - Supabase's built-in method that handles the link correctly
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://medisched-cert.vercel.app";
    const redirectTo = `${appUrl}/reset-password`;
    debug.push(`Redirect to: ${redirectTo}`);

    // Use anon client for resetPasswordForEmail (it's designed for unauthenticated users)
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: resetError } = await anonClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    debug.push(`Reset email error: ${resetError?.message || "none"}`);

    if (resetError) {
      return NextResponse.json({ error: `Failed to send reset email: ${resetError.message}`, debug }, { status: 500 });
    }

    debug.push(`Reset email sent successfully via Supabase`);
    return NextResponse.json({ message: "Password reset email sent! Check your inbox.", debug });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    debug.push(`Unexpected error: ${errMsg}`);
    console.error("[forgot-password] Unexpected error:", error);
    return NextResponse.json({ error: `Unexpected: ${errMsg}`, debug }, { status: 500 });
  }
}
