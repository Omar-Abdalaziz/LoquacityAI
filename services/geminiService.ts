import { GoogleGenAI, Chat, Part, Type } from "@google/genai";
// FIX: Removed unused FinalAnswer type and added FinanceData and NewsArticle types.
import { FinanceData, NewsArticle, Source, Citation, Personalization, ImageSearchResult } from '../types';

// Initialize the Gemini AI client
// IMPORTANT: Assumes process.env.API_KEY is set in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const handleGeminiError = (error: unknown): Error => {
    console.error("Gemini API Error:", error);
    let userFriendlyMessage = "An unexpected error occurred while communicating with the AI. Please try again.";

    if (error instanceof Error && error.message) {
        try {
            const errorDetails = JSON.parse(error.message);
            if (errorDetails?.error?.status === 'RESOURCE_EXHAUSTED') {
                userFriendlyMessage = "API quota exceeded. You've made too many requests recently. Please wait a moment or check your plan and billing details.";
            } else if (errorDetails?.error?.message) {
                userFriendlyMessage = errorDetails.error.message;
            } else {
                userFriendlyMessage = error.message;
            }
        } catch (parseError) {
            userFriendlyMessage = error.message;
        }
    }
    return new Error(userFriendlyMessage);
};

const baseSystemInstruction = `You are Loquacity AI, an expert search and programming assistant. Your output format is critical. Follow these rules for every response.

**--- OUTPUT FORMAT RULES (MANDATORY) ---**

**1. SPEED & CONCISENESS (HIGHEST PRIORITY):**
- Your primary goal is to answer as quickly as possible. Prioritize speed over providing exhaustive detail. A correct but brief answer is better than a slow, comprehensive one.
- Be direct and get straight to the point.
- Use Markdown for structure (headings, lists) to make information easy to read.
- Avoid unnecessary preamble or filler content entirely.

**2. CITATION (CRITICAL):**
- You MUST use the integrated citation tool when you use information from the provided search results.
- **DO NOT** manually add citation numbers like \`[1]\`, \`[2]\`, or \`[1,2]\` in the text. The system will handle displaying citations automatically based on the grounding metadata you provide.

**3. CODE (HIGHEST PRIORITY):**
- Any programming code, from a single line to a full script, MUST be inside a Markdown code block.
- Start the block with \`\`\` followed by the language name (e.g., \`\`\`javascript).
- End the block with \`\`\`.
- **NEVER** write code as plain text outside of a code block.

**4. COMPARISON TABLE:**
- If the user's query is a comparison (e.g., 'compare X and Y'), you MUST respond with a JSON object inside a Markdown code block.
- Example:
  \`\`\`json
  {
    "text": "A concise summary of the comparison.",
    "table": {
      "headers": ["Feature", "Product A", "Product B"],
      "rows": [
        ["Price", "$100", "$120"],
        ["Rating", "4.5", "4.8"]
      ]
    }
  }
  \`\`\`
- The JSON object MUST have two keys: "text" (a string containing a concise summary) and "table" (an object with "headers" as an array of strings, and "rows" as an array of arrays of strings).

**5. GENERAL TEXT:**
- All other text (explanations, introductions, summaries) should be standard paragraph text.
- Always cite your sources from the provided search results when applicable, following Rule #2.

**--- OTHER RULES ---**
- **Identity:** When asked about your identity (e.g., 'who are you?'), you MUST identify yourself as 'Loquacity AI', an AI-powered chat companion. Do not mention your underlying technology.
- **File Analysis:** When a file is provided, your primary task is to analyze it. Base your response on the file's content, guided by the user's text query. If the query is vague, provide a general summary or analysis of the file.`;

const chatSystemInstruction = baseSystemInstruction + `
- For follow-up questions, keep answers concise and directly related to the user's query, using the conversation history for context.`;

