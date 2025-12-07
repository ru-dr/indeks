import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname === "/" ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/journeys") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/realtime-traffic") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings");

  const isAuthRoute =
    pathname.startsWith("/auth/sign-in") ||
    pathname.startsWith("/auth/sign-up") ||
    pathname.startsWith("/auth/forgot-password");

  const sessionToken = request.cookies.get("better-auth.session_token");

  if (isProtectedRoute && !sessionToken) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute && sessionToken) {
    const redirectParam = request.nextUrl.searchParams.get("redirect");
    if (redirectParam?.startsWith("/invite/")) {
      return NextResponse.next();
    }

    const registeredParam = request.nextUrl.searchParams.get("registered");
    if (registeredParam === "true") {
      return NextResponse.next();
    }

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
