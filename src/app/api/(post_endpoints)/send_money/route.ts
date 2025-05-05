import { NextRequest, NextResponse } from "next/server";
import { NextAuthenticatedRequest, createAuthMiddleware } from "@/lib/auth";
import { executeSwap } from "@/lib/tools/executeSwap";

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
  // const { pkpAddress } = authReq.user!;
  // const { purchaseAmount } = await req.json();
  const pkpAddress = "0xF56eb5eB59d03606ab4aC901B43851431093d3Af";
  const purchaseAmount = 1; //in dollars

  if (!purchaseAmount || purchaseAmount <= 0) {
    return NextResponse.json({
      message: "Invalid purchase amount",
      success: false,
    });
  }

  console.log("PKP address:", pkpAddress);

  //call Lit Action and pass pkpAddress as parameter.
  await executeSwap(purchaseAmount, pkpAddress);

  console.log("Swap executed");

  // Process request and return response
  return NextResponse.json({
    message: `Hello, user with PKP address ${pkpAddress}`,
    success: true,
  });
}
