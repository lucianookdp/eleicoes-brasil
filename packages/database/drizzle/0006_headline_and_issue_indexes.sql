-- Partial indexes for two queries that otherwise scan election-night volume: the latest
-- source/collector issue (every overview and state page) and the recent Brazil/state result files
-- (collection delay on /operations). Small: they hold only those rows.
CREATE INDEX "ingestion_events_issues_time" ON "ingestion_events" USING btree ("round_id","occurred_at") WHERE "ingestion_events"."type" like 'source.%' or "ingestion_events"."type" = 'collector.error';--> statement-breakpoint
CREATE INDEX "result_snapshots_headline_time" ON "result_snapshots" USING btree ("round_id","captured_at") WHERE "result_snapshots"."area_type" in ('country', 'state');