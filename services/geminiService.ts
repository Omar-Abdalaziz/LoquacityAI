import { GoogleGenAI, Chat, Part, Type } from "@google/genai";
import { FinalAnswer, Source, Citation, Personalization, NewsArticle, FinanceData } from '../types';

// Initialize the Gemini AI client
// IMPORTANT: Assumes process.env.API_KEY is set in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const baseSystemInstruction = `You are Loquacity AI, an expert search and programming assistant. Your output format is critical. Follow these rules for every response.

**--- OUTPUT FORMAT RULES (MANDATORY) ---**

**1. CONCISENESS & STRUCTURE:**
- Be direct, concise, and to the point.
- Use Markdown for structure (headings, lists) to make information easy to read.
- Avoid unnecessary preamble or filler content to provide answers as quickly as possible.

**2. CITATION (CRITICAL):**
- When you use information from the provided search results, you **MUST** cite it.
- Place a citation marker at the end of the sentence or clause containing the information. Your credibility depends on proper and frequent citation.

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

**1. STRUCTURE & CITATION (CRITICAL):**
- Your response must be well-organized, using clear headings, subheadings, and lists to structure the information.
- When you use information from the provided search results, you **MUST** cite it.
- Place a citation marker at the end of the sentence or clause containing the information. Your credibility depends on proper and frequent citation.
- The tone should be formal and academic.

**2. CODE (HIGHEST PRIORITY):**
- Any programming code, from a single line to a full script, MUST be inside a Markdown code block.
- Start the block with \`\`\` followed by the language name (e.g., \`\`\`javascript).
- End the block with \`\`\`.
- **NEVER** write code as plain text outside of a code block.

**3. COMPARISON TABLE:**
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

**4. GENERAL TEXT:**
- Analyze the query deeply and provide a thorough explanation.
- Always cite your sources from the provided search results, following Rule #1.

**--- OTHER RULES ---**
- **Identity:** When asked about your identity, you MUST identify yourself as 'Loquacity AI'.
- **File Analysis:** When a file is provided, your primary task is to analyze it academically. Base your response on the file's content, guided by the user's text query. If the query is vague, provide a deep, structured analysis of the file.`;

const deepResearchChatSystemInstruction = deepResearchSystemInstruction + `
- For follow-up questions, keep answers structured and academic, but concise and directly related to the user's query, using the conversation history for context.`;

const buildSystemInstruction = (baseInstruction: string, personalization?: Personalization) => {
    let instruction = baseInstruction;
    if (personalization && (personalization.introduction || personalization.location)) {
        instruction += '\\n\\n--- User Personalization Context ---';
        if (personalization.introduction) {
            instruction += `\\nThe user has provided this introduction about themselves: "${personalization.introduction}"`;
        }
        if (personalization.location) {
            instruction += `\\nThe user's location is: "${personalization.location}". Use this for location-specific queries unless the user specifies a different location in their prompt.`;
        }
        instruction += '\\n------------------------------------';
    }
    return instruction;
};

/**
 * Performs a smart search using the Gemini API with Google Search grounding.
 * @param query The user's search query.
 * @param file Optional file data for multimodal queries.
 * @param isDeepResearch Flag to enable academic, structured responses.
 * @param personalization Optional user personalization settings.
 * @returns A promise that resolves to the final answer and sources.
 * @throws An error with a user-friendly message if the search fails.
 */
export const performSmartSearch = async (
    query: string, 
    file?: { mimeType: string, data: string }, 
    isDeepResearch?: boolean,
    personalization?: Personalization
): Promise<Omit<FinalAnswer, 'table'>> => {
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: contentParts }],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster responses
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const citations = (response.candidates?.[0]?.citationMetadata?.citations || []) as Citation[];

    const sources: Source[] = groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web?.uri && web?.title) // Filter out malformed or empty chunks
      .map((web: any) => ({
        title: web.title,
        uri: web.uri,
      })) || [];

    // Deduplicate sources based on URI
    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());
    
    // The API can return an empty text response, e.g., due to safety filters. Handle this gracefully.
    if (!response.text && uniqueSources.length === 0) {
        throw new Error("The AI returned an empty response. This might be due to a content safety filter or a temporary issue. Please try a different query.");
    }
    
    return {
      text: response.text || "", // Ensure text is at least an empty string
      sources: uniqueSources,
      citations,
    };

  } catch (error) {
    console.error("Error performing smart search:", error);

    let userFriendlyMessage = "An unexpected error occurred while communicating with the AI. Please try again.";

    if (error instanceof Error && error.message) {
      // The Gemini SDK often stringifies a JSON error object into the message property.
      // We try to parse it to get a more specific, user-friendly message.
      try {
        const errorDetails = JSON.parse(error.message);
        if (errorDetails?.error?.status === 'RESOURCE_EXHAUSTED') {
          userFriendlyMessage = "API quota exceeded. You've made too many requests recently. Please wait a moment or check your plan and billing details.";
        } else if (errorDetails?.error?.message) {
          userFriendlyMessage = errorDetails.error.message;
        } else {
            // The original message is the best we have if we can't find a specific one after parsing.
            userFriendlyMessage = error.message;
        }
      } catch (parseError) {
        // If parsing fails, the error message is not JSON. It's likely a regular error string.
        userFriendlyMessage = error.message;
      }
    }

    // Always throw a new Error with a clean, user-friendly message.
    throw new Error(userFriendlyMessage);
  }
};


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
      thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster responses
    },
  });
  return chat;
};

