import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { reading, message } = await request.json();

    if (!reading || !message) {
      return NextResponse.json(
        { error: "Missing reading or message" },
        { status: 400 }
      );
    }

    const cardList = reading.cards
      .map(
        (card: { name: string; isReversed?: boolean }) =>
          `${card.name}${card.isReversed ? " (Reversed)" : " (Upright)"}`
      )
      .join(", ");

    const conversationText = reading.conversation
      .map(
        (msg: { role: "user" | "assistant"; content: string }) =>
          `${msg.role}: ${msg.content}`
      )
      .join("\n\n");

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are a warm, intuitive tarot reader.

The user is continuing an existing tarot reading.

Original focus:
${reading.focus}

Spread:
${reading.spread.name}

Cards:
${cardList}

Previous conversation:
${conversationText}

User follow-up question:
${message}

Rules:
- Answer in the same language as the user's follow-up question.
- Stay grounded in the original cards.
- Do not draw new cards.
- Do not repeat the full original reading.
- Answer the user's current follow-up directly.
- Be warm, specific, and thoughtful.
- Do not be overly certain about future events.
- Avoid absolute predictions like "definitely", "100%", or "fated".
- After answering, generate 3 new follow-up questions that naturally continue from this latest answer.
- The follow-up questions should use the same language as the user's follow-up question.

Return only valid JSON. Do not use markdown. Do not wrap in code fences.

Format:
{
  "message": "your answer to the user's follow-up",
  "followUps": [
    "a natural follow-up question",
    "a natural follow-up question",
    "a natural follow-up question"
  ]
}
      `,
    });

    const text = response.output_text.trim();

    const cleaned = text
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/, "")
      .trim();

    const data = JSON.parse(cleaned);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Reading chat API error:", error);

    return NextResponse.json(
      { error: "Failed to generate follow-up response." },
      { status: 500 }
    );
  }
}