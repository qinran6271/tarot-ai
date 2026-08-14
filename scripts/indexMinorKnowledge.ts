import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { QdrantClient } from "@qdrant/js-client-rest";

dotenv.config({
  path: ".env.local",
  quiet: true,
});

const SOURCE_ID = "其实你已经很塔罗了";
const KNOWLEDGE_DIRECTORY = path.join(
  process.cwd(),
  "data",
  "knowledge",
  SOURCE_ID,
  "minor",
);
const GENERATED_DIRECTORY = path.join(process.cwd(), "data", "generated");
const PREVIEW_FILE = path.join(
  GENERATED_DIRECTORY,
  "minor-knowledge-points.json",
);
const COLLECTION_NAME = "tarot_knowledge";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_BATCH_SIZE = 100;
const UPSERT_BATCH_SIZE = 100;

// Keep the same namespace as the major-arcana uploader. The source/card/entry
// key remains unique and produces the same Qdrant UUID on repeated uploads.
const POINT_ID_NAMESPACE = "9fb0a3cc-144d-4e74-906b-1c70cb52c24e";

type Orientation = "upright" | "reversed" | "neutral";

type KnowledgeEntry = {
  id: string;
  orientation: Orientation;
  topic: string;
  content: string;
};

type SourceEntry = {
  sourceId: string;
};

type MinorKnowledgeFile = {
  cardId: string;
  name: {
    en: string;
  };
  arcana: "minor";
  suit: string;
  sources: SourceEntry[];
  knowledge: KnowledgeEntry[];
};

type MinorKnowledgePayload = {
  cardId: string;
  cardName: string;
  cardType: "minor";
  sourceId: string;
  knowledgeType: string;
  topic: string;
  orientation: Orientation;
  meaning: string;
  description: string;
  content: string;
};

type PreviewPoint = {
  id: string;
  payload: MinorKnowledgePayload;
};

function uuidToBytes(uuid: string): Buffer {
  return Buffer.from(uuid.replaceAll("-", ""), "hex");
}

