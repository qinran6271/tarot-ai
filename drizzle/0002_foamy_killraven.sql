CREATE TYPE "public"."reading_card_source" AS ENUM('spread', 'clarification', 'daily');--> statement-breakpoint
CREATE TABLE "reading_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reading_id" uuid NOT NULL,
	"card_id" text NOT NULL,
	"position" text,
	"is_reversed" boolean NOT NULL,
	"source" "reading_card_source" NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_cards_sequence_positive" CHECK ("reading_cards"."sequence" > 0)
);
--> statement-breakpoint
ALTER TABLE "reading_cards" ADD CONSTRAINT "reading_cards_reading_id_readings_id_fk" FOREIGN KEY ("reading_id") REFERENCES "public"."readings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reading_cards_reading_sequence_unique" ON "reading_cards" USING btree ("reading_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "reading_cards_reading_card_unique" ON "reading_cards" USING btree ("reading_id","card_id");