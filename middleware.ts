import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Doctor dashboard routes protection
    if (pathname.startsWith("/dashboard")) {
      if (token?.role !== "doctor" && token?.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // API routes protection
    if (pathname.startsWith("/api/admin")) {
      if (token?.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    if (pathname.startsWith("/api/doctors")) {
      if (token?.role !== "doctor" && token?.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

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

        if (isPublicRoute) {
          return true;
        }

        // For protected routes, require token
        return !!token;
      },
    },
  }
);

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
