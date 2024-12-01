import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isStaffRoute = request.nextUrl.pathname.startsWith("/staff");
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isProtectedRoute = isAdminRoute || isStaffRoute || isLoginPage;

  // Always check role for protected routes and login page
  if (isProtectedRoute) {
    if (!token) {
      // If no token and trying to access protected route, redirect to login
      if (!isLoginPage) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    try {
      // Check role for every protected route access
      const roleCheckResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/check-role`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!roleCheckResponse.ok) {
        // If role check fails, clear token and redirect to login
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("token");
        return response;
      }

      const data = await roleCheckResponse.json();

      // Handle routing based on role and requested path
      if (isLoginPage) {
        // Redirect from login page based on role
        if (data.isAdmin) {
          return NextResponse.redirect(new URL("/admin", request.url));
        } else if (data.isStaff) {
          return NextResponse.redirect(new URL("/staff", request.url));
        }
      } else if (isAdminRoute && !data.isAdmin) {
        // Prevent staff from accessing admin routes
        return NextResponse.redirect(new URL("/staff", request.url));
      } else if (isStaffRoute && !data.isStaff && !data.isAdmin) {
        // Prevent non-staff/non-admin from accessing staff routes
        return NextResponse.redirect(new URL("/login", request.url));
      }

      // Allow access if all checks pass
      return NextResponse.next();
    } catch (error) {
      // On error, clear token and redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/login"],
};
