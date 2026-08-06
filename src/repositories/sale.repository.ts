import { eq, count } from "drizzle-orm";
import { db } from "../config/drizzle.config.connection.js";
import { sala } from "../db/schema.js";
import type {
  CreateSaleInput,
  UpdateSaleInput,
} from "../schemas/sale.schema.js";

export class SaleRepository {
  async create(data: CreateSaleInput) {
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

  async findById(id: string) {
    const [foundSale] = await db.select().from(sala).where(eq(sala.id, id));
    return foundSale || null;
  }

  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const data = await db.select().from(sala).limit(limit).offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(sala);

    return {
      data,
      meta: {
        page,
        limit,
        totalRecords: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  async update(id: string, data: UpdateSaleInput) {
    const [updatedSale] = await db
      .update(sala)
      .set({ ...data, aggiornata_il: new Date() })
      .where(eq(sala.id, id))
      .returning();

    return updatedSale || null;
  }

  async updateExistence(id: string, data: { eliminata: boolean }) {
    const [updatedSale] = await db
      .update(sala)
      .set({ ...data, aggiornata_il: new Date(), eliminata: true })
      .where(eq(sala.id, id))
      .returning();
    return updatedSale || null;
  }
}
