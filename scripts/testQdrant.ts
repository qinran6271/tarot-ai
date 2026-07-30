import dotenv from "dotenv";
import { QdrantClient } from "@qdrant/js-client-rest";

dotenv.config({ path: ".env.local" });

const qdrantUrl = process.env.QDRANT_URL;
const qdrantApiKey = process.env.QDRANT_API_KEY;

if (!qdrantUrl || !qdrantApiKey) {
  throw new Error(
    "Missing QDRANT_URL or QDRANT_API_KEY in .env.local"
  );
}

const client = new QdrantClient({
  url: qdrantUrl,
  apiKey: qdrantApiKey,
});

async function main() {
  const collections = await client.getCollections();

  console.log("Connected to Qdrant!");
  console.log(collections);
}

main().catch((error) => {
  console.error("Qdrant connection failed:");
  console.error(error);
  process.exit(1);
});