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

// In-memory cache for license status (avoids DB query on every request)
let licenseCache = { activated: false, expiresAt: 0 };

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
  const licensePublicRoutes = ["/license", "/api/license"];
  const isLicenseRoute = licensePublicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (!isLicenseRoute) {
    const now = Date.now();
    let isActivated = false;

    if (licenseCache.expiresAt > now) {
      // Use cached value
      isActivated = licenseCache.activated;
    } else {
      // Query DB and cache the result for 5 minutes
      try {
        const supabaseAdmin = getAdminClient();
        const { data: licenseData } = await supabaseAdmin
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "license_activated")
          .single();

        const licenseValue = (licenseData as { setting_value: string } | null)?.setting_value;
        isActivated = licenseValue === "true";
        licenseCache = { activated: isActivated, expiresAt: now + 5 * 60 * 1000 };
      } catch {
        // If query fails, assume not activated
        isActivated = false;
        licenseCache = { activated: false, expiresAt: now + 30 * 1000 }; // Retry sooner on failure
      }
    }

    if (!isActivated) {
      const url = request.nextUrl.clone();
      url.pathname = "/license";
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
  const publicRoutes = ["/", "/login", "/signup", "/reset-password", "/forgot-password"];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith("/api/auth") || pathname.startsWith("/api/verify-email") || pathname.startsWith("/api/resend-verification") || pathname.startsWith("/api/test-email") || pathname.startsWith("/api/license") || pathname.startsWith("/auth/callback") || pathname.startsWith("/verify-email") || pathname === "/license";

  // Notification API requires auth (not public)
  // /api/notifications is protected — handled by the route itself

  if (isPublicRoute) {
    return supabaseResponse;
  }

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  supabaseResponse.headers.set("X-XSS-Protection", "1; mode=block");
  supabaseResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  supabaseResponse.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';"
  );

  return supabaseResponse;
}
