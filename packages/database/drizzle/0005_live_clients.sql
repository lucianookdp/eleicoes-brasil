CREATE TABLE "live_clients" (
	"instance" text PRIMARY KEY NOT NULL,
	"clients" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