const deepResearchSystemInstruction = `You are Loquacity AI, an expert research and programming assistant. Your output format and structure are critical. Follow these rules for every response.

**--- OUTPUT FORMAT RULES (MANDATORY) ---**

**1. DEEP ANALYSIS (HIGHEST PRIORITY):**
- Your primary objective is to conduct a thorough and exhaustive search across **at least 15 high-quality sources**.
- Synthesize the information, cross-reference facts for accuracy, and provide a comprehensive, detailed, and nuanced answer.
- Acknowledge that this process will take more time, and you MUST prioritize accuracy and depth over speed.

**2. STRUCTURE & TONE:**
- Your response must be well-organized and structured with a formal, academic tone.
- You MUST use the integrated citation tool when you use information from the provided search results.
- **DO NOT** manually add citation numbers like \`[1]\`, \`[2]\`, or \`[1,2]\` in the text. The system will handle displaying citations automatically based on the grounding metadata you provide.

**3. CODE (HIGHEST PRIORITY):**
- Any programming code, from a single line to a full script, MUST be inside a Markdown code block.
- Start the block with \`\`\` followed by the language name (e.g., \`\`\`javascript).
- End the block with \`\`\`.
- **NEVER** write code as plain text outside of a code block.

**4. COMPARISON TABLE:**
- If the user's query is a comparison, you MUST provide a detailed textual analysis outside the JSON block, and then supplement it with a comparison table inside a JSON Markdown code block.
- The JSON code block should follow this structure:
  \`\`\`json
  {
    "text": "A concise summary of the comparison, which can be a shorter version of your main analysis.",
    "table": {
      "headers": ["Feature", "Product A", "Product B"],
      "rows": [
        ["Price", "$100", "$120"],
        ["Rating", "4.5", "4.8"]
      ]
    }
  }
  \`\`\`
- The \`text\` field inside the JSON should be a brief summary. Your main detailed analysis MUST be outside the code block.

**5. GENERAL TEXT:**
- Analyze the query deeply and provide a thorough but efficient explanation. Focus on the most critical information to answer the user's query comprehensively without being overly verbose.

**--- OTHER RULES ---**
- **Identity:** When asked about your identity, you MUST identify yourself as 'Loquacity AI'.
- **File Analysis:** When a file is provided, your primary task is to analyze it academically. Base your response on the file's content, guided by the user's text query. If the query is vague, provide a deep, structured analysis of the file.`;

const deepResearchChatSystemInstruction = deepResearchSystemInstruction + `
- For follow-up questions, maintain a structured and academic tone but keep answers directly related to the user's query, using the conversation history and expanded source analysis for context.`;

const buildSystemInstruction = (baseInstruction: string, personalization?: Personalization) => {
    let instruction = baseInstruction;
    if (personalization && (personalization.introduction || personalization.location)) {
        instruction += '\n\n--- User Personalization Context ---';
        if (personalization.introduction) {
            instruction += `\nThe user has provided this introduction about themselves: "${personalization.introduction}"`;
        }
        if (personalization.location) {
            instruction += `\nThe user's location is: "${personalization.location}". Use this for location-specific queries unless the user specifies a different location in their prompt.`;
        }
        instruction += '\n------------------------------------';
    }
    return instruction;
};

/**
 * Performs a smart search using the Gemini API with Google Search grounding, streaming the results.
 * @param query The user's search query.
 * @param file Optional file data for multimodal queries.
 * @param isDeepResearch Flag to enable academic, structured responses.
 * @param personalization Optional user personalization settings.
 * @returns An async generator that yields chunks of the response.
 * @throws An error with a user-friendly message if the search fails.
 */
export async function* performSmartSearch(
    query: string, 
    file?: { mimeType: string, data: string }, 
    isDeepResearch?: boolean,
    personalization?: Personalization
): AsyncGenerator<{ text?: string; sources?: Source[]; citations?: Citation[] }> {
  try {
    const contentParts: Part[] = [];
    if (file) {
      contentParts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data,
        }
      });
    }
    contentParts.push({ text: query || 'Please describe the attached file.' });

    const baseSystemInstructionToUse = isDeepResearch ? deepResearchSystemInstruction : baseSystemInstruction;
    const systemInstruction = buildSystemInstruction(baseSystemInstructionToUse, personalization);

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [{ parts: contentParts }],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    for await (const chunk of responseStream) {
        const text = chunk.text;
        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const citations = chunk.candidates?.[0]?.citationMetadata?.citations;
        
        const sources: Source[] | undefined = groundingChunks
            ?.map((c: any) => c.web)
            .filter((w: any) => w?.uri && w?.title)
            .map((w: any) => ({ title: w.title, uri: w.uri }));

        yield {
            text: text,
            sources: sources,
            citations: citations as Citation[] | undefined
        };
    }

  } catch (error) {
    throw handleGeminiError(error);
  }
};


