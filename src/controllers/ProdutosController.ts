import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { ProdutosService } from "../services/ProdutosService.js";
import type {
  AtualizarProdutoInputDto,
  CriarProdutoInputDto,
  FiltrosListagemProdutosDto,
  ListarProdutosResponseDto,
  ProdutoResponseDto,
} from "../dtos/ProdutosDtos.js";

const service = new ProdutosService();

export class ProdutosController {
  static criar: RequestHandler = async (request, response) => {
    const produto: ProdutoResponseDto = await service.criar(request.body as CriarProdutoInputDto);
    response.status(201).json(produto);
  };

  static listar: RequestHandler = async (request, response) => {
    const filtros: FiltrosListagemProdutosDto = {
      incluirInativos: request.query.incluirInativos === "true",
    };
    if (filtros.incluirInativos && request.auth?.perfil !== "ADMIN") {
      throw new AppError("Somente admin pode consultar produtos inativos.", 403, "FORBIDDEN");
    }
    const produtos: ListarProdutosResponseDto = await service.listar(filtros);
    response.status(200).json(produtos);
  };

  static buscarPorId: RequestHandler = async (request, response) => {
    const produto: ProdutoResponseDto = await service.buscarPorId(Number(request.params.id));
    response.status(200).json(produto);
  };

  static atualizar: RequestHandler = async (request, response) => {
    const produto: ProdutoResponseDto = await service.atualizar(Number(request.params.id), request.body as AtualizarProdutoInputDto);
    response.status(200).json(produto);
  };

  static excluir: RequestHandler = async (request, response) => {
    await service.excluir(Number(request.params.id));
    response.status(204).send();
  };
}
