import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError.js";
import { ErrorMessages } from "../errors/ErrorMessages.js";
import { ProdutosRepository } from "../repositories/ProdutosRepository.js";
import type {
  AtualizarProdutoInputDto,
  CriarProdutoInputDto,
  FiltrosListagemProdutosDto,
  ListarProdutosResponseDto,
  ProdutoResponseDto,
} from "../dtos/ProdutosDtos.js";

const repository = new ProdutosRepository();

function mapDatabaseError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError(ErrorMessages.PRODUCT_ALREADY_EXISTS, 409, "PRODUCT_ALREADY_EXISTS");
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    throw new AppError(ErrorMessages.PRODUCT_NOT_FOUND, 404, "PRODUCT_NOT_FOUND");
  }
  throw error;
}

export class ProdutosService {
  async criar(data: CriarProdutoInputDto): Promise<ProdutoResponseDto> {
    try {
      return await repository.criar(data);
    } catch (error) {
      return mapDatabaseError(error);
    }
  }

  listar(filtros: FiltrosListagemProdutosDto): Promise<ListarProdutosResponseDto> {
    return repository.listar(filtros.incluirInativos);
  }

  async buscarPorId(id: number): Promise<ProdutoResponseDto> {
    const produto = await repository.buscarPorId(id);
    if (!produto) throw new AppError(ErrorMessages.PRODUCT_NOT_FOUND, 404, "PRODUCT_NOT_FOUND");
    return produto;
  }

  async atualizar(id: number, data: AtualizarProdutoInputDto): Promise<ProdutoResponseDto> {
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

  async reativar(id: number): Promise<ProdutoResponseDto> {
    const produto = await repository.buscarPorId(id);
    if (!produto) throw new AppError(ErrorMessages.PRODUCT_NOT_FOUND, 404, "PRODUCT_NOT_FOUND");
    if (produto.ativo) throw new AppError(ErrorMessages.PRODUCT_ALREADY_ACTIVE, 409, "ALREADY_ACTIVE");
    await repository.reativar(id);
    return (await repository.buscarPorId(id))!;
  }
}
