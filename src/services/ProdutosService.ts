import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError.js";
import { ProdutosRepository } from "../repositories/ProdutosRepository.js";

const repository = new ProdutosRepository();

function mapDatabaseError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError("Já existe um produto com esse nome.", 409, "PRODUCT_ALREADY_EXISTS");
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    throw new AppError("Produto não encontrado.", 404, "PRODUCT_NOT_FOUND");
  }
  throw error;
}

export class ProdutosService {
  async criar(data: { nome: string; descricao?: string | null; precoCentavos: number }) {
    try {
      return await repository.criar(data);
    } catch (error) {
      return mapDatabaseError(error);
    }
  }

  listar(incluirInativos = false) {
    return repository.listar(incluirInativos);
  }

  async buscarPorId(id: number) {
    const produto = await repository.buscarPorId(id);
    if (!produto) throw new AppError("Produto não encontrado.", 404, "PRODUCT_NOT_FOUND");
    return produto;
  }

  async atualizar(id: number, data: { nome?: string; descricao?: string | null; precoCentavos?: number }) {
    try {
      return await repository.atualizar(id, data);
    } catch (error) {
      return mapDatabaseError(error);
    }
  }

  async excluir(id: number) {
    try {
      await repository.desativar(id);
    } catch (error) {
      return mapDatabaseError(error);
    }
  }
}
