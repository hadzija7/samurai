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