/**
 * Fetches the latest news for a given category using Gemini with Google Search.
 * @param category The news category (e.g., 'Top Stories', 'Middle East', 'Egypt').
 * @returns A promise that resolves to an array of news articles.
 * @throws An error if the news fetching fails.
 */
export const fetchNews = async (category: 'Top Stories' | 'Middle East' | 'Egypt'): Promise<NewsArticle[]> => {
  let prompt = '';
  switch (category) {
    case 'Middle East':
      prompt = "Based *only* on the provided search results, get the top 8 trending news headlines from the Middle East from the last 24 hours.";
      break;
    case 'Egypt':
      prompt = "Based *only* on the provided search results, get the top 8 trending news headlines from Egypt from the last 24 hours.";
      break;
    case 'Top Stories':
    default:
      prompt = "Based *only* on the provided search results, get the top 8 global trending news headlines from the last 24 hours.";
      break;
  }
  
  prompt += ` The articles should cover various topics like politics, technology, and finance. For each article, provide the following data. The 'url' MUST be the final, resolved, publicly-accessible URL to the full article, not an internal Google redirect link or a generic homepage. You are strictly forbidden from inventing articles or using future dates.`;

  const newsSystemInstruction = `You are a news aggregation bot. Your sole purpose is to return a valid, raw JSON array of news articles. The entire response body MUST be ONLY the JSON array, starting with '[' and ending with ']'. Do not include any other text, markdown, or explanations.
Each object in the array MUST represent a news article and STRICTLY follow this JSON structure:
{
  "title": "The full, original headline of the article",
  "summary": "A concise one-sentence summary of the article's content.",
  "url": "https://example.com/news/article-url",
  "imageUrl": "https://example.com/image.jpg",
  "source": "The name of the news publication (e.g., Reuters, Associated Press)",
  "publishedAt": "2024-01-01T12:00:00Z"
}

**CRITICAL RULES:**
1.  **ALL KEYS ARE REQUIRED:** Every object in the array MUST contain all six keys specified above.
2.  **MANDATORY FIELDS:** The fields "title", "url", "source", and "publishedAt" are MANDATORY. You MUST find a valid, non-null value for each of these fields for an article to be included.
3.  **OPTIONAL FIELDS:** For "summary" and "imageUrl", if a value is not available, you MUST include the key with a value of \`null\`. DO NOT omit the key.
4.  **SELF-CENSORSHIP:** If you cannot find a valid value for any of the MANDATORY fields ("title", "url", "source", "publishedAt") for a given article from your search results, you MUST DISCARD that article entirely. Do not include incomplete articles in the final JSON array.
5.  **NO EXTRA KEYS:** Do not add any fields not listed in the example structure.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: newsSystemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    
    let jsonText = response.text.trim();
    
    // Enhanced JSON extraction to handle markdown code blocks.
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = jsonText.match(jsonBlockRegex);
    if (match && match[1]) {
      jsonText = match[1].trim();
    }
    
    const startIndex = jsonText.indexOf('[');
    const endIndex = jsonText.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        console.warn("Raw AI response for news was not a JSON array:", response.text);
        throw new Error("AI response did not contain a valid JSON array.");
    }
    
    jsonText = jsonText.substring(startIndex, endIndex + 1);
    
    let rawArticles;
    try {
        rawArticles = JSON.parse(jsonText) as any[];
    } catch (parseError) {
        console.error("Failed to parse JSON from AI response.", {
            rawResponse: response.text,
            extractedText: jsonText,
            error: parseError
        });
        if (parseError instanceof Error) {
            throw new Error(`The AI returned data that could not be read. Please try refreshing. (Details: ${parseError.message})`);
        }
        throw new Error("The AI returned data that could not be read. Please try refreshing.");
    }

    if (!Array.isArray(rawArticles)) {
      throw new Error("AI returned data in an unexpected format (not an array).");
    }

    const mappedArticles: NewsArticle[] = rawArticles.map(raw => ({
        title: raw.title,
        summary: raw.summary ?? null,
        url: raw.url,
        imageUrl: raw.imageUrl ?? null,
        source: raw.source,
        publishedAt: raw.publishedAt
    }));
    
    const validArticles = mappedArticles.filter(a => {
        // Basic validation for required fields
        if (!a.title || !a.url || !a.source || !a.publishedAt) {
            return false;
        }

        // Filter out internal redirect URLs that can cause issues
        if (a.url.includes('vertexaisearch.cloud.google.com')) {
            return false;
        }

        try {
            const articleDate = new Date(a.publishedAt);
            // Check if the date is valid and not in the future
            if (isNaN(articleDate.getTime())) {
                return false; // Invalid date format
            }
            return articleDate <= new Date();
        } catch (e) {
            return false; // Error during date parsing, consider it invalid
        }
    });

    if (rawArticles.length > 0 && validArticles.length === 0) {
      console.warn("All articles were filtered out after mapping due to missing essential properties, invalid URLs, or invalid dates.", rawArticles);
      // We no longer throw an error here. Instead, we return an empty array,
      // allowing the UI to gracefully handle the "No articles found" state.
    }

    if (validArticles.length < rawArticles.length) {
      console.warn("Some articles were filtered due to missing properties, invalid URLs, or invalid dates.");
    }
    
    return validArticles;

  } catch (error) {
    console.error(`Error fetching news for category "${category}":`, error);
     if (error instanceof Error) {
       // Re-throw our specific, user-friendly errors
       if (error.message.includes("JSON") || error.message.includes("filtered") || error.message.includes("unexpected format") || error.message.includes("could not be read")) {
           throw error;
       }
    }
    // Generic fallback
    throw new Error("Failed to fetch news. The AI response may have been blocked or empty.");
  }
};

/**
 * Fetches comprehensive financial data including market indices, top movers, news, and analysis.
 * @returns A promise that resolves to a structured FinanceData object.
 * @throws An error if fetching or parsing the data fails.
 */
export const fetchFinanceData = async (): Promise<FinanceData> => {
  const prompt = `Provide a comprehensive overview of the current U.S. stock market. I need data for major indices (S&P 500, Nasdaq, Dow Jones), top 5 movers (gainers and losers), a brief market analysis (2-3 sentences), and 4 recent financial news articles. Use your search tool to find the most up-to-date information available today. The response MUST be a single JSON object. Do not include any text outside of the JSON object. For changes, prefix with '+' for positive and '-' for negative.`;
  
  const financeSystemInstruction = `You are a financial data aggregation bot. Your sole purpose is to return a valid, raw JSON object based on the user's request. The entire response body MUST be ONLY the JSON object, starting with '{' and ending with '}'. Do not include any other text, markdown, or explanations. Populate every field. If data for a specific field (like top movers) cannot be found, return an empty array for it. The JSON structure should be: { marketIndices: [], topMovers: { gainers: [], losers: [] }, marketAnalysis: "", financialNews: [] }.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: financeSystemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
        // responseMimeType and responseSchema are not supported with tools.
        // The system instruction will guide the model to return JSON.
      },
    });

    let jsonText = response.text.trim();

    // The model may wrap the JSON in a markdown code block. This extracts it.
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = jsonText.match(jsonBlockRegex);
    if (match && match[1]) {
      jsonText = match[1].trim();
    }

    // Find the start and end of the JSON object, as there might be leading/trailing text.
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        console.warn("Raw AI response for finance was not a JSON object:", response.text);
        throw new Error("AI response did not contain a valid JSON object.");
    }
    
    jsonText = jsonText.substring(startIndex, endIndex + 1);

    let data;
    try {
        data = JSON.parse(jsonText) as FinanceData;
    } catch (parseError) {
        console.error("Failed to parse JSON from finance AI response.", {
            rawResponse: response.text,
            extractedText: jsonText,
            error: parseError
        });
        if (parseError instanceof Error) {
            throw new Error(`The AI returned financial data that could not be read. Please try refreshing. (Details: ${parseError.message})`);
        }
        throw new Error("The AI returned financial data that could not be read. Please try refreshing.");
    }
    

    // Basic validation
    if (!data || !data.marketIndices || !data.topMovers || !data.financialNews) {
      throw new Error("AI returned incomplete financial data structure.");
    }
    
    return data;

  } catch (error) {
    console.error("Error fetching financial data:", error);
    if (error instanceof Error) {
       // Re-throw our specific, user-friendly errors
       if (error.message.includes("JSON") || error.message.includes("could not be read") || error.message.includes("incomplete")) {
           throw error;
       }
    }
    // Generic fallback
    throw new Error("Failed to fetch financial data. The AI response may have been blocked or empty.");
  }
};


