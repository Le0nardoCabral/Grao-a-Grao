import type { RequestHandler } from "express";
import { ClientesService } from "../services/ClientesService.js";

const service = new ClientesService();

export class ClientesController {
  static criar: RequestHandler = async (request, response) => {
    const cliente = await service.criar(request.body);
    response.status(201).json(cliente);
  };
}
