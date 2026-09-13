/**
 * Login Security Helper
 * Handles account lockout, login logging, and failed attempt tracking
 */
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Lockout settings
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

interface LoginLogParams {
  userId?: string;
  email: string;
  userAgent: string;
  status: "success" | "failed" | "locked" | "rate_limited";
  failureReason?: string;
}

// Log a login attempt to the database (no IP logging for privacy)
export async function logLoginAttempt(params: LoginLogParams) {
  const supabase = getAdminClient();
  
  try {
    await supabase.from("login_logs").insert({
      user_id: params.userId || null,
      email: params.email,
      ip_address: null, // Privacy: IP addresses are not logged
      user_agent: params.userAgent,
      status: params.status,
      failure_reason: params.failureReason || null,
    });
  } catch (error) {
    console.error("Failed to log login attempt:", error);
  }
}

// Check if an account is locked
export async function isAccountLocked(userId: string): Promise<{ locked: boolean; remainingMinutes: number }> {
  const supabase = getAdminClient();
  
  try {
    const { data } = await supabase
      .from("users")
      .select("locked_until")
      .eq("id", userId)
      .single();

    const user = data as { locked_until: string | null } | null;
    
    if (!user || !user.locked_until) {
      return { locked: false, remainingMinutes: 0 };
    }

    const lockedUntil = new Date(user.locked_until).getTime();
    const now = Date.now();

    if (now >= lockedUntil) {
      // Lock expired — clear it
      await supabase
        .from("users")
        .update({ locked_until: null, failed_login_attempts: 0 })
        .eq("id", userId);
      return { locked: false, remainingMinutes: 0 };
    }

    const remainingMinutes = Math.ceil((lockedUntil - now) / 60000);
    return { locked: true, remainingMinutes };
  } catch {
    return { locked: false, remainingMinutes: 0 };
  }
}

// Record a failed login attempt
export async function recordFailedLogin(userId: string): Promise<{ locked: boolean; remainingAttempts: number; lockedUntil?: Date }> {
  const supabase = getAdminClient();
  
  try {
    // Get current failed attempts
    const { data } = await supabase
      .from("users")
      .select("failed_login_attempts")
      .eq("id", userId)
      .single();

    const user = data as { failed_login_attempts: number } | null;
    const currentAttempts = (user?.failed_login_attempts || 0) + 1;
    const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - currentAttempts);

    if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
      // Lock the account
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000);
      
      await supabase
        .from("users")
        .update({ 
          failed_login_attempts: currentAttempts, 
          locked_until: lockedUntil.toISOString() 
        })
        .eq("id", userId);

      return { locked: true, remainingAttempts: 0, lockedUntil };
    }

    // Just increment the counter
    await supabase
      .from("users")
      .update({ failed_login_attempts: currentAttempts })
      .eq("id", userId);

    return { locked: false, remainingAttempts };
  } catch {
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }
}

// Reset failed login attempts on successful login
export async function resetFailedLogins(userId: string) {
  const supabase = getAdminClient();
  
  try {
    await supabase
      .from("users")
      .update({ failed_login_attempts: 0, locked_until: null })
      .eq("id", userId);
  } catch {
    // Silently fail
  }
}

// Get recent login attempts for an email (for admin view)
export async function getRecentLoginLogs(email: string, limit = 10) {
  const supabase = getAdminClient();
  
  try {
    const { data, error } = await supabase
      .from("login_logs")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export { MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MINUTES };
