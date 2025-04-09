import { Transaction } from './utils';

/**
 * Stores transactions in the KV store via the API
 * @param transactions - Array of transactions to store
 * @returns Response from the API
 */
export async function storeTransactions(transactions: Transaction[]): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  count?: number;
}> {
  try {
    const response = await fetch('/api/set_transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to store transactions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error storing transactions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Retrieves transactions from the KV store via the API
 * @returns Retrieved transactions
 */
export async function retrieveTransactions(): Promise<{
  transactions?: Transaction[];
  count?: number;
  error?: string;
}> {
  try {
    const response = await fetch('/api/retrieve_transaction');

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to retrieve transactions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error retrieving transactions:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}