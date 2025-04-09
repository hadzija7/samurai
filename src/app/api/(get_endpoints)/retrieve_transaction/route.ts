import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { Transaction } from '@/lib/utils';

export async function GET() {
  try {
    // Get stored transactions JSON string
    const storedTransactions = await kv.get("transactions");
    
    let transactions: Transaction[] = [];
    
    // Parse stored JSON string if it exists
    if (storedTransactions) {
      // Handle case where it's already parsed by KV
      if (typeof storedTransactions === 'string') {
        transactions = JSON.parse(storedTransactions);
      } else {
        transactions = storedTransactions as Transaction[];
      }
    }
    
    console.log("Retrieved transactions:", transactions);
    
    return NextResponse.json({ 
      transactions,
      count: transactions.length 
    });
    
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ 
      error: "Failed to fetch transactions",
      message: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}