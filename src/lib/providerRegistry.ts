import { createOpenAI } from '@ai-sdk/openai';
import { createProviderRegistry } from 'ai';

export const registry = createProviderRegistry({
  // register provider with prefix and custom setup:
  openai: createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
  akash: createOpenAI({
    apiKey: process.env.AKASH_API_KEY,
    baseURL: "https://chatapi.akash.network/api/v1"
  }),
  gaia: createOpenAI({
    baseURL: "https://llama8b.gaia.domains/v1"
  })
});