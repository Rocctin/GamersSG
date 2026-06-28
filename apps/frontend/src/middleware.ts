import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";

/**
 * JWT claims shape from the backend access token.
 * The middleware only decodes (no signature verification) — the backend
 * still cryptographically enforces every API call. Forged cookies with
 * fake role claims would only show empty page shells without data.
 */
interface JwtClaims {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect dashboard, admin, organiser, profile, and settings routes
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/organiser") ||
    pathname.startsWith("/become-organiser") ||
    pathname.startsWith("/admin");

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const accessToken = request.cookies.get("access_token")?.value;

  // No access token → redirect to login (preserve intended destination)
  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For admin routes, verify the user has the ADMIN role
  if (isAdminRoute) {
    try {
      const claims = decodeJwt(accessToken) as unknown as JwtClaims;
      if (claims.role !== "ADMIN") {
        // Non-admin user trying to access admin — redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Invalid JWT — redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Match all protected routes.
 * Middleware runs at the Edge/Node.js level before any page JS loads,
 * so non-ADMIN users never see the admin component tree.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/organiser/:path*",
    "/become-organiser/:path*",
    "/admin/:path*",
  ],
};
