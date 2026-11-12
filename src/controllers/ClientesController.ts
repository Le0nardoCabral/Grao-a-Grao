import type { RequestHandler } from "express";
import {
  ClientesService,
} from "../services/ClientesService.js";
import { AppError } from "../errors/AppError.js";
import { ErrorMessages } from "../errors/ErrorMessages.js";
import { ExtratoService } from "../services/ExtratoService.js";
import { TrocarPlanoService } from "../services/TrocarPlanoService.js";
import type {
  ClienteResponseDto,
  CriarClienteInputDto,
  ExtratoClienteResponseDto,
  FiltrosListagemClientesDto,
  ListarClientesResponseDto,
  TrocarPlanoInputDto,
} from "../dtos/ClientesDtos.js";

const service = new ClientesService();
const extratoService = new ExtratoService();
const trocarPlanoService = new TrocarPlanoService();

export class ClientesController {
  static criar: RequestHandler = async (request, response) => {
    const entrada = request.body as CriarClienteInputDto;
    const saida: ClienteResponseDto = await service.criar(entrada);
    response.status(201).json(saida);
  };

  static listar: RequestHandler = async (request, response) => {
    const filtros: FiltrosListagemClientesDto = {
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

    const resultado: ListarClientesResponseDto = await service.listar(filtros);

    response.status(200).json(resultado);
  };

  static extrato: RequestHandler = async (request, response) => {
    const incluirInativos = request.query.incluirInativos === "true";
    if (incluirInativos && request.auth?.perfil !== "ADMIN") {
      throw new AppError(ErrorMessages.INACTIVE_CLIENTS_ADMIN_ONLY, 403, "FORBIDDEN");
    }

    const resultado: ExtratoClienteResponseDto = await extratoService.executar(
      Number(request.params.id),
      incluirInativos,
    );
    response.status(200).json(resultado);
  };

  static trocarPlano: RequestHandler = async (request, response) => {
    const entrada = request.body as TrocarPlanoInputDto;
    const saida: ClienteResponseDto = await trocarPlanoService.executar(Number(request.params.id), entrada);
    response.status(200).json(saida);
  };
}
