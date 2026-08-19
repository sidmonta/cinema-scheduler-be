import { eq, count } from 'drizzle-orm';
import { db } from '../config/drizzle.config.connection.js';
import { sala } from '../db/schema.js';
import type { CreateSaleInput, UpdateSaleInput } from '../schemas/sale.schema.js';

export interface SalePaginate {
  data: Array<typeof sala.$inferSelect>;
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export class SaleRepository {
  async create(data: CreateSaleInput): Promise<typeof sala.$inferSelect> {
    const [newSale] = await db
      .insert(sala)
      .values({
        ...data,
        nome: data.nome,
        righe: data.righe,
        colonne: data.colonne,
        cinema_id: data.cinema_id,
      })
      .returning();
    return newSale;
  }

  async findById(id: string): Promise<typeof sala.$inferSelect> {
    const [foundSale] = await db.select().from(sala).where(eq(sala.id, id));
    return foundSale;
  }

  async findByName(name: string): Promise<typeof sala.$inferSelect> {
    const [foundSale] = await db.select().from(sala).where(eq(sala.nome, name));
    return foundSale;
  }

  async findAll(page: number, limit: number): Promise<SalePaginate> {
    const offset = (page - 1) * limit;

    const data = await db.select().from(sala).limit(limit).offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(sala);

    const find = {
      data,
      meta: {
        page,
        limit,
        totalRecords: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
    return find;
  }

  async update(id: string, data: UpdateSaleInput): Promise<typeof sala.$inferSelect> {
    const [updatedSale] = await db
      .update(sala)
      .set({ ...data, aggiornata_il: new Date() })
      .where(eq(sala.id, id))
      .returning();

    return updatedSale;
  }

  async updateExistence(id: string): Promise<typeof sala.$inferSelect> {
    const [deletedSala] = await db
      .update(sala)
      .set({ aggiornata_il: new Date(), eliminata: true })
      .where(eq(sala.id, id))
      .returning();
    return deletedSala;
  }
}
