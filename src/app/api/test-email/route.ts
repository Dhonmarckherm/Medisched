import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

// Test endpoint to verify email integration
// Usage: POST /api/test-email with { "to": "test@example.com", "name": "Test User" }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, name } = body;

    if (!to || !name) {
      return NextResponse.json(
        { error: "Please provide 'to' and 'name' parameters" },
        { status: 400 }
      );
    }

    // Check if SMTP env vars are set
    const missingVars = [];
    if (!process.env.SMTP_HOST) missingVars.push("SMTP_HOST");
    if (!process.env.SMTP_USER) missingVars.push("SMTP_USER");
    if (!process.env.SMTP_PASS) missingVars.push("SMTP_PASS");

    if (missingVars.length > 0) {
      return NextResponse.json(
        { 
          error: "Missing SMTP environment variables",
          missing: missingVars,
          hint: "Add these in Vercel Dashboard → Settings → Environment Variables"
        },
        { status: 500 }
      );
    }

    // Try to send the email
    const result = await sendWelcomeEmail(to, name);

    if (result) {
      return NextResponse.json(
        { 
          success: true, 
          message: `Welcome email sent to ${to}`,
          from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
          checkInbox: "Check inbox and spam folder"
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { 
          error: "Email sending failed",
          hint: "Check Vercel logs for error details. Common issues: invalid App Password, SMTP settings wrong"
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { 
        error: "Email test failed",
        details: error.message || "Unknown error",
        hint: "Check SMTP credentials and Vercel environment variables"
      },
      { status: 500 }
    );
  }
}

// GET endpoint for quick browser testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Email test endpoint",
    usage: "POST with { \"to\": \"email@example.com\", \"name\": \"User Name\" }",
    envCheck: {
      SMTP_HOST: process.env.SMTP_HOST ? "Set" : "Missing",
      SMTP_USER: process.env.SMTP_USER ? "Set" : "Missing",
      SMTP_PASS: process.env.SMTP_PASS ? "Set" : "Missing",
      SMTP_PORT: process.env.SMTP_PORT || "Not set",
      SMTP_SECURE: process.env.SMTP_SECURE || "Not set",
    }
  });
}
