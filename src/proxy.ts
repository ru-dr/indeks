import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is a dashboard route (protected routes)
  const isProtectedRoute =
    pathname === "/" ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/realtime-traffic") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings");

  // Check if the route is an auth route
  const isAuthRoute =
    pathname.startsWith("/auth/sign-in") ||
    pathname.startsWith("/auth/sign-up") ||
    pathname.startsWith("/auth/forgot-password");

  // Get the session token from cookies
  const sessionToken = request.cookies.get("better-auth.session_token");

  // If trying to access protected route without authentication, redirect to sign-in
  if (isProtectedRoute && !sessionToken) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
  ],
};
