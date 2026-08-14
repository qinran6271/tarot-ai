import OpenAI from "openai";
import { NextResponse } from "next/server";
import { readingRules } from "@/lib/readingRules";
import {
  getReadingLanguageInstruction,
  type ReadingLanguagePreference,
} from "@/lib/readingLanguage";
import { searchTarotKnowledge } from "@/lib/rag/searchTarotKnowledge";
import { detectReadingTopic } from "@/lib/rag/readingTopic";
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
  readingLanguage?: ReadingLanguagePreference;
};

export async function POST(request: Request) {
  try {
    const {
      question,
      cards,
      spread,
      readingLanguage = "en",
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

    const readingTopic = detectReadingTopic(question);

    // 为每张抽到的牌，从 Qdrant 检索并按问题主题重排知识。
    const knowledgeResults = await Promise.all(
      cards.map(async (card) => {
        const results = await searchTarotKnowledge({
          query: question, // embedding query is the user's question
          cardId: card.id, // embedding filter is the card's id
          // Direction-specific knowledge and neutral knowledge are both eligible.
          orientation: card.isReversed ? "reversed" : "upright",
          readingTopic,
          limit: 6,
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
          .map((result) => {
            const sections = [
              `Knowledge type:\n${result.knowledgeType}`,
              result.topic ? `Topic:\n${result.topic}` : "",
              `Orientation:\n${result.orientation}`,
              `Arcana:\n${
                result.cardType === "major"
                  ? "Major Arcana"
                  : "Minor Arcana"
              }`,
              `Meaning:\n${result.meaning}`,
              result.description
                ? `Card Description:\n${result.description}`
                : "",
            ];

            return sections.filter(Boolean).join("\n\n");
          })
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

    const languageInstruction = getReadingLanguageInstruction(
      question,
      readingLanguage,
    );

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are an insightful and imaginative tarot reader. You are comfortable answering both playful, lighthearted questions and deeply personal, emotionally nuanced ones.

User's Question:
${question}

Detected Question Topic:
${readingTopic}

Drawn Cards:
${cardList}

Spread:
${spread?.name ?? "General Tarot Reading"}

Retrieved Tarot Knowledge:
${cardKnowledge}

Knowledge Usage Guidelines:
- Treat the retrieved Meaning as your primary reference, but do not copy or paraphrase it mechanically.
- Use Topic to identify the intended context of specialized knowledge, such as career, relationship, or personal growth.
- Knowledge with orientation "neutral" describes symbolism or background that applies to both upright and reversed cards. Do not treat it as a separate card direction.
- "traditional_meaning" provides a broad traditional foundation. More specific knowledge types provide contextual interpretation; combine them when relevant instead of treating them as contradictory.
- Use the Card Description to understand the symbolism, atmosphere, and underlying themes of the card. Do not simply describe the artwork.
- Major Arcana cards usually represent deeper themes, major life lessons, important turning points, or significant influences. Give them greater weight in your interpretation.
- Minor Arcana cards are generally more connected to everyday situations, emotions, relationships, and practical circumstances.
- Synthesize the retrieved knowledge with the user's question, the spread, and the relationships between the cards. Avoid interpreting each card in isolation.
- If the retrieved knowledge only partially matches the user's question, adapt it thoughtfully while remaining faithful to the card's meaning.
- If a card has broad interpretations, focus only on the aspects that are most relevant to the user's question.
- If no knowledge is retrieved for a card, rely carefully on the surrounding cards and the spread instead of inventing unsupported meanings.

Generate a complete tarot reading based on the user's question and the spread.

Language Rules:
- ${languageInstruction}
- The language is fixed for the entire response, including follow-up questions.
- Maintain a warm, conversational tone that feels like an experienced tarot reader speaking directly to the user.

Requirements:
- Fully understand what the user is truly asking before interpreting the cards.
- Prioritize answering the user's actual concern rather than explaining each card one by one.
- Explain how the cards influence one another within the spread.
- Produce one coherent interpretation instead of several disconnected card descriptions.
- Commit to the strongest interpretation supported by the cards. If several readings are possible, identify the most likely one first instead of listing possibilities with equal weight.
- Name the central tension, contradiction, avoidance pattern, or uncomfortable truth directly when the cards support it. Be compassionate, but do not soften the reading until it becomes vague.
- Show a clear causal thread across the spread: what created the situation, what is maintaining it, and what direction or choice the cards point toward.
- Distinguish uncertainty about the future from uncertainty about the present pattern. You may speak clearly about a pattern shown by the cards without pretending its future outcome is guaranteed.
- Be specific and concrete whenever possible, helping the user better understand their current situation or possible direction.
- Write with warmth, empathy, and thoughtful insight.
- Gently highlight perspectives the user may have overlooked without being judgmental.
- Avoid overly mystical or supernatural claims.
- Never claim certainty about the future.
- Avoid repetitive phrases such as "This card represents..." or "This means...".
- Do not repeat the same conclusion in Key Insight, Interpretation, and Advice. Each section must do a different job.
- Avoid stacking hedging words such as "maybe", "perhaps", "might", "may", or "could" in every sentence. Use uncertainty language only where it is genuinely needed.
- Avoid generic advice such as "take some time", "communicate openly", or "trust yourself" unless you explain exactly what to examine, say, ask, stop, or do next.
- Avoid absolute language such as "definitely", "certainly", "guaranteed", or "100%".
- Follow the language rules at all times.

Concrete Answer Rules:
- Answer the user's practical question directly before explaining the cards. Do not make the user extract the answer from a long card-by-card discussion.
- When the user asks for a choice, recommendation, idea, or next step, provide 2–4 concrete and realistic examples they could choose or act on.
- First synthesize the spread into one practical criterion, then derive examples from that shared direction. Do not translate every symbol into a separate literal recommendation.
- Make examples appropriately specific: name actions, options, phrases, boundaries, or decision criteria rather than only abstract qualities.
- Include one clear direction to avoid when the spread supports it.
- Examples must illustrate the reading, not introduce unsupported facts. Do not invent the user's health needs, allergies, diagnosis, budget, location, relationship history, or other personal circumstances.
- Do not present tarot-derived examples as medical, legal, financial, weather, or other factual expertise.

Section Responsibilities:
- Key Insight: Make one sharp, memorable judgment about the heart of the situation. Do not summarize every card.
- Interpretation: Build the reasoning from the interaction between the cards. Identify the dominant pattern and explain what the user may not yet be admitting, seeing, or confronting.
- Advice: Convert the interpretation into concrete action, a decision criterion, a boundary, or a specific conversation. For practical recommendation questions, give 2–4 examples and one direction to avoid. Do not merely restate the interpretation.
- Follow Ups: Ask questions that move the reading into unresolved specifics, not generic invitations to continue.

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