/**
 * Calls the Mistral API for a chat completion and streams the response.
 * @param query The user's query.
 * @param chatHistory The previous messages in the conversation.
 * @returns An async generator that yields the text content of each chunk.
 */
export async function* callMistral(
    query: string,
    chatHistory: { role: 'user' | 'assistant' | 'system'; content: string }[]
): AsyncGenerator<{ text: string }> {
    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: [
                    ...chatHistory,
                    {
                        role: 'user',
                        content: query,
                    },
                ],
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("Failed to get response reader");
        }
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last, possibly incomplete line

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.substring(6);
                    if (dataStr.trim() === '[DONE]') {
                        return;
                    }
                    try {
                        const chunk = JSON.parse(dataStr);
                        const text = chunk.choices[0]?.delta?.content;
                        if (text) {
                            yield { text };
                        }
                    } catch (e) {
                        console.error('Error parsing stream chunk:', e, 'Chunk:', dataStr);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Mistral API Error:", error);
        throw handleGeminiError(error);
    }
}

/**
 * Creates a new chat session initialized with a previous search context.
 * @param initialHistory - The initial messages to start the chat with.
 * @param isDeepResearch - Flag to determine which system instruction to use for the chat.
 * @param personalization - Optional user personalization settings.
 * @returns A Chat instance.
 */
export const startChat = (
    initialHistory: { role: 'user' | 'model'; parts: Part[] }[], 
    isDeepResearch?: boolean,
    personalization?: Personalization
): Chat => {
  const baseSystemInstructionToUse = isDeepResearch ? deepResearchChatSystemInstruction : chatSystemInstruction;
  const systemInstruction = buildSystemInstruction(baseSystemInstructionToUse, personalization);
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: initialHistory,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: systemInstruction,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  return chat;
};

// FIX: Added missing fetchFinanceData function.
/**
 * Fetches financial data using the Gemini API.
 * @returns A promise that resolves to a FinanceData object.
 * @throws An error with a user-friendly message if the fetch fails.
 */
