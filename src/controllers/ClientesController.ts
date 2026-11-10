import type { RequestHandler } from "express";
import {
  ClientesService,
  type FiltrosListagemClientes,
} from "../services/ClientesService.js";
import { AppError } from "../errors/AppError.js";
import { ExtratoService } from "../services/ExtratoService.js";
import { TrocarPlanoService } from "../services/TrocarPlanoService.js";

const service = new ClientesService();
const extratoService = new ExtratoService();
const trocarPlanoService = new TrocarPlanoService();

export class ClientesController {
  static criar: RequestHandler = async (request, response) => {
    const cliente = await service.criar(request.body);
    response.status(201).json(cliente);
  };

  static listar: RequestHandler = async (request, response) => {
    const filtros: FiltrosListagemClientes = {
      page: Number(request.query.page ?? 1),
      limit: Number(request.query.limit ?? 10),

      busca:
        typeof request.query.busca === "string"
          ? request.query.busca
          : undefined,

      planoId:
        request.query.planoId !== undefined
          ? Number(request.query.planoId)
          : undefined,

      ativo:
        typeof request.query.ativo === "string"
          ? request.query.ativo === "true"
          : undefined,
    };

    const resultado = await service.listar(filtros);

    response.status(200).json(resultado);
  };

  static extrato: RequestHandler = async (request, response) => {
    const incluirInativos = request.query.incluirInativos === "true";
    if (incluirInativos && request.auth?.perfil !== "ADMIN") {
      throw new AppError("Somente admin pode consultar clientes inativos.", 403, "FORBIDDEN");
    }

    const resultado = await extratoService.executar(
      Number(request.params.id),
      incluirInativos,
    );
    response.status(200).json(resultado);
  };

  static trocarPlano: RequestHandler = async (request, response) => {
    const cliente = await trocarPlanoService.executar(Number(request.params.id), request.body.planoId);
    response.status(200).json(cliente);
  };
}
