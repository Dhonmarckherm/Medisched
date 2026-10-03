import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Cache the service client to avoid recreating on every request
let cachedAdminClient: ReturnType<typeof createClient> | null = null;

function getAdminClient() {
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return cachedAdminClient;
}

// In-memory cache for license status (avoids DB query on every request).
// Three states are tracked so a database outage is never mistaken for an
// unlicensed install: "activated", "not-activated", and "unknown" (unreachable).
type LicenseState = "activated" | "not-activated" | "unknown";

export type LicenseGateDecision = "allow" | "license-page" | "maintenance-page";

// Single place that maps a license state to what the visitor should see.
export function decideLicenseGate(state: LicenseState): LicenseGateDecision {
  if (state === "activated") return "allow";
  return state === "unknown" ? "maintenance-page" : "license-page";
}

let licenseCache: {
  state: LicenseState;
  expiresAt: number;
  confirmedActivatedAt: number;
} = { state: "unknown", expiresAt: 0, confirmedActivatedAt: 0 };

// How long a cached answer is trusted before re-querying the DB.
const LICENSE_CACHE_MS = 5 * 60 * 1000;
// After a confirmed activation, how long an unreachable DB is treated as a
// temporary outage (maintenance) instead of falling back to the license page.
const ACTIVATED_GRACE_MS = 30 * 60 * 1000;
// Shorter cache on failure so recovery is detected quickly.
const FAILURE_CACHE_MS = 30 * 1000;

// Only a genuine connectivity/infrastructure failure may yield "unknown".
// PostgREST errors such as an absent row or a denied table are conclusive:
// the system simply is not activated yet.
function isDbUnreachable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST116") return false; // no rows returned
  if (error.code && /^PGRST\d+$/i.test(error.code)) return false; // query-level error
  return /fetch failed|failed to fetch|network|socket|timeout|ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|Could not connect/i.test(
    error.message || ""
  );
}

// Pure decision for an unreachable DB: only a recently confirmed activation may
// be reported as an outage ("unknown"). A function that never confirmed
// activation has no evidence of licensing, so it falls back to the license page.
export function resolveUnreachableState(
  confirmedActivatedAt: number,
  now: number
): LicenseState {
  return now - confirmedActivatedAt < ACTIVATED_GRACE_MS ? "unknown" : "not-activated";
}

// Resolves the current license state, caching the result to avoid a DB round-trip
// on every request. Returns "unknown" only when the DB was recently confirmed
// activated but is now unreachable — i.e. a real outage, not a licensing problem.
async function getLicenseState(): Promise<LicenseState> {
  const now = Date.now();

  if (licenseCache.expiresAt > now) {
    return licenseCache.state;
  }

  let settingValue: string | null | undefined;
  let queryError: { code?: string; message?: string } | null = null;

  try {
    const supabaseAdmin = getAdminClient();
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "license_activated")
      .maybeSingle();

    settingValue = (data as { setting_value: string } | null)?.setting_value;
    queryError = error ?? null;
  } catch (err) {
    queryError = { message: (err as Error)?.message };
  }

  if (!queryError && settingValue === "true") {
    licenseCache = { state: "activated", expiresAt: now + LICENSE_CACHE_MS, confirmedActivatedAt: now };
    return "activated";
  }

  // A connectivity failure on a recently-activated install is an outage.
  if (queryError && isDbUnreachable(queryError)) {
    const state = resolveUnreachableState(licenseCache.confirmedActivatedAt, now);
    licenseCache = { ...licenseCache, state, expiresAt: now + FAILURE_CACHE_MS };
    console.warn(
      `License check could not reach the database (${queryError.message}); treating as ${
        state === "unknown" ? "database outage (maintenance)" : "not activated"
      }`
    );
    return state;
  }

  // Conclusive outcome: row absent, value not "true", or a query-level error.
  licenseCache = { ...licenseCache, state: "not-activated", expiresAt: now + LICENSE_CACHE_MS };
  return "not-activated";
}

// Security headers applied to every served page (public and authenticated)
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://api.qrserver.com; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.qrserver.com; frame-ancestors 'none';",
};

function applySecurityHeaders<T extends NextResponse>(response: T): T {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Early exit for static assets and public routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next({ request });
  }

  // Skip middleware for Next.js prefetch requests (RSC prefetch)
  // These are background fetches that shouldn't trigger auth redirects
  const prefetchHeader = request.headers.get("next-router-prefetch") || request.headers.get("purpose") === "prefetch";
  if (prefetchHeader) {
    return NextResponse.next({ request });
  }

  // License gate check — cached to avoid DB query on every request
  const licensePublicRoutes = ["/license", "/api/license", "/maintenance", "/api/health"];
  const isLicenseRoute = licensePublicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (!isLicenseRoute) {
    const decision = decideLicenseGate(await getLicenseState());

    if (decision !== "allow") {
      const url = request.nextUrl.clone();
      // A DB outage gets an honest maintenance screen — never the pay-to-activate
      // page, which would falsely tell the clinic they are unlicensed.
      url.pathname = decision === "maintenance-page" ? "/maintenance" : "/license";
      return NextResponse.redirect(url);
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Public routes - skip auth check
  const publicRoutes = ["/", "/login", "/signup", "/reset-password", "/forgot-password", "/maintenance", "/api/health"];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith("/api/auth") || pathname.startsWith("/api/verify-email") || pathname.startsWith("/api/resend-verification") || pathname.startsWith("/api/license") || pathname.startsWith("/auth/callback") || pathname.startsWith("/verify-email") || pathname === "/license";

  // Notification API requires auth (not public)
  // /api/notifications is protected — handled by the route itself

  if (isPublicRoute) {
    return applySecurityHeaders(supabaseResponse);
  }

  // Check authentication (getUser validates JWT via network; getSession is a cookie-only fallback)
  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Fallback: check locally-stored session cookie (handles transient network issues with getUser)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      user = session.user;
    }
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Use cached service client for user lookup
  const supabaseAdmin = getAdminClient();
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("role, active_status")
    .eq("auth_id", user.id)
    .limit(1);

  const dbUser = (userData?.[0] || null) as { role: string; active_status: string } | null;

  if (!dbUser) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "Account not found");
    return NextResponse.redirect(url);
  }

  // Check if user is active
  if (dbUser.active_status === "inactive") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "Account deactivated");
    return NextResponse.redirect(url);
  }

  // Route-based role checks
  const isAdminRoute = pathname.startsWith("/admin") && !pathname.startsWith("/admin/appointments") && !pathname.startsWith("/admin/certificates");
  const isStaffRoute = pathname.startsWith("/admin/appointments") || pathname.startsWith("/admin/certificates") || pathname.startsWith("/pending");

  if (isAdminRoute && dbUser.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isStaffRoute && !["admin", "nurse"].includes(dbUser.role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Add security headers to all responses
  return applySecurityHeaders(supabaseResponse);
}