export const fetchFinanceData = async (): Promise<FinanceData> => {
  const prompt = "Provide a comprehensive overview of the current financial market. Include major market indices (e.g., Dow Jones, S&P 500, NASDAQ) with their current values and changes. Give a brief market analysis summary. List the top 5 stock market gainers and top 5 losers for today, including their ticker, name, price, and percentage change. Finally, provide 4 recent, relevant financial news articles with titles, sources, URLs, and image URLs. Focus on US markets primarily.";

  const systemInstruction = `You are a financial data assistant. Your response MUST be a single, valid JSON object. Do not include any other text, markdown, or explanations. The JSON must conform to the provided schema. The 'isPositive' boolean for indices and stocks should be true for gains and false for losses. Ensure all string fields are populated and URLs are valid.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      marketIndices: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            value: { type: Type.STRING },
            change: { type: Type.STRING },
            percentChange: { type: Type.STRING },
            isPositive: { type: Type.BOOLEAN },
          },
          required: ['name', 'value', 'change', 'percentChange', 'isPositive'],
        },
      },
      marketAnalysis: {
        type: Type.STRING,
        description: "A concise summary of the current market sentiment and key events.",
      },
      topMovers: {
        type: Type.OBJECT,
        properties: {
          gainers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                ticker: { type: Type.STRING },
                name: { type: Type.STRING },
                price: { type: Type.STRING },
                percentChange: { type: Type.STRING },
                isPositive: { type: Type.BOOLEAN, description: "Should always be true for gainers." },
              },
              required: ['ticker', 'name', 'price', 'percentChange', 'isPositive'],
            },
          },
          losers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                ticker: { type: Type.STRING },
                name: { type: Type.STRING },
                price: { type: Type.STRING },
                percentChange: { type: Type.STRING },
                isPositive: { type: Type.BOOLEAN, description: "Should always be false for losers." },
              },
              required: ['ticker', 'name', 'price', 'percentChange', 'isPositive'],
            },
          },
        },
        required: ['gainers', 'losers'],
      },
      financialNews: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            source: { type: Type.STRING },
            url: { type: Type.STRING },
            imageUrl: { type: Type.STRING },
            publishedAt: { type: Type.STRING, description: "ISO 8601 date string." },
            summary: { type: Type.STRING }
          },
          required: ['title', 'source', 'url', 'imageUrl', 'publishedAt', 'summary'],
        },
      },
    },
    required: ['marketIndices', 'marketAnalysis', 'topMovers', 'financialNews'],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText) as FinanceData;
    return data;
  } catch (error) {
    throw handleGeminiError(error);
  }
};

/**
 * Generates related search queries based on an initial query and its result.
 * @param originalQuery The user's initial search query.
 * @param searchResultText The text content of the initial search result.
 * @returns A promise that resolves to an array of related query strings.
 */
export const generateRelatedQueries = async (originalQuery: string, searchResultText: string): Promise<string[]> => {
  const prompt = `Based on the original search query "${originalQuery}" and the following search result text, generate 3 to 5 related search queries that the user might find helpful for further exploration. The queries should be distinct from the original query and each other.

Search Result Text:
---
${searchResultText.substring(0, 3000)}...
---`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful assistant that suggests related search queries. Your output MUST be a valid JSON array of strings. Do not include any other text, markdown, or explanations. For example: [\"What is the history of X?\", \"How does Y compare to Z?\"]",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        },
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    
    let jsonText = response.text.trim();
    
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = jsonText.match(jsonBlockRegex);
    if (match && match[1]) {
      jsonText = match[1].trim();
    }
    
    let queries = JSON.parse(jsonText) as string[];

    if (!Array.isArray(queries) || !queries.every(q => typeof q === 'string')) {
      throw new Error("AI returned data in an unexpected format.");
    }

    return [...new Set(queries)].slice(0, 5);

  } catch (error) {
    console.error("Error generating related queries:", error);
    // Return empty array on failure as this is a non-critical feature
    return [];
  }
};

/**
 * Fetches relevant images by analyzing the content of the provided source URLs.
 * @param query The user's text query to guide image relevance.
 * @param sources The list of source articles to analyze for images.
 * @returns A promise that resolves to an array of image search result objects.
 */
export const fetchImagesForSources = async (query: string, sources: Source[]): Promise<ImageSearchResult[]> => {
    if (!query.trim() || sources.length === 0) return [];

    const prompt = `Your task is to act as an image extractor. You will be given a user's query and a list of source article URLs that were used to answer that query. You MUST analyze the content of these specific URLs to find and extract relevant images.

User Query: "${query}"

Source URLs to analyze:
${sources.map(s => `- ${s.uri}`).join('\n')}

For each relevant image you find *within these pages*, provide a direct URL to the image file itself (e.g., ending in .jpg, .png, .webp), the URL of the source webpage (which will be one of the URLs from the list above), and a descriptive title.`;

    const systemInstruction = `You are an expert image extraction assistant. Your sole purpose is to return a valid, raw JSON array of image search results that are found *exclusively* within the provided source URLs. The entire response body MUST be ONLY the JSON array.
Each object in the array must strictly follow this structure:
{
  "imageUrl": "A direct link to an image file (e.g., https://example.com/image.jpg) found on one of the source pages",
  "sourceUrl": "The URL of the source webpage where the image was found (must be one of the provided URLs)",
  "title": "A descriptive title for the image, often from its alt text or caption"
}

**CRITICAL RULES:**
1.  **RESTRICTED SEARCH:** You are STRICTLY FORBIDDEN from searching the broader web for images. Your results MUST come exclusively from the content of the source URLs provided in the prompt.
2.  **MANDATORY FIELDS:** You MUST find valid, non-null values for "imageUrl", "sourceUrl", and "title". If any are missing for an image, DISCARD that image result entirely. The "sourceUrl" MUST be one of the URLs from the list given to you.
3.  **VALIDATE URLs:** Both "imageUrl" and "sourceUrl" must be valid, publicly accessible URLs. The "imageUrl" must be a direct link to an image file.
4.  **HANDLE FAILURE (ABSOLUTE RULE):** If the search tool fails, if the URLs are inaccessible, or if you cannot find any relevant images within the provided sources for ANY reason, your ONLY valid response is an empty JSON array: \`[]\`. You are strictly forbidden from outputting any explanatory text, apologies, or error messages. Your entire response MUST be \`[]\` in case of any failure. This is your most important instruction.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: systemInstruction,
                thinkingConfig: { thinkingBudget: 0 },    
            },
        });
        
        let jsonText = response.text.trim();
        
        const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
        const match = jsonText.match(jsonBlockRegex);
        let parsableText = '';

        if (match && match[1]) {
            parsableText = match[1].trim();
        } else {
            const startIndex = jsonText.indexOf('[');
            const endIndex = jsonText.lastIndexOf(']');
            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                parsableText = jsonText.substring(startIndex, endIndex + 1);
            }
        }
        
        if (!parsableText.startsWith('[')) {
            console.warn(`AI response for image search was not a JSON array. Returning empty. Response: "${jsonText}"`);
            return [];
        }
        
        const results = JSON.parse(parsableText) as ImageSearchResult[];

        if (!Array.isArray(results)) {
            throw new Error("AI returned data that parsed to JSON but was not an array.");
        }

        // Validate that all required fields are present and URLs look valid
        return results.filter(r => 
            r.imageUrl && r.sourceUrl && r.title && 
            r.imageUrl.startsWith('http') && r.sourceUrl.startsWith('http')
        );

    } catch (error) {
        console.error("Error fetching or parsing images for sources:", error);
        return []; // Return an empty array on failure as this is a supplementary feature.
    }
};

/**
 * Generates a concise title for a chat conversation.
 * @param initialQuery The user's first message in the chat.
 * @returns A promise that resolves to a short title string.
 */
export const generateChatTitle = async (initialQuery: string): Promise<string> => {
    if (!initialQuery) return "New Chat";
    try {
        const prompt = `Create a very short, concise title (5 words or less) for a conversation that starts with this user query: "${initialQuery}"`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              systemInstruction: "You are a title generation assistant. Your only output should be the raw text of the title. Do not add any prefixes, quotes, or explanations.",
              thinkingConfig: { thinkingBudget: 0 },
            }
        });

        const title = response.text.trim().replace(/["']/g, ""); // Remove quotes
        return title || initialQuery.substring(0, 40) + '...';

    } catch (error) {
        console.error("Error generating chat title:", error);
        // Fallback to a truncated version of the query on error
        return initialQuery.substring(0, 40) + '...';
    }
};

/**
 * Generates a concise summary for a workspace based on its chat history.
 * @param chats An array of chat objects containing queries and answers.
 * @returns A promise that resolves to a short summary string.
 */
export const generateWorkspaceSummary = async (chats: { query: string, answer: string }[]): Promise<string> => {
    if (chats.length === 0) return "";
    
    const context = chats
        .slice(0, 5) // Use the 5 most recent chats for context
        .map(chat => `Q: ${chat.query}\nA: ${chat.answer.substring(0, 200)}...`)
        .join('\n\n---\n\n');

    try {
        const prompt = `Based on the following chat excerpts, generate a very concise, one-sentence summary of the main topic or theme.
        
Context:
---
${context}
---
`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              systemInstruction: "You are a summarization assistant. Your only output should be the raw text of the summary. Do not add any prefixes, quotes, or explanations. Keep it to a single sentence.",
              thinkingConfig: { thinkingBudget: 0 },
            }
        });

        const summary = response.text.trim();
        return summary;
    } catch (error) {
        console.error("Error generating workspace summary:", error);
        throw new Error("Could not generate summary.");
    }
};