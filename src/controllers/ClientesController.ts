import type { RequestHandler } from "express";
import {
  ClientesService,
  type FiltrosListagemClientes,
} from "../services/ClientesService.js";

const service = new ClientesService();

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
}