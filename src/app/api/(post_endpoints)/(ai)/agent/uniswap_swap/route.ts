import { NextRequest, NextResponse } from "next/server";
import { NextAuthenticatedRequest, createAuthMiddleware } from "@/lib/auth";
import { executeSwap } from "@/lib/tools/executeSwap";

const ALLOWED_AUDIENCE = "http://localhost:3000/home";
const authMiddleware = createAuthMiddleware(ALLOWED_AUDIENCE);

import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import { getSwapTransaction } from "@/lib/tools/swapTx";

// Define your handler with typed request
export async function POST(req: NextRequest) {
  console.log("In uniswap tool...");
  console.log("Request headers: ", req.headers);
  // Authenticate user
  const authReq: NextAuthenticatedRequest | NextResponse =
    await authMiddleware(req);

  console.log("After auth...");

  if (authReq instanceof NextResponse) {
    return authReq;
  }

  // Access authenticated user information
  const { pkpAddress } = authReq.user!;
  // const { purchaseAmount } = await req.json();
  // const pkpAddress = "0xF56eb5eB59d03606ab4aC901B43851431093d3Af";
  // const purchaseAmount = 0.1; //in dollars

  console.log("PKP address:", pkpAddress);

  const { messages } = await req.json();

  console.log("----Swap Agent----:", messages);

  const { toolCalls } = await generateText({
    model: openai("gpt-4o-2024-08-06", { structuredOutputs: true }),
    tools: {
      swap: tool({
        description:
          "A tool for creating swap transaction object. Use this tool when classification result is erc20_swap.",
        parameters: z.object({
          amount: z.number(),
          fromToken: z.string(),
          toToken: z.string(),
        }),
        execute: async ({ amount, fromToken, toToken }) =>
          executeSwap(amount, fromToken, toToken, pkpAddress),
        // getSwapTransaction(amount, fromToken, toToken, address),
      }),
      answer: tool({
        description: "A tool for providing the final answer.",
        parameters: z.object({
          steps: z.array(
            z.object({
              swapObject: z.array(
                z.object({
                  address: z.string(),
                  amount: z.string(),
                  gasLimit: z.string(),
                  data: z.string(),
                }),
              ),
              reasoning: z.string(),
            }),
          ),
          answer: z.string(),
        }),
      }),
    },
    maxSteps: 5,
    toolChoice: "required",
    system:
      "You are generating transaction object for Ethereum EVM execution. " +
      "result should be proposed transaction object" +
      "Use the tools provided to generate the transaction object.",
    prompt: JSON.stringify(messages),
  });

  console.log(`FINAL TOOL CALLS: ${JSON.stringify(toolCalls, null, 2)}`);

  console.log(`STEPS RESPONSE: ${JSON.stringify(toolCalls[0].args)}`);

  return new Response(JSON.stringify(toolCalls[0].args), {
    status: toolCalls.length ? 200 : 204,
    headers: { "Content-Type": "application/json" },
  });

  // Process request and return response
  // return NextResponse.json({
  //   message: `Hello, user with PKP address ${pkpAddress}`,
  //   success: true,
  // });
}
