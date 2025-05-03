// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { expressAuthHelpers } from "@lit-protocol/vincent-sdk";

// const ALLOWED_AUDIENCE: string =
//   process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// export async function middleware(request: NextRequest) {
//   try {
//     console.log("In middleware");
//     const { getAuthenticateUserExpressHandler } = expressAuthHelpers;
//     const authenticateUser =
//       getAuthenticateUserExpressHandler(ALLOWED_AUDIENCE);

//     // Create a response object
//     const response = NextResponse.next();

//     // Execute authentication
//     const authResult: any = await new Promise((resolve) => {
//       authenticateUser(request, response, (result: any) => {
//         resolve(result);
//       });
//     });

//     console.log("Before authResult");
//     if (!authResult.success) {
//       return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
//         status: 401,
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });
//     }

//     // Add auth info to headers if needed
//     response.headers.set("x-auth-user", JSON.stringify(authResult.user));

//     console.log("-------------- Response Headers:", response.headers);
//     return response;
//   } catch (error) {
//     console.error("Authentication error:", error);
//     return new NextResponse(
//       JSON.stringify({ error: "Authentication failed" }),
//       {
//         status: 401,
//         headers: {
//           "Content-Type": "application/json",
//         },
//       },
//     );
//   }
// }

// export const config = {
//   matcher: ["/api/:path*"],
//   runtime: "nodejs",
// };
