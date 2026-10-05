CREATE TABLE "site_visits" (
	"day" date NOT NULL,
	"visitor" text NOT NULL,
	CONSTRAINT "site_visits_day_visitor_pk" PRIMARY KEY("day","visitor")
);
