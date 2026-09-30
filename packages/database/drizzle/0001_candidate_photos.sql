CREATE TABLE "candidate_photos" (
	"round_id" uuid NOT NULL,
	"candidate_key" text NOT NULL,
	"content_type" text,
	"data" "bytea",
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_photos_round_id_candidate_key_pk" PRIMARY KEY("round_id","candidate_key")
);
--> statement-breakpoint
ALTER TABLE "candidate_photos" ADD CONSTRAINT "candidate_photos_round_id_election_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."election_rounds"("id") ON DELETE cascade ON UPDATE no action;