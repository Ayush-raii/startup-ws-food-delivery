import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// Helper delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, mimeType } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image base64 data is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Gemini API] GEMINI_API_KEY is not defined in environment variables.');
      return NextResponse.json(
        { error: 'Gemini API Key is missing. Please add GEMINI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    // Initialize the Google Gen AI SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the free tier of the Gemini API (gemini-2.5-flash)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Prepare image for Gemini API input
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType || 'image/jpeg',
      },
    };

    // System prompt explaining the required schema and categories
    const systemPrompt = `
      You are an expert menu scanning assistant. 
      Analyze the attached restaurant menu image and extract all items, categories, prices, and descriptions.
      
      You must strictly return a valid JSON object matching the following structure:
      {
        "restaurant_menu": [
          {
            "category": "Starters" | "Main Course" | "Desserts",
            "item_name": "String",
            "price": Number,
            "description": "String",
            "food_type": "Veg" | "Non-Veg" | "Unknown"
          }
        ]
      }

      Rules:
      1. Group items into one of these exact three categories: "Starters", "Main Course", "Desserts". Map physical menu categories logically:
         - Soups, salads, snacks, appetizers, beverages, drinks -> "Starters"
         - Main dishes, curries, breads, rices, platters -> "Main Course"
         - Sweets, ice creams, desserts, cakes -> "Desserts"
      2. Prices must be numbers only. Strip out all currency signs (like ₹, $, or /-). If no price is specified, default to 0.
      3. Food type must be strictly one of: "Veg", "Non-Veg", or "Unknown". Use visual cues (green dot, red dot, ingredient words like chicken, paneer, mutton, egg, fish, beef, pork, cottage cheese, vegetables, etc.) to deduce food type.
      4. If description is not present, generate a brief, tasty, appealing description (under 12 words) describing the item.
      5. Output ONLY the JSON block. Do not write any introduction, code blocks wrapping (unless standard markdown JSON), markdown formatting outside of the JSON block, or extra text.
    `;

    let attempt = 1;
    const maxAttempts = 5;
    let currentDelay = 1500; // Start with 1.5 seconds delay
    let resultText = '';

    while (attempt <= maxAttempts) {
      try {
        console.log(`[Gemini API] Processing menu image scan. Attempt ${attempt} of ${maxAttempts}...`);
        
        const response = await model.generateContent([
          systemPrompt,
          imagePart,
        ]);

        resultText = response.response.text();
        if (resultText) {
          break; // Successfully got response, exit loop
        }
      } catch (error: any) {
        const statusCode = error.status || 0;
        const errorMessage = error.message || '';
        
        // Check for 429 (Rate Limit / Too Many Requests) or 503 (Service Unavailable)
        const isRetryable =
          statusCode === 429 ||
          statusCode === 503 ||
          errorMessage.includes('429') ||
          errorMessage.includes('503') ||
          errorMessage.toLowerCase().includes('too many requests') ||
          errorMessage.toLowerCase().includes('service unavailable') ||
          errorMessage.toLowerCase().includes('resource exhausted');

        if (isRetryable && attempt < maxAttempts) {
          console.warn(
            `[Gemini API] Attempt ${attempt} failed with status ${statusCode} (Retryable). Retrying in ${currentDelay}ms. Error: ${errorMessage}`
          );
          await delay(currentDelay);
          attempt++;
          currentDelay *= 2; // Exponential Backoff
        } else {
          console.error(`[Gemini API] Attempt ${attempt} failed with non-retryable error or maximum attempts exhausted.`, error);
          throw error; // Fatal error or max retries exceeded
        }
      }
    }

    // Clean up Gemini output to find JSON block
    let cleanedJson = resultText.trim();
    
    // Check if wrapped in markdown code blocks: ```json ... ``` or ``` ... ```
    if (cleanedJson.startsWith('```')) {
      const match = cleanedJson.match(/```(?:json)?([\s\S]*?)```/);
      if (match && match[1]) {
        cleanedJson = match[1].trim();
      }
    }

    try {
      const parsedMenu = JSON.parse(cleanedJson);
      return NextResponse.json(parsedMenu);
    } catch (parseError) {
      console.error('[Gemini API] Failed to parse Gemini response as JSON. Raw response:', resultText);
      return NextResponse.json(
        { 
          error: 'Failed to parse AI output into structured format.', 
          rawOutput: resultText 
        }, 
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Upload Menu API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during menu scanning.' },
      { status: 500 }
    );
  }
}
