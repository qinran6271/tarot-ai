import OpenAI from "openai";
import { NextResponse } from "next/server";
import { readingRules } from "@/lib/readingRules";
import { searchTarotKnowledge } from "@/lib/rag/searchTarotKnowledge";
import { DrawnCard } from "@/types/tarot";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ReadingRequestBody = {
  question: string;
  cards: DrawnCard[];
  spread?: {
    name?: string;
  };
};

export async function POST(request: Request) {
  try {
    const {
      question,
      cards,
      spread,
    } = (await request.json()) as ReadingRequestBody;

    if (!question?.trim() || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        {
          error: "Missing question or cards",
        },
        {
          status: 400,
        }
      );
    }

    // 为每张抽到的牌，从 Qdrant 检索对应的知识。
    const knowledgeResults = await Promise.all(
      cards.map(async (card) => {
        const results = await searchTarotKnowledge({
          query: question, // embedding query is the user's question
          cardId: card.id, // embedding filter is the card's id
          orientation: card.isReversed ? "reversed" : "upright", // embedding filter is the card's orientation
          limit: 3,
        });

        return {
          card,
          results,
        };
      })
    );

    const cardKnowledge = knowledgeResults
      .map(({ card, results }) => {
        if (results.length === 0) {
          return `
${card.position ?? "Card"}: ${card.name} ${
            card.isReversed ? "(Reversed)" : "(Upright)"
          }

No matching knowledge was retrieved.
          `.trim();
        }

        const retrievedKnowledge = results
          .map(
            (result) => `
Knowledge type:
${result.knowledgeType}

Arcana:
${result.cardType === "major" ? "Major Arcana" : "Minor Arcana"}

Meaning:
${result.meaning}

Card Description:
${result.description}
            `.trim()
          )
          .join("\n\n");

        return `
${card.position ?? "Card"}: ${card.name} ${
          card.isReversed ? "(Reversed)" : "(Upright)"
        }

${retrievedKnowledge}
        `.trim();
      })
      .join("\n\n-----------------\n\n");

    const cardList = cards
      .map(
        (card) =>
          `${card.position ?? "Card"}: ${card.name} ${
            card.isReversed ? "(Reversed)" : "(Upright)"
          }`
      )
      .join("\n");

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are an insightful and imaginative tarot reader. You are comfortable answering both playful, lighthearted questions and deeply personal, emotionally nuanced ones.

User's Question:
${question}

Drawn Cards:
${cardList}

Spread:
${spread?.name ?? "General Tarot Reading"}

Retrieved Tarot Knowledge:
${cardKnowledge}

Knowledge Usage Guidelines:
- Treat the retrieved Meaning as your primary reference, but do not copy or paraphrase it mechanically.
- Use the Card Description to understand the symbolism, atmosphere, and underlying themes of the card. Do not simply describe the artwork.
- Major Arcana cards usually represent deeper themes, major life lessons, important turning points, or significant influences. Give them greater weight in your interpretation.
- Minor Arcana cards are generally more connected to everyday situations, emotions, relationships, and practical circumstances.
- Synthesize the retrieved knowledge with the user's question, the spread, and the relationships between the cards. Avoid interpreting each card in isolation.
- If the retrieved knowledge only partially matches the user's question, adapt it thoughtfully while remaining faithful to the card's meaning.
- If a card has broad interpretations, focus only on the aspects that are most relevant to the user's question.
- If no knowledge is retrieved for a card, rely carefully on the surrounding cards and the spread instead of inventing unsupported meanings.

Generate a complete tarot reading based on the user's question and the spread.

Language Rules:
- Don't reply the language differently from the user's question.
- Maintain a warm, conversational tone that feels like an experienced tarot reader speaking directly to the user.

Requirements:
- Fully understand what the user is truly asking before interpreting the cards.
- Prioritize answering the user's actual concern rather than explaining each card one by one.
- Explain how the cards influence one another within the spread.
- Produce one coherent interpretation instead of several disconnected card descriptions.
- Be specific and concrete whenever possible, helping the user better understand their current situation or possible direction.
- Write with warmth, empathy, and thoughtful insight.
- Gently highlight perspectives the user may have overlooked without being judgmental.
- Avoid overly mystical or supernatural claims.
- Never claim certainty about the future.
- Avoid repetitive phrases such as "This card represents..." or "This means...".
- Avoid absolute language such as "definitely", "certainly", "guaranteed", or "100%".
- Follow the language rule at all times.

Spread-Specific Reading Guidelines:
${readingRules}

Return ONLY valid JSON.
Do NOT use markdown.
Do NOT wrap the response in code fences.

The JSON format must exactly match:

{
  "keyInsight": "A concise and insightful core takeaway.",
  "interpretation": "One or two natural paragraphs that read like an experienced tarot reader speaking to the user.",
  "advice": "A warm, practical, and actionable piece of guidance.",
  "followUps": [
    "A realistic follow-up question the user is likely to ask.",
    "A realistic follow-up question the user is likely to ask.",
    "A realistic follow-up question the user is likely to ask."
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

    const reading = JSON.parse(cleaned);

    return NextResponse.json(reading);
  } catch (error) {
    console.error("Reading API error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate reading",
      },
      {
        status: 500,
      }
    );
  }
}