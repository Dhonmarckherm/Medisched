// Simple rate limiter using in-memory storage
// Works in serverless environments with periodic cleanup

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter: number; // seconds
}

export function rateLimit(
  key: string,
  options: {
    limit?: number;      // max requests
    window?: number;     // time window in seconds
  } = {}
): RateLimitResult {
  const { limit = 5, window = 60 } = options;
  const now = Date.now();
  const resetAt = now + window * 1000;

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First request or window expired
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: limit - 1,
      resetAt: new Date(resetAt),
      retryAfter: 0,
    };
  }

  if (entry.count >= limit) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetAt: new Date(entry.resetAt),
      retryAfter,
    };
  }

  // Increment counter
  entry.count++;
  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: new Date(entry.resetAt),
    retryAfter: 0,
  };
}

// Pre-configured rate limiters
export const authRateLimit = {
  login: (ip: string) => rateLimit(`login:${ip}`, { limit: 5, window: 60 }),      // 5 per minute
  signup: (ip: string) => rateLimit(`signup:${ip}`, { limit: 3, window: 300 }),   // 3 per 5 minutes
  resetPassword: (ip: string) => rateLimit(`reset:${ip}`, { limit: 3, window: 900 }), // 3 per 15 minutes
  resendVerification: (ip: string) => rateLimit(`resend:${ip}`, { limit: 2, window: 300 }), // 2 per 5 minutes
};
