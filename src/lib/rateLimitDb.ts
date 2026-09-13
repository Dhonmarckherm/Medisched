/**
 * Persistent rate limiter using Supabase database
 * Survives server restarts and works across all serverless instances
 */
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter: number; // seconds
}

export async function persistentRateLimit(
  key: string,
  options: {
    limit?: number;      // max requests
    window?: number;     // time window in seconds
  } = {}
): Promise<RateLimitResult> {
  const { limit = 5, window = 60 } = options;
  const now = Date.now();
  const resetAt = now + window * 1000;
  const supabase = getAdminClient();

  try {
    // Try to get existing entry
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("count, reset_at")
      .eq("id", key)
      .single();

    if (!existing || now > existing.reset_at) {
      // First request or window expired — upsert
      await supabase
        .from("rate_limits")
        .upsert({ id: key, count: 1, reset_at: resetAt });

      return {
        success: true,
        remaining: limit - 1,
        resetAt: new Date(resetAt),
        retryAfter: 0,
      };
    }

    if (existing.count >= limit) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((existing.reset_at - now) / 1000);
      return {
        success: false,
        remaining: 0,
        resetAt: new Date(existing.reset_at),
        retryAfter,
      };
    }

    // Increment counter
    const newCount = existing.count + 1;
    await supabase
      .from("rate_limits")
      .update({ count: newCount })
      .eq("id", key);

    return {
      success: true,
      remaining: limit - newCount,
      resetAt: new Date(existing.reset_at),
      retryAfter: 0,
    };
  } catch {
    // If database is unavailable, fail open (allow request)
    // This prevents the rate limiter from blocking legitimate traffic during DB outages
    return {
      success: true,
      remaining: limit,
      resetAt: new Date(resetAt),
      retryAfter: 0,
    };
  }
}

// Pre-configured rate limiters (async versions)
export const dbRateLimit = {
  login: (ip: string) => persistentRateLimit(`login:${ip}`, { limit: 5, window: 60 }),
  signup: (ip: string) => persistentRateLimit(`signup:${ip}`, { limit: 3, window: 300 }),
  resetPassword: (ip: string) => persistentRateLimit(`reset:${ip}`, { limit: 3, window: 900 }),
  resendVerification: (ip: string) => persistentRateLimit(`resend:${ip}`, { limit: 2, window: 300 }),
  licenseAttempt: (ip: string) => persistentRateLimit(`license:${ip}`, { limit: 5, window: 300 }),
};

// Cleanup old rate limit entries (run periodically via cron or manually)
export async function cleanupRateLimits() {
  const supabase = getAdminClient();
  const now = Date.now();
  
  try {
    await supabase
      .from("rate_limits")
      .delete()
      .lt("reset_at", now);
  } catch {
    // Silently fail cleanup
  }
}
