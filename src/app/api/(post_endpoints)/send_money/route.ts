import { NextRequest, NextResponse } from "next/server";
import { NextAuthenticatedRequest, createAuthMiddleware } from "@/lib/auth";

const ALLOWED_AUDIENCE = "http://localhost:3000/home";
const authMiddleware = createAuthMiddleware(ALLOWED_AUDIENCE);

// Define your handler with typed request
export async function POST(req: NextRequest) {
  // Authenticate user
  const authReq: NextAuthenticatedRequest | NextResponse =
    await authMiddleware(req);

  if (authReq instanceof NextResponse) {
    return authReq;
  }

  // Access authenticated user information
  const { pkpAddress } = authReq.user!;

  console.log("PKP address:", pkpAddress);

  // Process request and return response
  return NextResponse.json({
    message: `Hello, user with PKP address ${pkpAddress}`,
    success: true,
  });
}
