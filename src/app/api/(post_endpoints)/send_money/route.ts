import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("Request: ", req);
    return NextResponse.json({ success: "true" });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch transactions",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
