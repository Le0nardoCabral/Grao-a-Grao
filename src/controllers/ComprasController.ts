import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { IdempotencyKeySchema } from "../validators/CompraSchemas.js";
import { RegistrarCompraService } from "../services/RegistrarCompraService.js";
import type {
  CriarCompraInputDto,
  CriarCompraResponseDto,
  IdempotencyKeyInputDto,
} from "../dtos/ComprasDtos.js";

const service = new RegistrarCompraService();

export class ComprasController {
  static criar: RequestHandler = async (request, response) => {
    if (!request.auth) throw new AppError("Autenticação obrigatória.", 401, "UNAUTHENTICATED");
    const chave = IdempotencyKeySchema.safeParse(request.get("Idempotency-Key"));
    if (!chave.success) {
      throw new AppError("O cabeçalho Idempotency-Key é obrigatório e deve ter até 64 caracteres.", 400, "IDEMPOTENCY_KEY_REQUIRED");
    }
    const entrada = request.body as CriarCompraInputDto;
    const idempotencyKey: IdempotencyKeyInputDto = chave.data;
    const resultado = await service.executar(request.auth.userId, entrada, idempotencyKey);
    const { repetida, ...corpo } = resultado;
    const saida: CriarCompraResponseDto = corpo;
    response.status(repetida ? 200 : 201).json(saida);
  };
}
