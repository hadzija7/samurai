import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// import { createAuthMiddleware } from "@/lib/auth";

// const authMiddleware = createAuthMiddleware("http://localhost:3000");

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // return NextResponse.redirect(new URL("/home", request.url));
  // if (request.nextUrl.pathname.startsWith("/api")) {
  //   return authMiddleware(request);
  // }
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/api/test/:path*",
};
