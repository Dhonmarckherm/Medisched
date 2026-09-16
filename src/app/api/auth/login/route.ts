import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { dbRateLimit } from "@/lib/rateLimitDb";
import { sanitizeEmail, sanitizeIdNumber, detectSQLInjection } from "@/lib/sanitize";
import { logLoginAttempt, isAccountLocked, recordFailedLogin, resetFailedLogins } from "@/lib/loginSecurity";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // 1. Persistent rate limiting
    const rateLimitResult = await dbRateLimit.login(ip);
    if (!rateLimitResult.success) {
      await logLoginAttempt({
        email: "unknown",
        userAgent,
        status: "rate_limited",
        failureReason: "rate_limit_exceeded",
      });
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` },
        { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
      );
    }

    const body = await request.json();
    const { email: rawEmail, id_number: rawIdNumber, password } = body;

    if (!rawEmail || !rawIdNumber || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // 2. Input sanitization
    const email = sanitizeEmail(rawEmail);
    const idNumber = sanitizeIdNumber(rawIdNumber);

    // 3. SQL injection detection
    if (detectSQLInjection(rawEmail) || detectSQLInjection(rawIdNumber)) {
      await logLoginAttempt({
        email: rawEmail,
        userAgent,
        status: "failed",
        failureReason: "sql_injection_detected",
      });
      return NextResponse.json({ error: "Invalid input detected" }, { status: 400 });
    }

    const supabaseAdmin = createServiceClient();

    // Find user by email
    const { data: emailUsers, error: emailError } = await supabaseAdmin
      .from("users")
      .select("id, email, id_number, password_hash, active_status, first_name, last_name, role, auth_id")
      .eq("email", email)
      .limit(1);

    if (emailError || !emailUsers || emailUsers.length === 0) {
      await logLoginAttempt({
        email,
        userAgent,
        status: "failed",
        failureReason: "invalid_email",
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = emailUsers[0];

    // 4. Check account lockout
    const lockStatus = await isAccountLocked(user.id);
    if (lockStatus.locked) {
      await logLoginAttempt({
        userId: user.id,
        email,
        userAgent,
        status: "locked",
        failureReason: "account_locked",
      });
      return NextResponse.json(
        { error: `Account is locked due to too many failed attempts. Try again in ${lockStatus.remainingMinutes} minutes.`, locked: true },
        { status: 423 }
      );
    }

    // Check if id_number matches
    if (user.id_number !== idNumber) {
      const failResult = await recordFailedLogin(user.id);
      await logLoginAttempt({
        userId: user.id,
        email,
        userAgent,
        status: failResult.locked ? "locked" : "failed",
        failureReason: "invalid_id_number",
      });

      if (failResult.locked) {
        return NextResponse.json(
          { error: `Too many failed attempts. Account locked for 15 minutes.`, locked: true },
          { status: 423 }
        );
      }
      return NextResponse.json(
        { error: "Invalid credentials", remainingAttempts: failResult.remainingAttempts },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const failResult = await recordFailedLogin(user.id);
      await logLoginAttempt({
        userId: user.id,
        email,
        userAgent,
        status: failResult.locked ? "locked" : "failed",
        failureReason: "invalid_password",
      });

      if (failResult.locked) {
        return NextResponse.json(
          { error: `Too many failed attempts. Account locked for 15 minutes.`, locked: true },
          { status: 423 }
        );
      }
      return NextResponse.json(
        { error: "Invalid credentials", remainingAttempts: failResult.remainingAttempts },
        { status: 401 }
      );
    }

    // Check active status
    if (user.active_status !== "active") {
      const { data: fullUser } = await supabaseAdmin
        .from("users")
        .select("verification_token")
        .eq("id", user.id)
        .limit(1);
      
      if (fullUser && fullUser.length > 0 && fullUser[0].verification_token) {
        await logLoginAttempt({
          userId: user.id,
          email,
          userAgent,
          status: "failed",
          failureReason: "email_not_verified",
        });
        return NextResponse.json(
          { error: "Please verify your email before logging in. Check your inbox for the verification link.", unverified: true },
          { status: 403 }
        );
      }
      await logLoginAttempt({
        userId: user.id,
        email,
        userAgent,
        status: "failed",
        failureReason: "account_deactivated",
      });
      return NextResponse.json({ error: "Account is deactivated. Contact admin for assistance." }, { status: 403 });
    }

    // Login successful — reset failed attempts and log
    await resetFailedLogins(user.id);
    await logLoginAttempt({
      userId: user.id,
      email,
      userAgent,
      status: "success",
    });

    // Create a fresh server client with cookies to sign in
    const cookieStore = await cookies();
    let response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              cookieStore.set(name, value)
            );
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Ensure Supabase Auth user exists and email is confirmed
    // (handles users who signed up before email confirmation fix)
    if (user.auth_id) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.auth_id, {
          email_confirm: true,
        });
      } catch (confirmErr) {
        console.error("Failed to pre-confirm auth user:", confirmErr);
      }
    }

    // Attempt sign in
    let { data: signInData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If sign in fails, try to recover and retry
    if (authError) {
      console.error("First signInWithPassword attempt failed:", authError.message);

      // Try: auth user might not exist — create one via admin
      if (!user.auth_id || authError.message.includes("Invalid login credentials")) {
        try {
          // Check if auth user exists by listing users
          const { data: adminUser } = user.auth_id
            ? await supabaseAdmin.auth.admin.getUserById(user.auth_id)
            : { data: null };

          if (!adminUser?.user) {
            // Auth user doesn't exist — we need to create via signUp
            const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
            });
            if (signUpError) {
              console.error("Admin createUser failed:", signUpError.message);
            } else if (signUpData.user) {
              // Update our users table with the new auth_id
              await supabaseAdmin
                .from("users")
                .update({ auth_id: signUpData.user.id })
                .eq("id", user.id);
              user.auth_id = signUpData.user.id;
            }
          }

          // Retry sign in
          const retry = await supabase.auth.signInWithPassword({ email, password });
          if (retry.error) {
            console.error("Retry signInWithPassword failed:", retry.error.message);
            return NextResponse.json(
              { error: "Authentication failed: " + retry.error.message },
              { status: 401 }
            );
          }
          signInData = retry.data;
          authError = null;
        } catch (recoverErr) {
          console.error("Login recovery failed:", recoverErr);
          return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
        }
      } else {
        return NextResponse.json(
          { error: "Authentication failed: " + authError.message },
          { status: 401 }
        );
      }
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
