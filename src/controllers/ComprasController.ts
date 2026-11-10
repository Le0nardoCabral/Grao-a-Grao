import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { IdempotencyKeySchema } from "../validators/CompraSchemas.js";
import { RegistrarCompraService } from "../services/RegistrarCompraService.js";

const service = new RegistrarCompraService();

export class ComprasController {
  static criar: RequestHandler = async (request, response) => {
    if (!request.auth) throw new AppError("Autenticação obrigatória.", 401, "UNAUTHENTICATED");
    const chave = IdempotencyKeySchema.safeParse(request.get("Idempotency-Key"));
    if (!chave.success) {
      throw new AppError("O cabeçalho Idempotency-Key é obrigatório e deve ter até 64 caracteres.", 400, "IDEMPOTENCY_KEY_REQUIRED");
    }
    const resultado = await service.executar(request.auth.userId, request.body, chave.data);
    const { repetida, ...corpo } = resultado;
    response.status(repetida ? 200 : 201).json(corpo);
  };
}
