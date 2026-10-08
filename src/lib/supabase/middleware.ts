import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check guest session cookie
  const guestSession = request.cookies.get("safarx_guest_session")?.value;
  const isAuthenticated = !!user || !!guestSession;

  const { pathname } = request.nextUrl;

  // Protected paths that require authentication (or guest session for booking)
  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/booking") ||
    pathname.startsWith("/partner") ||
    pathname.startsWith("/admin");

  // Auth pages (login, register)
  const isAuthPage =
    pathname === "/login" || pathname === "/register";

  // Redirect unauthenticated users to /login
  if (isProtectedPath && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in permanent users away from auth pages to /dashboard
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
