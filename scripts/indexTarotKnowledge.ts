import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { QdrantClient } from "@qdrant/js-client-rest";

dotenv.config({
  path: ".env.local",
  quiet: true,
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in .env.local");
}

if (!QDRANT_URL || !QDRANT_API_KEY) {
  throw new Error(
    "Missing QDRANT_URL or QDRANT_API_KEY in .env.local"
  );
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
const EMBEDDING_SIZE = 1536;

type TarotCard = {
  type: string;
  name_short: string;
  name: string;
  value: string;
  value_int: number;
  meaning_up: string;
  meaning_rev: string;
  desc: string;
};

type TarotKnowledgeFile = {
  nhits: number;
  cards: TarotCard[];
};

type Orientation = "upright" | "reversed";

type KnowledgeType = "traditional_meaning";

type KnowledgeChunk = {
  id: number;
  cardId: string;
  cardName: string;
  cardType: string;
  sourceId: string;
  knowledgeType: KnowledgeType;
  orientation: Orientation;
  meaning: string;
  description: string;
  content: string;
};

function createCardId(cardName: string): string {
  return cardName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadTarotKnowledge(): TarotKnowledgeFile {
  const filePath = path.join(
    process.cwd(),
    "data",
    "tarotKnowledge.json"
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Could not find tarot knowledge file at: ${filePath}`
    );
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");

  return JSON.parse(fileContent) as TarotKnowledgeFile;
}

function createChunks(cards: TarotCard[]): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  cards.forEach((card, cardIndex) => {
    const cardId = createCardId(card.name);

    const uprightContent = [
      `Card: ${card.name}`,
      `Card ID: ${cardId}`,
      `Card type: ${card.type}`,
      "Knowledge type: Traditional meaning",
      "Orientation: Upright",
      `Meaning: ${card.meaning_up}`,
      `Symbolism and description: ${card.desc}`,
    ].join("\n");

    chunks.push({
      id: cardIndex * 2 + 1,
      cardId,
      cardName: card.name,
      cardType: card.type,
      sourceId: card.name_short,
      knowledgeType: "traditional_meaning",
      orientation: "upright",
      meaning: card.meaning_up,
      description: card.desc,
      content: uprightContent,
    });

    const reversedContent = [
      `Card: ${card.name}`,
      `Card ID: ${cardId}`,
      `Card type: ${card.type}`,
      "Knowledge type: Traditional meaning",
      "Orientation: Reversed",
      `Meaning: ${card.meaning_rev}`,
      `Symbolism and description: ${card.desc}`,
    ].join("\n");

    chunks.push({
      id: cardIndex * 2 + 2,
      cardId,
      cardName: card.name,
      cardType: card.type,
      sourceId: card.name_short,
      knowledgeType: "traditional_meaning",
      orientation: "reversed",
      meaning: card.meaning_rev,
      description: card.desc,
      content: reversedContent,
    });
  });

  return chunks;
}

async function createCollection() {
  const collections = await qdrant.getCollections();

  const collectionExists = collections.collections.some(
    (collection) => collection.name === COLLECTION_NAME
  );

  if (collectionExists) {
    console.log(
      `Collection "${COLLECTION_NAME}" already exists. Recreating it...`
    );

    await qdrant.deleteCollection(COLLECTION_NAME);
  }

  await qdrant.createCollection(COLLECTION_NAME, {
    vectors: {
      size: EMBEDDING_SIZE,
      distance: "Cosine",
    },
  });

  console.log(`Created collection "${COLLECTION_NAME}".`);

  // 为过滤字段创建 Payload Index
    await qdrant.createPayloadIndex(COLLECTION_NAME, {
    field_name: "cardId",
    field_schema: "keyword",
    });

    await qdrant.createPayloadIndex(COLLECTION_NAME, {
    field_name: "orientation",
    field_schema: "keyword",
    });

    console.log("Created payload indexes.");
}

async function generateEmbeddings(chunks: KnowledgeChunk[]) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: chunks.map((chunk) => chunk.content),
  });

  return response.data.map((item) => item.embedding);
}

async function indexKnowledge() {
  const tarotKnowledge = loadTarotKnowledge();

  console.log(
    `Loaded ${tarotKnowledge.cards.length} tarot cards.`
  );

  const chunks = createChunks(tarotKnowledge.cards);

  console.log(`Created ${chunks.length} knowledge chunks.`);

  console.log("Example indexed card ID:", {
    sourceId: chunks[0]?.sourceId,
    cardName: chunks[0]?.cardName,
    cardId: chunks[0]?.cardId,
  });

  await createCollection();

  console.log("Generating embeddings...");

  const embeddings = await generateEmbeddings(chunks);

  if (embeddings.length !== chunks.length) {
    throw new Error(
      "The number of embeddings does not match the number of chunks."
    );
  }

  const points = chunks.map((chunk, index) => {
    const vector = embeddings[index];

    if (!vector) {
      throw new Error(
        `Missing embedding for chunk with ID ${chunk.id}.`
      );
    }

    return {
      id: chunk.id,
      vector,
      payload: {
        cardId: chunk.cardId,
        cardName: chunk.cardName,
        cardType: chunk.cardType,
        sourceId: chunk.sourceId,
        knowledgeType: chunk.knowledgeType,
        orientation: chunk.orientation,
        meaning: chunk.meaning,
        description: chunk.description,
        content: chunk.content,
      },
    };
  });

  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });

  console.log(
    `Successfully indexed ${points.length} knowledge chunks into Qdrant.`
  );
}

indexKnowledge().catch((error) => {
  console.error("Failed to index tarot knowledge:");
  console.error(error);
  process.exit(1);
});