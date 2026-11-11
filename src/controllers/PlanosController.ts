import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { ErrorCodes } from "../errors/ErrorCodes.js";
import {
  PlanosService,
  type AtualizacaoPlano,
  type FiltrosListagemPlanos,
  type NovoPlano,
} from "../services/PlanosService.js";

const service = new PlanosService();

export class PlanosController {
  static criar: RequestHandler = async (request, response) => {
    const plano = await service.criar(request.body as NovoPlano);
    response.status(201).json(plano);
  };

  static listar: RequestHandler = async (request, response) => {
    const incluirInativos = request.query.incluirInativos === "true";
    if (incluirInativos && request.auth?.perfil !== "ADMIN") {
      throw new AppError(
        "Somente admin pode consultar planos inativos.",
        ErrorCodes.FORBIDDEN,
        "FORBIDDEN",
      );
    }

    const filtros: FiltrosListagemPlanos = {
      pagina: Number(request.query.pagina ?? 1),
      limite: Number(request.query.limite ?? 20),
      incluirInativos,
    };
    response.status(200).json(await service.listar(filtros));
  };

  static buscarPorId: RequestHandler = async (request, response) => {
    const incluirInativos = request.query.incluirInativos === "true";
    if (incluirInativos && request.auth?.perfil !== "ADMIN") {
      throw new AppError(
        "Somente admin pode consultar planos inativos.",
        ErrorCodes.FORBIDDEN,
        "FORBIDDEN",
      );
    }

    const plano = await service.buscarPorId(
      Number(request.params.id),
      incluirInativos,
    );
    response.status(200).json(plano);
  };

  static atualizar: RequestHandler = async (request, response) => {
    const plano = await service.atualizar(
      Number(request.params.id),
      request.body as AtualizacaoPlano,
    );
    response.status(200).json(plano);
  };

  static excluir: RequestHandler = async (request, response) => {
    await service.desativar(Number(request.params.id));
    response.status(204).send();
  };

  static reativar: RequestHandler = async (request, response) => {
    const plano = await service.reativar(Number(request.params.id));
    response.status(200).json(plano);
  };
}
