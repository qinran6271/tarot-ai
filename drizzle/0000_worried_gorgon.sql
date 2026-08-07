CREATE TYPE "public"."reading_status" AS ENUM('active', 'completed');--> statement-breakpoint
CREATE TABLE "readings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"focus" text NOT NULL,
	"spread" jsonb NOT NULL,
	"cards" jsonb NOT NULL,
	"content" jsonb NOT NULL,
	"conversation" jsonb NOT NULL,
	"status" "reading_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "readings_user_created_at_idx" ON "readings" USING btree ("user_id","created_at");