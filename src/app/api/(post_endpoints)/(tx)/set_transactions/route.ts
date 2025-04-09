import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { Transaction } from '@/lib/utils';
import { z } from 'zod';

// Create a Zod schema for request validation
const setTransactionsSchema = z.object({
  transactions: z.array(
    z.object({
      to: z.string(),
      data: z.string(),
      value: z.string()
    })
  )
});

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the request body against our schema
    const result = setTransactionsSchema.safeParse(body);
    
    if (!result.success) {
      console.error("Invalid transaction data:", result.error);
      return NextResponse.json({ 
        error: "Invalid transaction data format", 
        details: result.error.format() 
      }, { status: 400 });
    }
    
    const { transactions } = result.data;
    
    // Store transactions in KV
    await kv.set("transactions", JSON.stringify(transactions));
    
    console.log("Transactions stored successfully:", transactions);
    
    return NextResponse.json({ 
      success: true, 
      message: "Transactions stored successfully",
      count: transactions.length
    });
    
  } catch (error) {
    console.error("Error storing transactions:", error);
    return NextResponse.json({ 
      error: "Failed to store transactions",
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}