import { NextResponse } from 'next/server';

// Simple in-memory rate limiting for prototype
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1000; // 1 request per second

export async function POST(req: Request) {
  try {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < MIN_INTERVAL_MS) {
      return NextResponse.json({ 
        error: 'Too many requests. Please wait a second between generations.' 
      }, { status: 429 });
    }

    lastRequestTime = now;
    const { prompt } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const systemPrompt = `
      You are a database architect. Convert the following description into a valid DBML (Database Markup Language) schema.
      Return ONLY the DBML code, no explanations, no markdown blocks.
      Focus on PostgreSQL compatibility.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nDescription: ${prompt}` }]
        }],
        generationConfig: {
          temperature: 0.1,
          response_mime_type: "text/plain",
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({
        error: `Gemini API Error: ${response.statusText}`,
        details: errorData
      }, { status: response.status });
    }

    const data = await response.json();
    const dbml = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!dbml) {
      throw new Error('Failed to generate schema: Empty response from AI');
    }

    return NextResponse.json({ dbml });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
