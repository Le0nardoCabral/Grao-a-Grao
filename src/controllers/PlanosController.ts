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

  static buscarPorId: RequestHandler = async (request, response) => {
    const id = Number(request.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      response.status(400).json({
        mensagem: "ID inválido.",
      });
      return;
    }

    const plano = await service.buscarPorId(id);

    if (!plano) {
      response.status(404).json({
        mensagem: "Plano não encontrado.",
      });
      return;
    }

    response.status(200).json(plano);
  };
}