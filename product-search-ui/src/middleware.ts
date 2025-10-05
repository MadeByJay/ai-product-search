import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // Custom middleware logic
  function middleware(req) {
    return NextResponse.next();
  },
  {
    // Middleware options
    callbacks: {
      // Return true if the user is authorized
      authorized: ({ token }) => !!token,
    },
  },
);

// Limit which routes the middleware applies to
export const config = {
  matcher: [
    "/profile/:path*", // protect profile routes
    "/dashboard/:path*", // protect analytics dashboard
  ],
};
