ALTER TABLE "cinema" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "cinema" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "film" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "film" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "posto" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "posto" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "posto" ALTER COLUMN "prenotazione_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "prenotazione" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "prenotazione" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "prenotazione" ALTER COLUMN "utente_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "prenotazione" ALTER COLUMN "proiezione_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "proiezione" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "proiezione" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "proiezione" ALTER COLUMN "sala_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "proiezione" ALTER COLUMN "film_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "sala" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "sala" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sala" ALTER COLUMN "cinema_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "utente" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "utente" ALTER COLUMN "id" DROP DEFAULT;