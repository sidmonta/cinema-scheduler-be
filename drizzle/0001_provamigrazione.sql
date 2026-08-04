CREATE TABLE "cinema" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"indirizzo" varchar(255) NOT NULL,
	"citta" varchar(255) NOT NULL,
	"telefono" varchar(255) NOT NULL,
	"creata_il" timestamp DEFAULT now() NOT NULL,
	"aggiornata_il" timestamp DEFAULT now() NOT NULL,
	"eliminata" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prenotazione_id" uuid NOT NULL,
	"riga" integer NOT NULL,
	"colonna" integer NOT NULL,
	"creata_il" timestamp DEFAULT now() NOT NULL,
	"aggiornata_il" timestamp DEFAULT now() NOT NULL,
	"eliminata" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prenotazione" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"utente_id" uuid NOT NULL,
	"proiezione_id" uuid NOT NULL,
	"stato" varchar(255) NOT NULL,
	"creata_il" timestamp DEFAULT now() NOT NULL,
	"aggiornata_il" timestamp DEFAULT now() NOT NULL,
	"eliminata" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proiezione" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sala_id" uuid NOT NULL,
	"film_id" uuid NOT NULL,
	"data_ora_inizio" timestamp NOT NULL,
	"data_ora_fine" timestamp NOT NULL,
	"creata_il" timestamp DEFAULT now() NOT NULL,
	"aggiornata_il" timestamp DEFAULT now() NOT NULL,
	"eliminata" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"cognome" varchar(255) NOT NULL,
	"ruolo" varchar(255) NOT NULL,
	"creata_il" timestamp DEFAULT now() NOT NULL,
	"aggiornata_il" timestamp DEFAULT now() NOT NULL,
	"eliminata" boolean DEFAULT false NOT NULL,
	CONSTRAINT "utente_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "film" RENAME COLUMN "durata" TO "durata_minuti";--> statement-breakpoint
ALTER TABLE "sala" RENAME COLUMN "file" TO "righe";--> statement-breakpoint
ALTER TABLE "sala" ADD COLUMN "capienza" integer GENERATED ALWAYS AS ("righe" * "colonne") STORED;--> statement-breakpoint
ALTER TABLE "sala" ADD COLUMN "cinema_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "posto" ADD CONSTRAINT "posto_prenotazione_id_prenotazione_id_fk" FOREIGN KEY ("prenotazione_id") REFERENCES "public"."prenotazione"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prenotazione" ADD CONSTRAINT "prenotazione_utente_id_utente_id_fk" FOREIGN KEY ("utente_id") REFERENCES "public"."utente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prenotazione" ADD CONSTRAINT "prenotazione_proiezione_id_proiezione_id_fk" FOREIGN KEY ("proiezione_id") REFERENCES "public"."proiezione"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proiezione" ADD CONSTRAINT "proiezione_sala_id_sala_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."sala"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proiezione" ADD CONSTRAINT "proiezione_film_id_film_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."film"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sala" ADD CONSTRAINT "sala_cinema_id_cinema_id_fk" FOREIGN KEY ("cinema_id") REFERENCES "public"."cinema"("id") ON DELETE no action ON UPDATE no action;