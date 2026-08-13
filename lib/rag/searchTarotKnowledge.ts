import OpenAI from "openai";
import { QdrantClient } from "@qdrant/js-client-rest";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

if (!QDRANT_URL || !QDRANT_API_KEY) {
  throw new Error("Missing QDRANT_URL or QDRANT_API_KEY");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const qdrant = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

const COLLECTION_NAME = "tarot_knowledge";
const EMBEDDING_MODEL = "text-embedding-3-small";

export type Orientation = "upright" | "reversed";

type SearchTarotKnowledgeParams = {
  query: string;
  cardId: string;
  orientation: Orientation;
  limit?: number;
};

export type TarotKnowledgeResult = {
  score: number;
  cardId: string;
  sourceId: string;
  cardName: string;
  cardType: string;
  knowledgeType: string;
  topic: string;
  orientation: string;
  meaning: string;
  description: string;
  content: string;
};

export async function searchTarotKnowledge({
  query,
  cardId,
  orientation,
  limit = 5,
}: SearchTarotKnowledgeParams): Promise<TarotKnowledgeResult[]> {
  const normalizedQuery = query.trim();
  const normalizedCardId = cardId.trim();

  if (!normalizedQuery) {
    throw new Error("Search query cannot be empty.");
  }

  if (!normalizedCardId) {
    throw new Error("Card ID cannot be empty.");
  }

  const embeddingResponse = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: normalizedQuery,
  });

  const queryVector = embeddingResponse.data[0]?.embedding;

  if (!queryVector) {
    throw new Error("Failed to generate query embedding.");
  }

  const results = await qdrant.search(COLLECTION_NAME, {
    vector: queryVector,
    limit,
    with_payload: true,
    filter: {
      must: [
        {
          key: "cardId",
          match: {
            value: normalizedCardId,
          },
        },
        {
          key: "orientation",
          match: {
            any: [orientation, "neutral"],
          },
        },
      ],
    },
  });

  return results.map((result) => {
    const payload = result.payload ?? {};

    return {
      score: result.score,
      cardId: String(payload.cardId ?? ""),
      sourceId: String(payload.sourceId ?? ""),
      cardName: String(payload.cardName ?? ""),
      cardType: String(payload.cardType ?? ""),
      knowledgeType: String(payload.knowledgeType ?? ""),
      topic: String(payload.topic ?? ""),
      orientation: String(payload.orientation ?? ""),
      meaning: String(payload.meaning ?? ""),
      description: String(payload.description ?? ""),
      content: String(payload.content ?? ""),
    };
  });
}
