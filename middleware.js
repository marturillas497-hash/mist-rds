import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // 1. Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Fetch Profile Status and Role (if user exists)
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  // 3. THE GATEKEEPER: Status Check
  // If user is logged in but NOT active, bounce them to login with an error param
  if (user && profile && profile.status !== "active") {
    // We redirect to login and pass the status as an error code
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", profile.status); // e.g., ?error=pending
    
    // Create a response that clears the session cookie to prevent loops
    const redirectResponse = NextResponse.redirect(loginUrl);
    // This is a "soft" sign out at the middleware level
    redirectResponse.cookies.delete('sb-access-token'); 
    redirectResponse.cookies.delete('sb-refresh-token');
    return redirectResponse;
  }

  // ── Protect /admin/* ──────────────────────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user || profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // ── Protect /adviser/* ────────────────────────────────────────────────────
  if (pathname.startsWith("/adviser")) {
    if (!user || profile?.role !== "research_adviser") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // ── Protect Student Routes (/submit, /report, /dashboard) ──────────────────
  const studentRoutes = ["/submit", "/report", "/dashboard", "/library"];
  if (studentRoutes.some(route => pathname.startsWith(route))) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Optional: Prevent advisers from accessing student-only submission pages
    if (profile?.role === "research_adviser") {
      return NextResponse.redirect(new URL("/adviser", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/adviser/:path*",
    "/submit/:path*",
    "/report/:path*",
    "/dashboard/:path*",
    "/library/:path*",
  ],
};