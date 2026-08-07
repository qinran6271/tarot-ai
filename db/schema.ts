import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import type { Reading } from "@/types/reading";

export const readingStatusEnum = pgEnum("reading_status", [
  "active",
  "completed",
]);

export const readings = pgTable(
  "readings",
  {
    id: uuid("id").primaryKey(),

    // Authentication will provide this value before database-backed History
    // is exposed to users.
    userId: text("user_id").notNull(),

    focus: text("focus").notNull(),
    spread: jsonb("spread").$type<Reading["spread"]>().notNull(),
    cards: jsonb("cards").$type<Reading["cards"]>().notNull(),
    content: jsonb("content").$type<Reading["content"]>().notNull(),
    conversation: jsonb("conversation")
      .$type<Reading["conversation"]>()
      .notNull(),
    status: readingStatusEnum("status").notNull().default("active"),

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
    index("readings_user_created_at_idx").on(table.userId, table.createdAt),
  ]
);

export type ReadingRow = typeof readings.$inferSelect;
export type NewReadingRow = typeof readings.$inferInsert;
