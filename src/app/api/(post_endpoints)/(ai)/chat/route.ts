import { registry } from '@/lib/providerRegistry';
import { CoreMessage, streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// const MODEL = registry.languageModel('akash:Meta-Llama-3-1-8B-Instruct-FP8');
// const MODEL = registry.languageModel('gaia:llama');
const MODEL = registry.languageModel('openai:gpt-4o');
const FINAL_PROMPT = 'You receive the user input and the AI agent response with a solution to the inquiry. Formulate the final response to the user based on the answer provided by the agent. Respond with the final answer only.';

export async function POST(req: Request) {
  const { messages: textMessages } = await req.json();

  console.log("----Chat Route----:", JSON.stringify(textMessages));

  // const voiceIntents: any = await retrieveVoiceIntents()
  // const messages = [...textMessages, ...voiceIntents]
  const messages = [...textMessages]

  console.debug('Messages: ', JSON.stringify(messages));

  // Validate and extract messages from request body
  if (!messages || !Array.isArray(messages)) {
    return new Response('Invalid messages format', { status: 400 });
  }

  // Send messages to classification endpoint to determine context and intent
  const classificationResult = await classifyMessages(messages);

  console.log("after classification..., ", classificationResult)

  if (!classificationResult) {
    return streamText({
      model: MODEL,
      prompt: 'You were not able to determine the user intent accurately. Respond with a request to clarify.',
    }).toDataStreamResponse();
  }

  console.debug("Classification result: ", JSON.stringify(classificationResult));

  // Add classification result to messages after attachment result
  messages.push({
    role: 'system',
    content: JSON.stringify(classificationResult)
  });

  const agentResult = await agentRouter(messages, classificationResult);

  messages.push({
    role: 'assistant',
    content: JSON.stringify(agentResult)
  });
    
  messages.unshift({
    role: 'system',
    content: FINAL_PROMPT
  });

  console.debug('Messages after agent call: ', JSON.stringify(messages));

  const result = streamText({
    model: MODEL,
    messages
  });

  return result.toDataStreamResponse();
}

const classifyMessages = async (messages: CoreMessage[]): Promise<string | null> => {
  const classifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/classification`, {
    method: 'POST',
    body: JSON.stringify({ messages }),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.MAITHAI_API_KEY || '',
    }
  });

  if (classifyResponse.ok && classifyResponse.status !== 204) {
    const classificationResult: string = await classifyResponse.json();
    return classificationResult;
  }

  return null;
};

const callAgent = async (messages: CoreMessage[], route: string) => {
  const agentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/agent/${route}`, {
    method: 'POST',
    body: JSON.stringify({ messages }),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.MAITHAI_API_KEY || '',
    }
  });


  if (agentResponse.ok && agentResponse.status !== 204) {
    const agentResult = await agentResponse.json();
    console.log('Agent response:', JSON.stringify(agentResult));

    return agentResult;
  }

  return null;
};

const agentRouter = async (messages: CoreMessage[], classificationResult: string) => {

  // const notImplemented = {answer: 'Not implemented yet.'};
  
  switch (classificationResult) {
    case 'balance_inquiry':
      return callAgent(messages, 'block_explorer');
    case 'eth_transfer_to_address':
      return callAgent(messages, 'transfer');
    case 'eth_transfer_to_ens':
      return callAgent(messages, 'transfer');
    case 'erc20_transfer_to_address':
      return callAgent(messages, 'erc20_transfer');
    case 'erc20_transfer_to_ens':
      return callAgent(messages, 'erc20_transfer');
    case 'erc20_swap':
      return callAgent(messages, 'swap');
    case 'restake':
      return callAgent(messages, 'restake');
    case 'lit_action':
      return callAgent(messages, 'lit_action')
    case 'queue_unrestake':
      return callAgent(messages, 'queue_unrestake');
    case 'complete_unrestake':
        return callAgent(messages, 'complete_unrestake');
    default:
      return {answer: 'I am sorry, I do not understand your request. Please provide clarification.'};
  }
};