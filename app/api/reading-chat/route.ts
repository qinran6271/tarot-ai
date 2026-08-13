import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  getReadingLanguageInstruction,
  type ReadingLanguagePreference,
} from "@/lib/readingLanguage";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const {
      reading,
      message,
      clarification,
      disableClarificationSuggestion = false,
      readingLanguage = "en",
    } = await request.json();

    if (!reading || (!message && !clarification)) {
    return NextResponse.json(
        { error: "Missing reading, message, or clarification" },
        { status: 400 }
    );
    }

    if (
    clarification &&
    (!clarification.question || !clarification.card)
    ) {
    return NextResponse.json(
        { error: "Missing clarification question or card" },
        { status: 400 }
    );
    }

    const cardList = reading.cards
      .map(
        (card: {
          name: string;
          isReversed?: boolean;
          position?: string;
        }) =>
          `${card.position ?? "Card"}: ${card.name}${
            card.isReversed ? " (Reversed)" : " (Upright)"
          }`
      )
      .join("\n");

    const conversationText =
      reading.conversation?.length > 0
        ? reading.conversation
            .map(
              (msg: {
                role: "user" | "assistant";
                content: string;
              }) => `${msg.role}: ${msg.content}`
            )
            .join("\n\n")
        : "No previous conversation.";

    // The original focus establishes the language for the whole reading. This
    // prevents short follow-ups such as "OK" from causing language drift.
    const languageInstruction = getReadingLanguageInstruction(
      reading.focus,
      readingLanguage as ReadingLanguagePreference,
    );

if (clarification) {
  const clarificationResponse = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `
You are a warm, intuitive tarot reader.

The user has drawn one clarification card during an existing tarot reading.

Original focus:
${reading.focus}

Spread:
${reading.spread.name}

Cards currently in the reading:
${cardList}

Previous conversation:
${conversationText}

Clarification question:
${clarification.question}

Clarification card:
${clarification.card.name} ${
      clarification.card.isReversed
        ? "(Reversed)"
        : "(Upright)"
    }

Instructions:
- ${languageInstruction}
- Keep this language for every user-facing JSON field.
- Explain how this specific card answers the clarification question.
- Stay grounded in the original reading and previous conversation.
- Focus mainly on the clarification card.
- Connect it to the original cards only when useful.
- Do not repeat the full original reading.
- Do not recommend another clarification card.
- Do not pretend another card has been drawn.
- Be warm, specific, thoughtful, and conversational.
- Avoid absolute or guaranteed predictions.
- Keep the interpretation concise, around 1 to 3 paragraphs.
- Generate 3 natural follow-up questions.
- Follow-up questions must use the fixed reading language.

Return only valid JSON.
Do not use markdown.
Do not wrap the response in code fences.

Format:
{
  "message": "the clarification card interpretation",
  "followUps": [
    "a natural follow-up question",
    "a natural follow-up question",
    "a natural follow-up question"
  ],
  "shouldDrawClarificationCard": false,
  "clarificationReason": "",
  "clarificationQuestion": ""
}
    `,
  });

  const clarificationText =
    clarificationResponse.output_text.trim();

  const clarificationCleaned = clarificationText
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/, "")
    .trim();

  const clarificationData = JSON.parse(
    clarificationCleaned
  );

  return NextResponse.json(clarificationData);
}  

const clarificationRule = disableClarificationSuggestion
  ? `
A clarification card has already been drawn for this request.

You must return:
- "shouldDrawClarificationCard": false
- "clarificationReason": ""
- "clarificationQuestion": ""
`
  : `
Decide whether one additional clarification card would meaningfully help
answer the user's latest question.

You must recommend a clarification card when:
- the user directly asks to draw another card, a clarification card, or an extra card;
- the user asks what they are missing, what is hidden, what the main obstacle is,
  what the next step should be, or what additional detail needs clarification;
- the latest question introduces a new focused uncertainty that the existing cards
  do not clearly answer;
- one focused card would provide a more specific and useful answer.

You may recommend a clarification card when:
- the existing reading gives a broad answer, but not enough detail for the user's
  latest question;
- the user asks for a clearer direction, action, obstacle, intention, or likely development.

Do not recommend a clarification card when:
- the existing cards already answer the latest question clearly and specifically;
- the user only asks for an explanation of an existing card;
- the user gives a short acknowledgment, thanks, or casual response;
- the question is unrelated to the reading;
- another card would not add meaningful information.

When the user directly asks to draw a clarification card, do not question whether
they need one. Set "shouldDrawClarificationCard" to true and create one focused
clarificationQuestion based on the current reading and their latest request.

Do not recommend another card on every turn, but do not be overly conservative.
`;

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
- ${languageInstruction}
- Keep this language even when the latest message is short or written in another language.
- Stay grounded in the original cards and previous conversation.
- Do not draw a new card yourself.
- Do not pretend that a new card has already been drawn.
- Do not repeat the full original reading.
- Answer the user's current follow-up directly.
- Be warm, specific, and thoughtful.
- Do not be overly certain about future events.
- Avoid absolute predictions such as "definitely", "100%", or "fated".
- Generate 3 follow-up questions that naturally continue from the latest answer.
- The follow-up questions must use the fixed reading language.

Clarification card rules:
${clarificationRule}

When recommending a clarification card:
- clarificationReason should briefly explain what remains unclear.
- clarificationQuestion should be one focused question for the new card.
- clarificationQuestion must use the fixed reading language.

When not recommending a clarification card:
- clarificationReason must be an empty string.
- clarificationQuestion must be an empty string.

Return only valid JSON.
Do not use markdown.
Do not wrap the response in code fences.

Format:
{
  "message": "your answer to the user's follow-up",
  "followUps": [
    "a natural follow-up question",
    "a natural follow-up question",
    "a natural follow-up question"
  ],
  "shouldDrawClarificationCard": false,
  "clarificationReason": "",
  "clarificationQuestion": ""
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
