# 🔮 Walawala Tarot AI

Walawala Tarot AI is an AI-powered tarot reading application built with Next.js, OpenAI, and Qdrant. Users can choose a spread, ask a question, and draw upright or reversed cards. The application retrieves relevant card knowledge based on the cards, orientations, and question topic before generating a focused interpretation and practical advice.

Live app: [walawala-tarot-khaki.vercel.app](https://walawala-tarot-khaki.vercel.app/)

## Features

- Personalized AI tarot readings
- Multiple tarot spreads with upright and reversed cards
- Interpretations grounded in a curated tarot knowledge base
- Practical insights tailored to the user’s question
- English and Chinese reading support
- Reading history, favorites, and follow-up conversations
- Guest mode and user accounts
- Responsive design for desktop and mobile

## Tech Stack

- Next.js 16 App Router
- React 19, TypeScript, and Tailwind CSS 4
- Zustand
- OpenAI `gpt-4.1-mini`
- OpenAI `text-embedding-3-small`
- Qdrant vector database
- Neon Postgres, Neon Auth, and Drizzle ORM
- Vercel

## Getting Started

Node.js 20 or later is recommended.

```bash
git clone https://github.com/qinran6271/tarot-ai.git
cd tarot-ai
npm install
cp .env.example .env.local
```

Configure `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
NEON_AUTH_BASE_URL=https://your-neon-auth-endpoint.example.com
NEON_AUTH_COOKIE_SECRET=replace-with-at-least-32-random-characters

OPENAI_API_KEY=your_openai_api_key
QDRANT_URL=https://your-qdrant-endpoint
QDRANT_API_KEY=your_qdrant_api_key
```

Generate and run the database migrations, then start the development server:

```bash
npm run db:generate
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Knowledge Base Structure

Knowledge is organized by source, arcana, suit, and card:

```text
data/
├── sources/
│   └── 其实你已经很塔罗了/
│       ├── guides/
│       ├── major/
│       └── minor/
│           ├── wands/
│           ├── cups/
│           ├── swords/
│           └── pentacles/
└── knowledge/
    └── 其实你已经很塔罗了/
        ├── guides/
        ├── major/
        └── minor/
            ├── wands/
            ├── cups/
            ├── swords/
            └── pentacles/
```

`sources` contains organized source material. `knowledge` contains structured JSON that can be converted into Qdrant points. Each card uses a stable English slug as its `cardId`:

```json
{
  "cardId": "the-magician",
  "cardName": "The Magician",
  "cardType": "major",
  "sourceId": "其实你已经很塔罗了",
  "knowledgeType": "magician-upright-career",
  "topic": "career",
  "orientation": "upright",
  "meaning": "...",
  "content": "..."
}
```

Qdrant point IDs are generated deterministically from the source, `cardId`, and knowledge entry ID. Uploading the same entry again updates the existing point instead of creating duplicates with random UUIDs.

## Generating and Uploading Knowledge Points

The default Qdrant collection is `tarot_knowledge`. Vectors are generated with `text-embedding-3-small`. The major- and minor-arcana upload scripts do not delete or recreate the existing collection.

Run a preview first to inspect the generated payloads:

```bash
npm run knowledge:major:preview
npm run knowledge:minor:preview
```

Preview files are written to `data/generated/`. This directory is ignored by Git. Preview mode does not call the embedding API or write anything to Qdrant.

After reviewing the points, upload them with:

```bash
npm run knowledge:major:upload
npm run knowledge:minor:upload
```

Before uploading, make sure that:

- OpenAI and Qdrant credentials are configured in `.env.local`.
- A `tarot_knowledge` collection already exists in Qdrant.
- The collection uses 1,536-dimensional vectors and Cosine distance.
- `cardId` and `orientation` have keyword payload indexes.

The legacy `scripts/indexTarotKnowledge.ts` script recreates the collection. Review its destructive behavior before running it against an existing knowledge base.

## How a Reading Works

1. The user enters a question and selects a tarot spread.
2. The client draws cards and assigns upright or reversed orientations.
3. The API detects the topic of the question using Chinese and English keywords.
4. For each card, the application embeds the question and searches Qdrant using `cardId` and orientation filters.
5. Results are reranked using semantic similarity, topic relevance, and orientation relevance.
6. The most relevant knowledge is combined with the question and card spread.
7. The model generates a Key Insight, detailed Interpretation, and actionable Advice.
8. For signed-in users, the reading is stored in Neon Postgres and can be continued from the reading history.

## Available Commands

```bash
npm run dev                       # Start the development server
npm run build                     # Create a production build
npm run start                     # Start the production server
npm run lint                      # Run ESLint
npm run db:generate               # Generate a Drizzle migration
npm run db:migrate                # Run database migrations
npm run db:studio                 # Open Drizzle Studio
npm run knowledge:major:preview   # Preview Major Arcana points
npm run knowledge:major:upload    # Upload Major Arcana points
npm run knowledge:minor:preview   # Preview Minor Arcana points
npm run knowledge:minor:upload    # Upload Minor Arcana points
```

## Project Structure

```text
app/          Pages, layouts, and API routes
components/   UI and reading components
data/         Tarot source material and structured knowledge
lib/          Authentication, RAG, reading storage, and shared logic
public/       Card images and static assets
scripts/      Knowledge conversion, embedding, and upload scripts
store/        Zustand state
types/        TypeScript types
```

## Data and Copyright

Knowledge text and source material in this repository should not automatically be treated as part of an open-source software license. Confirm the licensing and copyright status of the original material before publicly copying, redistributing, or commercially using it.

API keys, database connection strings, and Qdrant credentials should only be stored in `.env.local` or encrypted environment variables provided by the deployment platform.

## Known Issues

- `data/knowledge/其实你已经很塔罗了/major/13-death.json` is currently empty, so preview and upload scripts skip it.
- Guides, suit overviews, and stories are stored in the knowledge directory, but the current Major and Minor Arcana upload scripts only upload card-specific entries containing a `cardId`.

## Roadmap

- Complete the Death card knowledge and define an indexing strategy for guides, overviews, and stories
- Add topic-classification and retrieval-quality evaluations
- Improve contextual retrieval for follow-up conversations
- Add custom deck themes and social sharing
