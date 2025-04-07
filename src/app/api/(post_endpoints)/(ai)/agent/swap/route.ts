import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { getSwapTransaction } from '@/lib/tools/swapTx';

export async function POST(req: Request) {
    const { messages } = await req.json();

    console.log("----Swap Agent----:", messages);

    const { toolCalls } = await generateText({
        model: openai('gpt-4o-2024-08-06', { structuredOutputs: true }),
        tools: {
            swap: tool({
              description: 'A tool for creating swap transaction object. Use this tool when classification result is erc20_swap.',
              parameters: z.object({amount: z.string(), fromToken: z.string(), toToken: z.string(), address: z.string()}),
              execute: async ({amount, fromToken, toToken, address}) => getSwapTransaction(amount, fromToken, toToken, address)
            }),
            answer: tool({
                description: 'A tool for providing the final answer.',
                parameters: z.object({
                  steps: z.array(
                    z.object({
                      swapObject: z.array(z.object({address: z.string(), amount: z.string(), gasLimit: z.string(), data: z.string()})),
                      reasoning: z.string(),
                    }),
                  ),
                  answer: z.string(),
                }),
              }),
		},
        maxSteps: 5,
		toolChoice: 'required',
        system:
          	'You are generating transaction object for Ethereum EVM execution. ' +
          	'result should be proposed transaction object' +
            'Use the tools provided to generate the transaction object.',
        prompt:
          JSON.stringify(messages),
    });
      
    console.log(`FINAL TOOL CALLS: ${JSON.stringify(toolCalls, null, 2)}`);

    console.log(`STEPS RESPONSE: ${JSON.stringify(toolCalls[0].args)}`);

    return new Response(JSON.stringify(toolCalls[0].args), { 
        status: toolCalls.length ? 200 : 204,
        headers: { 'Content-Type': 'application/json' },
    });
}