function createStablePointId(key: string): string {
  const digest = createHash("sha1")
    .update(uuidToBytes(POINT_ID_NAMESPACE))
    .update(key)
    .digest()
    .subarray(0, 16);

  digest[6] = (digest[6]! & 0x0f) | 0x50;
  digest[8] = (digest[8]! & 0x3f) | 0x80;

  const hex = digest.toString("hex");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function assertNonEmpty(value: string, field: string, fileName: string) {
  if (!value.trim()) {
    throw new Error(`${fileName}: ${field} cannot be empty.`);
  }
}

function listKnowledgeFiles(): string[] {
  return fs
    .readdirSync(KNOWLEDGE_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((suitDirectory) => {
      const directory = path.join(KNOWLEDGE_DIRECTORY, suitDirectory.name);

      return fs
        .readdirSync(directory)
        .filter((fileName) => fileName.endsWith(".json"))
        .sort()
        .map((fileName) => path.join(directory, fileName));
    });
}

function parseKnowledgeFile(filePath: string): MinorKnowledgeFile | null {
  const relativeName = path.relative(KNOWLEDGE_DIRECTORY, filePath);
  const raw = fs.readFileSync(filePath, "utf8").trim();

  if (!raw) {
    console.warn(`Skipping empty file: ${relativeName}`);
    return null;
  }

  const parsed: unknown = JSON.parse(raw);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("cardId" in parsed) ||
    !("knowledge" in parsed)
  ) {
    console.log(`Skipping suit-wide knowledge file: ${relativeName}`);
    return null;
  }

  const card = parsed as MinorKnowledgeFile;

  assertNonEmpty(card.cardId, "cardId", relativeName);
  assertNonEmpty(card.name?.en ?? "", "name.en", relativeName);
  assertNonEmpty(card.suit ?? "", "suit", relativeName);

  if (card.arcana !== "minor") {
    throw new Error(`${relativeName}: expected arcana to be "minor".`);
  }

  if (!Array.isArray(card.sources) || !card.sources[0]?.sourceId) {
    throw new Error(`${relativeName}: at least one sourceId is required.`);
  }

  if (!Array.isArray(card.knowledge)) {
    throw new Error(`${relativeName}: knowledge must be an array.`);
  }

  return card;
}

function createEmbeddingContent(
  card: MinorKnowledgeFile,
  entry: KnowledgeEntry,
  sourceId: string,
): string {
  const orientation =
    entry.orientation.charAt(0).toUpperCase() + entry.orientation.slice(1);

  return [
    `Card: ${card.name.en}`,
    `Card ID: ${card.cardId}`,
    `Card type: ${card.arcana}`,
    `Suit: ${card.suit}`,
    `Source: ${sourceId}`,
    `Knowledge type: ${entry.id}`,
    `Topic: ${entry.topic}`,
    `Orientation: ${orientation}`,
    `Meaning: ${entry.content}`,
  ].join("\n");
}

function createPreviewPoints(): PreviewPoint[] {
  const points: PreviewPoint[] = [];

  for (const filePath of listKnowledgeFiles()) {
    const card = parseKnowledgeFile(filePath);

    if (!card) {
      continue;
    }

    const fileName = path.relative(KNOWLEDGE_DIRECTORY, filePath);
    const sourceId = card.sources[0]!.sourceId;

    for (const entry of card.knowledge) {
      assertNonEmpty(entry.id, "knowledge.id", fileName);
      assertNonEmpty(entry.topic, "knowledge.topic", fileName);
      assertNonEmpty(entry.content, "knowledge.content", fileName);

      if (!(["upright", "reversed", "neutral"] as string[]).includes(entry.orientation)) {
        throw new Error(
          `${fileName}: invalid orientation "${entry.orientation}" in ${entry.id}.`,
        );
      }

      const stableKey = `${sourceId}:${card.cardId}:${entry.id}`;

      points.push({
        id: createStablePointId(stableKey),
        payload: {
          cardId: card.cardId,
          cardName: card.name.en,
          cardType: "minor",
          sourceId,
          knowledgeType: entry.id,
          topic: entry.topic,
          orientation: entry.orientation,
          meaning: entry.content,
          description: "",
          content: createEmbeddingContent(card, entry, sourceId),
        },
      });
    }
  }

  const pointIds = new Set(points.map((point) => point.id));
  if (pointIds.size !== points.length) {
    throw new Error("Generated duplicate Qdrant point IDs.");
  }

  return points;
}

function writePreview(points: PreviewPoint[]) {
  fs.mkdirSync(GENERATED_DIRECTORY, { recursive: true });
  fs.writeFileSync(PREVIEW_FILE, `${JSON.stringify(points, null, 2)}\n`);
  console.log(`Wrote ${points.length} points to ${PREVIEW_FILE}.`);
}

async function generateEmbeddings(openai: OpenAI, points: PreviewPoint[]) {
  const vectors: number[][] = [];

  for (let start = 0; start < points.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = points.slice(start, start + EMBEDDING_BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch.map((point) => point.payload.content),
    });

    const ordered = [...response.data].sort(
      (left, right) => left.index - right.index,
    );
    vectors.push(...ordered.map((item) => item.embedding));
    console.log(
      `Generated embeddings for ${Math.min(start + batch.length, points.length)}/${points.length} points.`,
    );
  }

  if (vectors.length !== points.length) {
    throw new Error("Embedding count does not match point count.");
  }

  return vectors;
}

async function uploadPoints(points: PreviewPoint[]) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;

  if (!openaiApiKey) {
    throw new Error("Missing OPENAI_API_KEY in .env.local.");
  }

  if (!qdrantUrl || !qdrantApiKey) {
    throw new Error("Missing QDRANT_URL or QDRANT_API_KEY in .env.local.");
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });
  const qdrant = new QdrantClient({ url: qdrantUrl, apiKey: qdrantApiKey });
  const collections = await qdrant.getCollections();
  const collectionExists = collections.collections.some(
    (collection) => collection.name === COLLECTION_NAME,
  );

  if (!collectionExists) {
    throw new Error(
      `Qdrant collection "${COLLECTION_NAME}" does not exist. This script will not create or replace it automatically.`,
    );
  }

  const vectors = await generateEmbeddings(openai, points);
  const qdrantPoints = points.map((point, index) => ({
    id: point.id,
    vector: vectors[index]!,
    payload: point.payload,
  }));

  for (let start = 0; start < qdrantPoints.length; start += UPSERT_BATCH_SIZE) {
    const batch = qdrantPoints.slice(start, start + UPSERT_BATCH_SIZE);
    await qdrant.upsert(COLLECTION_NAME, { wait: true, points: batch });
    console.log(
      `Uploaded ${Math.min(start + batch.length, qdrantPoints.length)}/${qdrantPoints.length} points.`,
    );
  }
}

async function main() {
  const shouldUpload = process.argv.includes("--upload");
  const points = createPreviewPoints();

  writePreview(points);

  if (!shouldUpload) {
    console.log("Preview only. Pass --upload to generate vectors and upsert.");
    return;
  }

  await uploadPoints(points);
  console.log(
    `Successfully upserted ${points.length} minor-arcana knowledge points.`,
  );
}

main().catch((error: unknown) => {
  console.error("Failed to index minor-arcana knowledge:");
  console.error(error);
  process.exitCode = 1;
});
