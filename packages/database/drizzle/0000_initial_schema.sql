CREATE TABLE "area_progress" (
	"round_id" uuid NOT NULL,
	"area_key" text NOT NULL,
	"area_type" text NOT NULL,
	"state_code" text,
	"status" text NOT NULL,
	"counted_pct" double precision,
	"turnout" bigint,
	"totalized_at" timestamp with time zone,
	"progress" jsonb NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "area_progress_round_id_area_key_pk" PRIMARY KEY("round_id","area_key")
);
--> statement-breakpoint
CREATE TABLE "area_results" (
	"round_id" uuid NOT NULL,
	"office_id" uuid NOT NULL,
	"area_key" text NOT NULL,
	"area_type" text NOT NULL,
	"state_code" text,
	"counted_pct" double precision,
	"totalized_at" timestamp with time zone,
	"result" jsonb NOT NULL,
	"previous_candidates" jsonb,
	"provenance" jsonb NOT NULL,
	"checksum" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "area_results_round_id_office_id_area_key_pk" PRIMARY KEY("round_id","office_id","area_key")
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"office_id" uuid NOT NULL,
	"state_code" text,
	"provider" text DEFAULT 'TSE' NOT NULL,
	"provider_id" text NOT NULL,
	"number" text NOT NULL,
	"name" text NOT NULL,
	"ballot_name" text NOT NULL,
	"search_name" text NOT NULL,
	"party_number" text NOT NULL,
	"party_abbreviation" text NOT NULL,
	"coalition" text,
	"running_mates" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'TSE' NOT NULL,
	"state_code" text NOT NULL,
	"provider_id" text NOT NULL,
	"ibge_code" text,
	"name" text NOT NULL,
	"search_name" text NOT NULL,
	"is_capital" boolean DEFAULT false NOT NULL,
	"zones" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collector_cycles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"round_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"requests" integer DEFAULT 0 NOT NULL,
	"ok" integer DEFAULT 0 NOT NULL,
	"not_modified" integer DEFAULT 0 NOT NULL,
	"not_found" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" double precision,
	"p95_latency_ms" double precision,
	"status" text NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "election_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"round" smallint NOT NULL,
	"date" date NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"provider" text DEFAULT 'TSE' NOT NULL,
	"provider_id" text,
	"adapter" text,
	"adapter_version" text,
	"environment" text,
	"mode" text,
	"progress_election_code" text,
	"provider_election_codes" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "election_rounds_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "elections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"year" smallint NOT NULL,
	"kind" text NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "elections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ingestion_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"round_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"type" text NOT NULL,
	"area_key" text,
	"state_code" text,
	"sections_added" integer,
	"votes_added" bigint,
	"counted_pct" double precision,
	"message" text,
	"context" jsonb
);
--> statement-breakpoint
CREATE TABLE "offices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"provider" text DEFAULT 'TSE' NOT NULL,
	"provider_id" text NOT NULL,
	"provider_election_code" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"scope" text NOT NULL,
	"states" text[]
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"round_id" uuid NOT NULL,
	"number" text NOT NULL,
	"abbreviation" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "parties_round_id_number_pk" PRIMARY KEY("round_id","number")
);
--> statement-breakpoint
CREATE TABLE "progress_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"round_id" uuid NOT NULL,
	"area_key" text NOT NULL,
	"area_type" text NOT NULL,
	"state_code" text,
	"captured_at" timestamp with time zone NOT NULL,
	"totalized_at" timestamp with time zone,
	"counted_pct" double precision,
	"sections_counted" integer,
	"turnout" bigint,
	"progress" jsonb NOT NULL,
	"source_file" text,
	"source_id" text
);
--> statement-breakpoint
CREATE TABLE "result_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"round_id" uuid NOT NULL,
	"office_id" uuid NOT NULL,
	"area_key" text NOT NULL,
	"area_type" text NOT NULL,
	"state_code" text,
	"captured_at" timestamp with time zone NOT NULL,
	"totalized_at" timestamp with time zone,
	"counted_pct" double precision,
	"votes" jsonb NOT NULL,
	"candidates" jsonb,
	"provenance" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "area_progress" ADD CONSTRAINT "area_progress_round_id_election_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."election_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area_results" ADD CONSTRAINT "area_results_round_id_election_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."election_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area_results" ADD CONSTRAINT "area_results_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_round_id_election_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."election_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collector_cycles" ADD CONSTRAINT "collector_cycles_round_id_election_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."election_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_rounds" ADD CONSTRAINT "election_rounds_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_events" ADD CONSTRAINT "ingestion_events_round_id_election_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."election_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offices" ADD CONSTRAINT "offices_round_id_election_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."election_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parties" ADD CONSTRAINT "parties_round_id_election_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."election_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_round_id_election_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."election_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_snapshots" ADD CONSTRAINT "result_snapshots_round_id_election_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."election_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_snapshots" ADD CONSTRAINT "result_snapshots_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "area_progress_type" ON "area_progress" USING btree ("round_id","area_type","state_code");--> statement-breakpoint
CREATE INDEX "area_results_type" ON "area_results" USING btree ("round_id","office_id","area_type","state_code");--> statement-breakpoint
CREATE UNIQUE INDEX "candidates_provider" ON "candidates" USING btree ("round_id","office_id","provider_id");--> statement-breakpoint
CREATE INDEX "candidates_search" ON "candidates" USING btree ("round_id","search_name");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_provider_code" ON "cities" USING btree ("provider","state_code","provider_id");--> statement-breakpoint
CREATE INDEX "cities_search" ON "cities" USING btree ("search_name");--> statement-breakpoint
CREATE INDEX "collector_cycles_time" ON "collector_cycles" USING btree ("round_id","started_at");--> statement-breakpoint
CREATE INDEX "ingestion_events_time" ON "ingestion_events" USING btree ("round_id","occurred_at");--> statement-breakpoint
CREATE INDEX "ingestion_events_type_time" ON "ingestion_events" USING btree ("round_id","type","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "offices_round_slug" ON "offices" USING btree ("round_id","slug");--> statement-breakpoint
CREATE INDEX "progress_snapshots_area_time" ON "progress_snapshots" USING btree ("round_id","area_key","captured_at");--> statement-breakpoint
CREATE INDEX "progress_snapshots_type_time" ON "progress_snapshots" USING btree ("round_id","area_type","captured_at");--> statement-breakpoint
CREATE INDEX "result_snapshots_area_time" ON "result_snapshots" USING btree ("round_id","office_id","area_key","captured_at");