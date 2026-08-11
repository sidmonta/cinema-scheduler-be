CREATE TYPE "public"."ruolo" AS ENUM('ADMIN', 'USER');--> statement-breakpoint
CREATE TYPE "public"."stato" AS ENUM('CONFIRMED', 'PENDING', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "prenotazione" ALTER COLUMN "stato" SET DEFAULT 'PENDING'::"public"."stato";--> statement-breakpoint
ALTER TABLE "prenotazione" ALTER COLUMN "stato" SET DATA TYPE "public"."stato" USING "stato"::"public"."stato";--> statement-breakpoint
ALTER TABLE "utente" ALTER COLUMN "ruolo" SET DEFAULT 'USER'::"public"."ruolo";--> statement-breakpoint
ALTER TABLE "utente" ALTER COLUMN "ruolo" SET DATA TYPE "public"."ruolo" USING "ruolo"::"public"."ruolo";--> statement-breakpoint
ALTER TABLE "prenotazione" ADD COLUMN "riga" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "prenotazione" ADD COLUMN "colonna" integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_posto_proiezione_idx" ON "prenotazione" USING btree ("proiezione_id","riga","colonna");