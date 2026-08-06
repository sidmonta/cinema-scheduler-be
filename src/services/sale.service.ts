import { NotFoundError } from "../config/app-error.js";
import type { SaleRepository } from "../repositories/sale.repository.js";
import type {
  CreateSaleInput,
  SalePaginationQuery,
  UpdateSaleExistenceInput,
  UpdateSaleInput,
} from "../schemas/sale.schema.js";

export class SaleService {
  constructor(private readonly saleRepository: SaleRepository) {}

  async createSale(input: CreateSaleInput) {
    return await this.saleRepository.create(input);
  }

  async getSaleById(id: string) {
    const sale = await this.saleRepository.findById(id);
    if (!sale) {
      throw new NotFoundError(`Sale con ID '${id}' non trovato`);
    }
    return sale;
  }

  async getAllSales(query: SalePaginationQuery) {
    const { page, limit } = query;
    return await this.saleRepository.findAll(page, limit);
  }

  async updateSale(id: string, input: UpdateSaleInput) {
    // Verifica prima l'esistenza
    await this.getSaleById(id);
    return await this.saleRepository.update(id, input);
  }

  async deleteSale(id: string, input: UpdateSaleExistenceInput) {
    // Verifica prima l'esistenza
    await this.getSaleById(id);
    await this.saleRepository.updateExistence(id, input);
  }
}
