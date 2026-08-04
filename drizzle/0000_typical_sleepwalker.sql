CREATE TYPE "public"."classificazione" AS ENUM('T', '14+', '18+');--> statement-breakpoint
CREATE TABLE "film" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titolo" varchar(255) NOT NULL,
	"durata" integer NOT NULL,
	"genere" varchar(255) NOT NULL,
	"classificazione" "classificazione" NOT NULL,
	"creata_il" timestamp DEFAULT now() NOT NULL,
	"aggiornata_il" timestamp DEFAULT now() NOT NULL,
	"eliminata" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sala" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"capienza" integer NOT NULL,
	"file" integer NOT NULL,
	"colonne" integer NOT NULL,
	"creata_il" timestamp DEFAULT now() NOT NULL,
	"aggiornata_il" timestamp DEFAULT now() NOT NULL,
	"eliminata" boolean DEFAULT false NOT NULL
);
