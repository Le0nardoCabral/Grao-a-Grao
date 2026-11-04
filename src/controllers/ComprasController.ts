import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { RegistrarCompraService } from "../services/RegistrarCompraService.js";

const service = new RegistrarCompraService();

export class ComprasController {
  static criar: RequestHandler = async (request, response) => {
    if (!request.auth) throw new AppError("Autenticação obrigatória.", 401, "UNAUTHENTICATED");
    const resultado = await service.executar(request.auth.userId, request.body);
    response.status(201).json(resultado);
  };
}
