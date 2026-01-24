import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Check if we're in demo/mock mode
const IS_MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/dr",
    "/api/auth",
    "/api/booking",
    "/api/webhooks",
  ];

  // Check if current path starts with any public route
  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  // In demo mode, allow all routes (user is always "logged in")
  if (IS_MOCK_MODE) {
    return NextResponse.next();
  }

  // In production mode, use NextAuth middleware
  // For now, allow all routes and let NextAuth handle protection
  // This is because we can't use withAuth in edge middleware without proper setup
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
