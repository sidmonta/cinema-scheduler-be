import { eq } from 'drizzle-orm';
import { db } from '../config/drizzle.config.connection.js';
import { utente } from '../db/schema.js';
import type { RegisterInput } from '../schemas/auth.schema.js';

export class AuthRepository {
  async findByEmail(email: string) {
    const [found] = await db.select().from(utente).where(eq(utente.email, email));

    return found || null;
  }

  async create(data: RegisterInput) {
    const [nuovoUtente] = await db
      .insert(utente)
      .values({
        email: data.email,
        password: data.password,
        nome: data.nome,
        cognome: data.cognome,
        ruolo: data.ruolo || 'USER',
      })
      .returning();

    return nuovoUtente;
  }
}
