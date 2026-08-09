ALTER TABLE "readings" RENAME COLUMN "spread" TO "spread_snapshot";--> statement-breakpoint
DROP INDEX "readings_user_created_at_idx";--> statement-breakpoint
ALTER TABLE "readings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "readings" ADD COLUMN "spread_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "readings" ADD COLUMN "last_message_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "readings" ADD COLUMN "favorited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "readings" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "readings_user_archived_last_message_idx" ON "readings" USING btree ("user_id","archived_at","last_message_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "readings_user_favorited_at_idx" ON "readings" USING btree ("user_id","favorited_at");--> statement-breakpoint
ALTER TABLE "readings" DROP COLUMN "cards";--> statement-breakpoint
ALTER TABLE "readings" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "readings" DROP COLUMN "conversation";--> statement-breakpoint
ALTER TABLE "readings" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."reading_status";