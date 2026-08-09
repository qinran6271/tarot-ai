CREATE TYPE "public"."reading_message_kind" AS ENUM('question', 'initial-reading', 'follow-up', 'clarification-reading');--> statement-breakpoint
CREATE TYPE "public"."reading_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TABLE "reading_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reading_id" uuid NOT NULL,
	"role" "reading_message_role" NOT NULL,
	"kind" "reading_message_kind" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_messages_content_not_blank" CHECK (length(trim("reading_messages"."content")) > 0),
	CONSTRAINT "reading_messages_sequence_positive" CHECK ("reading_messages"."sequence" > 0)
);
--> statement-breakpoint
ALTER TABLE "reading_messages" ADD CONSTRAINT "reading_messages_reading_id_readings_id_fk" FOREIGN KEY ("reading_id") REFERENCES "public"."readings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reading_messages_reading_sequence_unique" ON "reading_messages" USING btree ("reading_id","sequence");