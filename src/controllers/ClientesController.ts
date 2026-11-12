import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { ErrorMessages } from "../errors/ErrorMessages.js";
import type {
  AtualizarClienteInputDto,
  AtualizarClienteResponseDto,
  BuscarClienteResponseDto,
  ClienteResponseDto,
  CriarClienteInputDto,
  CriarClienteResponseDto,
  ReativarClienteResponseDto,
  ExtratoClienteResponseDto,
  FiltrosListagemClientesDto,
  ListarClientesResponseDto,
  TrocarPlanoInputDto,
} from "../dtos/ClientesDtos.js";
import { ExtratoService } from "../services/ExtratoService.js";
import { ClientesService } from "../services/ClientesService.js";
import { TrocarPlanoService } from "../services/TrocarPlanoService.js";

const service = new ClientesService();
const extratoService = new ExtratoService();
const trocarPlanoService = new TrocarPlanoService();

function garantirAdminParaInativos(request: Parameters<RequestHandler>[0]): void {
  if (request.query.incluirInativos === "true" && request.auth?.perfil !== "ADMIN") {
    throw new AppError(ErrorMessages.INACTIVE_CLIENTS_ADMIN_ONLY, 403, "FORBIDDEN");
  }
}

export class ClientesController {
  static criar: RequestHandler = async (request, response) => {
    const saida: CriarClienteResponseDto = await service.criar(request.body as CriarClienteInputDto);
    response.status(201).json(saida);
  };

  static listar: RequestHandler = async (request, response) => {
    garantirAdminParaInativos(request);
    const filtros: FiltrosListagemClientesDto = {
      pagina: Number(request.query.pagina ?? 1),
      limite: Number(request.query.limite ?? 20),
      incluirInativos: request.query.incluirInativos === "true",
    };
    const resultado: ListarClientesResponseDto = await service.listar(filtros);
    response.status(200).json(resultado);
  };

  static buscarPorId: RequestHandler = async (request, response) => {
    garantirAdminParaInativos(request);
    const cliente: BuscarClienteResponseDto = await service.buscarPorId(
      Number(request.params.id),
      request.query.incluirInativos === "true",
    );
    response.status(200).json(cliente);
  };

  static atualizar: RequestHandler = async (request, response) => {
    const cliente: AtualizarClienteResponseDto = await service.atualizar(
      Number(request.params.id),
      request.body as AtualizarClienteInputDto,
    );
    response.status(200).json(cliente);
  };

  static desativar: RequestHandler = async (request, response) => {
    await service.desativar(Number(request.params.id));
    response.status(204).send();
  };

  static reativar: RequestHandler = async (request, response) => {
    const cliente: ReativarClienteResponseDto = await service.reativar(Number(request.params.id));
    response.status(200).json(cliente);
  };

  static extrato: RequestHandler = async (request, response) => {
    garantirAdminParaInativos(request);
    const resultado: ExtratoClienteResponseDto = await extratoService.executar(
      Number(request.params.id),
      request.query.incluirInativos === "true",
    );
    response.status(200).json(resultado);
  };

  static trocarPlano: RequestHandler = async (request, response) => {
    const cliente: ClienteResponseDto = await trocarPlanoService.executar(
      Number(request.params.id),
      request.body as TrocarPlanoInputDto,
    );
    response.status(200).json(cliente);
  };
}