/**
 * Fetches the full content of an article from a URL.
 * @param articleUrl The URL of the article to fetch.
 * @returns A promise that resolves to the article's content in Markdown format.
 * @throws An error if the article content cannot be fetched.
 */
export const fetchArticleContent = async (articleUrl: string): Promise<string> => {
    try {
      const prompt = `Extract the full article text from this URL: ${articleUrl}`;
      const systemInstruction = `You are an advanced automated web page text extractor. Your sole task is to visit the provided URL and return the full text content of the main article on that page, formatted as Markdown.

**--- CRITICAL RULES ---**
1.  **PRIORITY ONE: EXTRACTION.** Your primary goal is to extract the article text. The entire response body MUST be ONLY the article's content in Markdown format.
2.  **ABSOLUTELY NO META-COMMENTARY.** Do NOT write any introduction, explanation, or apology (e.g., "I'm sorry, I cannot access this..."). Do not mention your capabilities, "AI", "Gemini", or "grounding". If you cannot extract the text for any reason, you MUST follow the fallback instructions below.
3.  **HANDLE REDIRECTS.** The URL may be a redirect. You MUST follow it to the final destination page and extract the text from there. **This includes internal \`google.com\` or \`vertexaisearch.cloud.google.com\` redirect URLs.** You are required to resolve them and fetch content from the final URL.
4.  **HANDLE NON-ARTICLE PAGES.** If the URL leads to a homepage or a section front, identify the single most prominent, featured news story on that page and extract its full text.

**--- FALLBACK PROCEDURE (MANDATORY IF EXTRACTION FAILS) ---**
If you encounter a paywall, a login requirement, a content-blocking script, a 404 error, or any other issue that prevents direct extraction of the text from the URL (including failure to resolve a redirect):
1.  **DO NOT APOLOGIZE OR EXPLAIN THE FAILURE.**
2.  Immediately use your search tool to find the content of the article from publicly available sources or caches on the web, using the URL and its title as search terms.
3.  Return the content you find from the search results, formatted as Markdown.
4.  If after searching you still cannot find the content, return a single JSON object with an error message: \`{"error": "Content is unavailable or behind a paywall."}\`. This JSON object must be the only thing in your response.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: systemInstruction,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const responseText = response.text?.trim() || "";

      if (!responseText) {
        throw new Error("The AI returned an empty response for the article content.");
      }

      // Check for the structured error JSON as a fallback
      try {
        const parsedResponse = JSON.parse(responseText);
        if (parsedResponse && parsedResponse.error && typeof parsedResponse.error === 'string') {
            throw new Error(parsedResponse.error);
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes("paywall")) {
          // Re-throw the specific error from the parsed JSON
          throw e;
        }
        // Otherwise, it's not a JSON error, so proceed. This is the expected success path.
      }
      
      // Check for common refusal or meta-explanation patterns, as a final safety net.
      const metaExplanationKeywords = ["generative ai", "grounding", "i cannot", "i am sorry", "i'm sorry"];
      if (metaExplanationKeywords.some(keyword => responseText.toLowerCase().includes(keyword))) {
          console.warn("AI returned a meta-explanation instead of article content:", responseText);
          throw new Error("The AI failed to extract the article and returned a meta-explanation instead.");
      }

      return responseText;

    } catch (error) {
      console.error(`Error fetching article content for URL "${articleUrl}":`, error);
      if (error instanceof Error) {
          // Re-throw specific errors to be caught by the UI
          if (error.message.includes("meta-explanation") || error.message.includes("paywall")) {
              throw error;
          }
          throw new Error(`Failed to fetch article content. ${error.message}`);
      }
      throw new Error("An unknown error occurred while fetching the article content.");
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
 * Generates images from a text prompt using the Imagen model.
 * @param prompt The text prompt describing the desired image.
 * @param numberOfImages The number of images to generate.
 * @param aspectRatio The desired aspect ratio for the images.
 * @returns A promise that resolves to an array of base64 encoded image strings.
 */
export const generateImages = async (
    prompt: string,
    numberOfImages: number,
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
): Promise<string[]> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: numberOfImages,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });
        
        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("The AI did not return any images. This might be due to a content safety filter.");
        }

        return response.generatedImages.map(img => img.image.imageBytes);

    } catch (error) {
        console.error("Error generating images:", error);
        if (error instanceof Error && error.message.includes("SAFETY")) {
             throw new Error("Your prompt was blocked by the safety filter. Please modify your prompt and try again.");
        }
        throw new Error("An unexpected error occurred while generating images.");
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