import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiRoute = pathname.startsWith("/api/");
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isPublicApiRoute = ["/api/auth/login", "/api/auth/register", "/api/swagger"].includes(pathname);

  const token = request.cookies.get("token")?.value;

  // 1. API Route Protection
  if (isApiRoute) {
    if (isPublicApiRoute) return NextResponse.next();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication token is missing. Please log in." },
        { status: 401 }
      );
    }

    try {
      if (token.split('.').length !== 3) {
        throw new Error("Malformed JWT string");
      }
      return NextResponse.next();
    } catch (error) {
      const response = NextResponse.json(
        { success: false, error: "Invalid authentication token format." },
        { status: 401 }
      );
      response.cookies.delete("token");
      return response;
    }
  }

  // 2. Frontend Route Protection
  if (isAuthRoute) {
    if (token) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  // All other matched frontend routes are protected (home, profile, search, notifications, post)
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (static files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
