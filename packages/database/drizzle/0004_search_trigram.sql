-- Search by any part of a name ("%pala%") without reading every row: trigram indexes. The 2026
-- candidate list has ~34,000 rows, and each different term typed by a reader is a new query.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidates_search_trgm" ON "candidates" USING gin ("search_name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cities_search_trgm" ON "cities" USING gin ("search_name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidates_round_number" ON "candidates" ("round_id", "number");
