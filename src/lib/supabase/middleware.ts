import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ["/", "/login", "/signup", "/reset-password"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/api/auth")
  );

  if (isPublicRoute) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Get user role from database
  const { data: dbUser } = await supabase
    .from("users")
    .select("role, active_status")
    .eq("auth_id", user.id)
    .single();

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

  // Admin-only routes
  const adminRoutes = ["/admin", "/admin/users"];
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (isAdminRoute && dbUser.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Admin/Nurse routes
  const staffRoutes = ["/admin/appointments", "/admin/certificates", "/pending"];
  const isStaffRoute = staffRoutes.some((route) => pathname.startsWith(route));
  if (isStaffRoute && !["admin", "nurse"].includes(dbUser.role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated students away from admin pages
  if (pathname === "/admin" && dbUser.role === "student") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
