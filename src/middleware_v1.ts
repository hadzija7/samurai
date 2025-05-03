// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAuthMiddleware } from "@/lib/auth";

const authMiddleware = createAuthMiddleware("http://localhost:3000");

export async function middleware(request: NextRequest) {
  console.log("In middleware...");
  if (request.nextUrl.pathname.startsWith("/api")) {
    return authMiddleware(request);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
