import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { ProdutosService } from "../services/ProdutosService.js";

const service = new ProdutosService();

export class ProdutosController {
  static criar: RequestHandler = async (request, response) => {
    const produto = await service.criar(request.body);
    response.status(201).json(produto);
  };

  static listar: RequestHandler = async (request, response) => {
    const incluirInativos = request.query.incluirInativos === "true";
    if (incluirInativos && request.auth?.perfil !== "ADMIN") {
      throw new AppError("Somente admin pode consultar produtos inativos.", 403, "FORBIDDEN");
    }
    response.status(200).json(await service.listar(incluirInativos));
  };

  static buscarPorId: RequestHandler = async (request, response) => {
    response.status(200).json(await service.buscarPorId(Number(request.params.id)));
  };

  static atualizar: RequestHandler = async (request, response) => {
    response.status(200).json(await service.atualizar(Number(request.params.id), request.body));
  };

  static excluir: RequestHandler = async (request, response) => {
    await service.excluir(Number(request.params.id));
    response.status(204).send();
  };
}
