import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const isProtectedRoute =
    pathname === "/" ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/journeys") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/realtime-traffic") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings");

  // Auth routes (sign in, sign up, etc.)
  const isAuthRoute =
    pathname.startsWith("/auth/sign-in") ||
    pathname.startsWith("/auth/sign-up") ||
    pathname.startsWith("/auth/forgot-password");

  // Get session token from cookies
  const sessionToken = request.cookies.get("better-auth.session_token");

  // Redirect to sign-in if accessing protected route without auth
  if (isProtectedRoute && !sessionToken) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to home if accessing auth route while already authenticated
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled by Elysia)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
  ],
};
