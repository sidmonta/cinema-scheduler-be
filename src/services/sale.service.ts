import { ConflictError, NotFoundError } from "../config/app-error.js";
import { err, ok } from "../config/result.type.js";
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
    if (!(await this.saleRepository.findByName(input.nome))) {
      return err(
        new ConflictError("Sala con nome: '${input.nome} già esistente"),
      );
    }
    return ok(await this.saleRepository.create(input));
  }

  async getSaleByName(name: string) {
    const sale = await this.saleRepository.findByName(name);
    if (!sale) {
      return err(new NotFoundError("Sala con nome: '${name}' non trovata"));
    }
    return ok(sale);
  }

  async getSaleById(id: string) {
    const sale = await this.saleRepository.findById(id);
    if (!sale) {
      return err(new NotFoundError(`Sale con ID '${id}' non trovato`));
    }
    return ok(sale);
  }

  async getAllSales(query: SalePaginationQuery) {
    const { page, limit } = query;
    return ok(await this.saleRepository.findAll(page, limit));
  }

  async updateSale(id: string, input: UpdateSaleInput) {
    // Verifica prima l'esistenza
    const sale = await this.getSaleById(id);
    if (!sale) {
      return err(new NotFoundError("Sala non trovata"));
    }
    return ok(await this.saleRepository.update(id, input));
  }

  async deleteSale(id: string, input: UpdateSaleExistenceInput) {
    // Verifica prima l'esistenza
    await this.getSaleById(id);
    return ok(await this.saleRepository.updateExistence(id, input));
  }
}
