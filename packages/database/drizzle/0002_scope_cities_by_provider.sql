-- Demo municipality codes are made up and could collide with official TSE codes. From now on
-- the demo stores its municipalities under provider 'DEMO'. Cities are re-synced by each
-- collector at start (and by imports), so the shared table is simply cleared once.
UPDATE "election_rounds" r SET "provider" = 'DEMO' FROM "elections" e WHERE e."id" = r."election_id" AND e."demo";
--> statement-breakpoint
DELETE FROM "cities";
