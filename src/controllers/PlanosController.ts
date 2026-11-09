import type { RequestHandler } from "express";
import { PlanosService } from "../services/PlanosService.js";

const service = new PlanosService();

export class PlanosController {
  static listar: RequestHandler = async (request, response) => {
    const ativo =
      typeof request.query.ativo === "string"
        ? request.query.ativo === "true"
        : undefined;

    const planos = await service.listar(ativo);

    response.status(200).json(planos);
  };
}
