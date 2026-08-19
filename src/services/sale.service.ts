import { AppError, ConflictError, NotFoundError } from '../config/app-error.js';
import { err, ok, type Result } from '../config/result.type.js';
import type { sala } from '../db/schema.js';
import type { SaleRepository } from '../repositories/sale.repository.js';
import type {
  CreateSaleInput,
  SalePaginationQuery,
  UpdateSaleInput,
} from '../schemas/sale.schema.js';

type Sala = typeof sala.$inferSelect;

export interface SalePaginate {
  data: Array<Sala>;
  meta: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export class SaleService {
  constructor(protected readonly saleRepository: SaleRepository) {}

  // 1. Creazione sala con verifica duplicati corretta
  async createSale(input: CreateSaleInput): Promise<Result<Sala, AppError>> {
    const existing = await this.saleRepository.findByName(input.nome);
    if (existing) {
      return err(new ConflictError(`Sala con nome '${input.nome}' già esistente`));
    }

    const newSale = await this.saleRepository.create(input);
    return ok(newSale);
  }

  // 2. Recupero per Nome
  async getSaleByName(name: string): Promise<Result<Sala, AppError>> {
    const sale = await this.saleRepository.findByName(name);
    if (!sale) {
      return err(new NotFoundError(`Sala con nome '${name}' non trovata`));
    }
    return ok(sale);
  }

  // 3. Recupero per ID
  async getSaleById(id: string): Promise<Result<Sala, AppError>> {
    const sale = await this.saleRepository.findById(id);
    if (!sale) {
      return err(new NotFoundError(`Sala con ID '${id}' non trovata`));
    }
    return ok(sale);
  }

  // 4. Lista paginata
  async getAllSales(query: SalePaginationQuery): Promise<Result<SalePaginate, AppError>> {
    const { page, limit } = query;
    const result = await this.saleRepository.findAll(page, limit);
    return ok(result);
  }

  // 5. Aggiornamento diretto con verifica del risultato del repository
  async updateSale(id: string, input: UpdateSaleInput): Promise<Result<Sala, AppError>> {
    // Se la sala viene rinominata, verifichiamo che il nuovo nome non sia già occupato
    if (input.nome) {
      const existingWithName = await this.saleRepository.findByName(input.nome);
      if (existingWithName && existingWithName.id !== id) {
        return err(new ConflictError(`Un'altra sala con nome '${input.nome}' esiste già`));
      }
    }

    const updatedSale = await this.saleRepository.update(id, input);
    if (!updatedSale) {
      return err(new NotFoundError(`Impossibile aggiornare: Sala con ID '${id}' non trovata`));
    }

    return ok(updatedSale);
  }

  // 6. Cancellazione logica (Soft Delete)
  async deleteSale(id: string): Promise<Result<Sala, AppError>> {
    const deletedSale = await this.saleRepository.updateExistence(id);
    if (!deletedSale) {
      return err(new NotFoundError(`Impossibile eliminare: Sala con ID '${id}' non trovata`));
    }

    return ok(deletedSale);
  }
}
