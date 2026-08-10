import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  readingCards,
  readingMessages,
  readings,
  type ReadingRow,
} from "@/db/schema";
import { tarotDeck } from "@/lib/tarot";
import type {
  Reading,
  ReadingContent,
  ReadingMessageMetadata,
} from "@/types/reading";
import type { DrawnCard } from "@/types/tarot";

const EMPTY_CONTENT: ReadingContent = {
  keyInsight: "",
  interpretation: "",
  advice: "",
  followUps: [],
};

export async function listReadingsForUser(userId: string): Promise<Reading[]> {
  const readingRows = await db
    .select()
    .from(readings)
    .where(eq(readings.userId, userId))
    .orderBy(desc(readings.lastMessageAt));

  return hydrateReadingRows(readingRows);
}

export async function getReadingForUser(
  userId: string,
  readingId: string,
): Promise<Reading | null> {
  const readingRows = await db
    .select()
    .from(readings)
    .where(and(eq(readings.id, readingId), eq(readings.userId, userId)))
    .limit(1);

  const [reading] = await hydrateReadingRows(readingRows);
  return reading ?? null;
}

async function hydrateReadingRows(
  readingRows: ReadingRow[],
): Promise<Reading[]> {
  if (readingRows.length === 0) return [];

  const readingIds = readingRows.map((reading) => reading.id);
  const [cardRows, messageRows] = await Promise.all([
    db
      .select()
      .from(readingCards)
      .where(inArray(readingCards.readingId, readingIds))
      .orderBy(asc(readingCards.sequence)),
    db
      .select()
      .from(readingMessages)
      .where(inArray(readingMessages.readingId, readingIds))
      .orderBy(asc(readingMessages.sequence)),
  ]);

  return readingRows.map((reading) => {
    const rowsForReading = cardRows.filter(
      (card) => card.readingId === reading.id,
    );
    const cardsByRowId = new Map<string, DrawnCard>();
    const cards = rowsForReading.flatMap((cardRow) => {
      const card = tarotDeck.find((item) => item.id === cardRow.cardId);
      if (!card) return [];

      const drawnCard: DrawnCard = {
        ...card,
        position: cardRow.position ?? undefined,
        isReversed: cardRow.isReversed,
        source: cardRow.source,
      };
      cardsByRowId.set(cardRow.id, drawnCard);
      return [drawnCard];
    });

    const messages = messageRows
      .filter((message) => message.readingId === reading.id)
      .map((message) => {
        const suggestion = message.metadata?.clarificationSuggestion;
        return {
          id: message.id,
          role: message.role,
          kind: message.kind,
          content: message.content,
          createdAt: message.createdAt,
          clarificationSuggestion: suggestion
            ? {
                reason: suggestion.reason,
                question: suggestion.question,
                status: suggestion.status,
                card: suggestion.readingCardId
                  ? cardsByRowId.get(suggestion.readingCardId)
                  : undefined,
              }
            : undefined,
        };
      });

    const initialMetadata = messageRows.find(
      (message) =>
        message.readingId === reading.id &&
        message.kind === "initial-reading",
    )?.metadata;

    return {
      id: reading.id,
      createdAt: reading.createdAt,
      updatedAt: reading.updatedAt,
      focus: reading.focus,
      spread: reading.spreadSnapshot,
      cards,
      content: initialMetadata
        ? {
            keyInsight: initialMetadata.keyInsight ?? "",
            interpretation: initialMetadata.interpretation ?? "",
            advice: initialMetadata.advice ?? "",
            followUps: initialMetadata.followUps ?? [],
          }
        : EMPTY_CONTENT,
      conversation: messages,
      favoritedAt: reading.favoritedAt ?? undefined,
      archivedAt: reading.archivedAt ?? undefined,
    };
  });
}

export async function saveReadingForUser(
  userId: string,
  reading: Reading,
): Promise<"saved" | "forbidden"> {
  const [existingReading] = await db
    .select({ userId: readings.userId })
    .from(readings)
    .where(eq(readings.id, reading.id))
    .limit(1);

  if (existingReading && existingReading.userId !== userId) {
    return "forbidden";
  }

  const lastMessageAt =
    reading.conversation.at(-1)?.createdAt ?? reading.updatedAt;

  await db
    .insert(readings)
    .values({
      id: reading.id,
      userId,
      focus: reading.focus,
      spreadId: reading.spread.id,
      spreadSnapshot: reading.spread,
      lastMessageAt,
      favoritedAt: reading.favoritedAt ?? null,
      archivedAt: reading.archivedAt ?? null,
      createdAt: reading.createdAt,
      updatedAt: reading.updatedAt,
    })
    .onConflictDoUpdate({
      target: readings.id,
      set: {
        focus: reading.focus,
        spreadId: reading.spread.id,
        spreadSnapshot: reading.spread,
        lastMessageAt,
        favoritedAt: reading.favoritedAt ?? null,
        archivedAt: reading.archivedAt ?? null,
        updatedAt: reading.updatedAt,
      },
    });

  const existingCardRows = await db
    .select({ id: readingCards.id, cardId: readingCards.cardId })
    .from(readingCards)
    .where(eq(readingCards.readingId, reading.id));
  const cardRowIdByCardId = new Map(
    existingCardRows.map((card) => [card.cardId, card.id]),
  );

  await Promise.all(
    reading.cards.map((card, index) => {
      const rowId = cardRowIdByCardId.get(card.id) ?? crypto.randomUUID();
      cardRowIdByCardId.set(card.id, rowId);

      return db
        .insert(readingCards)
        .values({
          id: rowId,
          readingId: reading.id,
          cardId: card.id,
          position: card.position ?? null,
          isReversed: card.isReversed,
          source: card.source,
          sequence: index + 1,
        })
        .onConflictDoUpdate({
          target: readingCards.id,
          set: {
            position: card.position ?? null,
            isReversed: card.isReversed,
            source: card.source,
            sequence: index + 1,
          },
        });
    }),
  );

  await Promise.all(
    reading.conversation.map((message, index) => {
      const suggestion = message.clarificationSuggestion;
      const metadata: ReadingMessageMetadata | null =
        message.kind === "initial-reading"
          ? reading.content
          : suggestion
            ? {
                clarificationSuggestion: {
                  reason: suggestion.reason,
                  question: suggestion.question,
                  status: suggestion.status,
                  readingCardId: suggestion.card
                    ? cardRowIdByCardId.get(suggestion.card.id)
                    : undefined,
                },
              }
            : null;

      return db
        .insert(readingMessages)
        .values({
          id: message.id,
          readingId: reading.id,
          role: message.role,
          kind: message.kind,
          content: message.content,
          metadata,
          sequence: index + 1,
          createdAt: message.createdAt,
        })
        .onConflictDoUpdate({
          target: readingMessages.id,
          set: {
            content: message.content,
            metadata,
            sequence: index + 1,
          },
        });
    }),
  );

  return "saved";
}

export async function deleteReadingForUser(
  userId: string,
  readingId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(readings)
    .where(and(eq(readings.id, readingId), eq(readings.userId, userId)))
    .returning({ id: readings.id });

  return deleted.length > 0;
}
