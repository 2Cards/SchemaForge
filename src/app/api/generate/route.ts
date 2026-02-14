import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nDescription: ${prompt}` }]
        }]
      })
    });

    const data = await response.json();
    const dbml = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!dbml) {
      throw new Error('Failed to generate schema');
    }

    return NextResponse.json({ dbml });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
