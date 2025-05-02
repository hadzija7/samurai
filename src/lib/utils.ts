import { Hex } from "viem";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function extractJSONFromStream(stream: ReadableStream | null) {
  if (!stream) {
    return null;
  }
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  // Parse the JSON string
  return JSON.parse(result);
}

export interface Transaction {
  to: Hex;
  // gasLimit?: string;
  data: Hex;
  value: string;
}

export const BASE_CHAIN_ID = 8453;
