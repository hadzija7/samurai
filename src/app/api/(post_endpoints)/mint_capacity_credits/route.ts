import { NextRequest, NextResponse } from "next/server";
import { NextAuthenticatedRequest, createAuthMiddleware } from "@/lib/auth";
import { mintCapacityCredits } from "@/lib/tools/utils/mint-capacity-credits";

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

  await mintCapacityCredits();

  // Process request and return response
  return NextResponse.json({
    message: `Minted capacity credits`,
    success: true,
  });
}
