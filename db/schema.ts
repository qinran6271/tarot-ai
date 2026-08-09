import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { TarotSpread } from "@/lib/spreads";
import type { ReadingMessageMetadata } from "@/types/reading";

export const readings = pgTable(
  "readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Authentication will provide this value before database-backed History
    // is exposed to users.
    userId: text("user_id").notNull(),

    focus: text("focus").notNull(),
    spreadId: text("spread_id").notNull(),
    spreadSnapshot: jsonb("spread_snapshot").$type<TarotSpread>().notNull(),

    lastMessageAt: timestamp("last_message_at", {
      withTimezone: true,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    favoritedAt: timestamp("favorited_at", {
      withTimezone: true,
      mode: "string",
    }),
    archivedAt: timestamp("archived_at", {
      withTimezone: true,
      mode: "string",
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("readings_user_archived_last_message_idx").on(
      table.userId,
      table.archivedAt,
      table.lastMessageAt.desc(),
    ),
    index("readings_user_favorited_at_idx").on(
      table.userId,
      table.favoritedAt,
    ),
  ]
);

export type ReadingRow = typeof readings.$inferSelect;
export type NewReadingRow = typeof readings.$inferInsert;

export const readingCardSourceEnum = pgEnum("reading_card_source", [
  "spread",
  "clarification",
  "daily",
]);

export const readingCards = pgTable(
  "reading_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    readingId: uuid("reading_id")
      .notNull()
      .references(() => readings.id, { onDelete: "cascade" }),

    // Static card details continue to come from data/tarot.json.
    cardId: text("card_id").notNull(),

    position: text("position"),
    isReversed: boolean("is_reversed").notNull(),
    source: readingCardSourceEnum("source").notNull(),
    sequence: integer("sequence").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("reading_cards_reading_sequence_unique").on(
      table.readingId,
      table.sequence,
    ),
    uniqueIndex("reading_cards_reading_card_unique").on(
      table.readingId,
      table.cardId,
    ),
    check("reading_cards_sequence_positive", sql`${table.sequence} > 0`),
  ],
);

export type ReadingCardRow = typeof readingCards.$inferSelect;
export type NewReadingCardRow = typeof readingCards.$inferInsert;

export const readingMessageRoleEnum = pgEnum("reading_message_role", [
  "user",
  "assistant",
]);

export const readingMessageKindEnum = pgEnum("reading_message_kind", [
  "question",
  "initial-reading",
  "follow-up",
  "clarification-reading",
]);

export const readingMessages = pgTable(
  "reading_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    readingId: uuid("reading_id")
      .notNull()
      .references(() => readings.id, { onDelete: "cascade" }),

    role: readingMessageRoleEnum("role").notNull(),
    kind: readingMessageKindEnum("kind").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata").$type<ReadingMessageMetadata>(),
    sequence: integer("sequence").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("reading_messages_reading_sequence_unique").on(
      table.readingId,
      table.sequence,
    ),
    check(
      "reading_messages_content_not_blank",
      sql`length(trim(${table.content})) > 0`,
    ),
    check("reading_messages_sequence_positive", sql`${table.sequence} > 0`),
  ],
);

export type ReadingMessageRow = typeof readingMessages.$inferSelect;
export type NewReadingMessageRow = typeof readingMessages.$inferInsert;
