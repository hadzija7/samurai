import { NextRequest, NextResponse } from "next/server";
import { jwt } from "@lit-protocol/vincent-sdk";
import next from "next";

const { verify } = jwt;

/**
 * Interface for authenticated user data
 */
export interface AuthenticatedUser {
  decodedJWT: any;
  rawJWT: string;
  pkpAddress: string;
}

/**
 * Interface for request with authenticated user
 */
export type NextAuthenticatedRequest = NextRequest & {
  user?: AuthenticatedUser;
};

/**
 * Type for authenticated request handler
 */
export type NextAuthenticatedRequestHandler = (
  req: NextAuthenticatedRequest,
) => Promise<NextResponse> | NextResponse;

/**
 * Function to parse and validate JWT token from request
 */
export function parseJwtFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
    return null;
  }

  return parts[1];
}

/**
 * Higher-order function to ensure a request is authenticated
 *
 * @param handler The handler function to be wrapped with authentication
 * @returns A function that checks authentication before calling the handler
 */
export function withAuth(handler: NextAuthenticatedRequestHandler) {
  return async (req: NextRequest) => {
    // Check if req has user property
    const authenticatedReq = req as NextAuthenticatedRequest;

    if (!authenticatedReq.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Request is authenticated, call the handler
    return handler(authenticatedReq);
  };
}

/**
 * Middleware to authenticate user with JWT
 *
 * @param allowedAudience The allowed audience for the JWT
 * @returns A middleware function for Next.js
 */
export function createAuthMiddleware(allowedAudience: string) {
  return async function authMiddleware(
    req: NextRequest,
  ): Promise<NextResponse | NextAuthenticatedRequest> {
    const rawJWT = parseJwtFromRequest(req);
    if (!rawJWT) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    try {
      const decodedJWT = verify(rawJWT, allowedAudience);
      if (!decodedJWT) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }

      // // Create a new request with user information
      const authenticatedReq = req as NextAuthenticatedRequest;
      authenticatedReq.user = {
        decodedJWT,
        rawJWT,
        pkpAddress: decodedJWT.payload.pkp.ethAddress,
      };

      return authenticatedReq;
    } catch (e) {
      return NextResponse.json(
        { error: `Invalid token: ${(e as Error).message}` },
        { status: 401 },
      );
    }
  };
}
