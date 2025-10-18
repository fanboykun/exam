ALTER TABLE "assignments" ALTER COLUMN "finish_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "correct_answer" integer DEFAULT 0 NOT NULL;