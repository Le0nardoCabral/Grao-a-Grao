import { AppError } from "../errors/AppError.js";
import { ErrorMessages } from "../errors/ErrorMessages.js";
import { TrocarPlanoRepository } from "../repositories/TrocarPlanoRepository.js";
import type { ClienteResponseDto, TrocarPlanoInputDto } from "../dtos/ClientesDtos.js";

export class TrocarPlanoService {
  constructor(private readonly repository = new TrocarPlanoRepository()) {}

  async executar(clienteId: number, entrada: TrocarPlanoInputDto): Promise<ClienteResponseDto> {
    const resultado = await this.repository.executar(clienteId, entrada.planoId);
    if (resultado.tipo === "CLIENTE_NAO_ENCONTRADO") throw new AppError(ErrorMessages.CLIENT_NOT_FOUND, 404, "CLIENT_NOT_FOUND");
    if (resultado.tipo === "CLIENTE_INATIVO") throw new AppError(ErrorMessages.CLIENT_INACTIVE, 409, "CLIENT_INACTIVE");
    if (resultado.tipo === "PLANO_NAO_ENCONTRADO") throw new AppError(ErrorMessages.PLAN_NOT_FOUND, 404, "PLAN_NOT_FOUND");
    if (resultado.tipo === "PLANO_INATIVO") throw new AppError(ErrorMessages.PLAN_REFERENCE_INACTIVE, 409, "PLAN_INACTIVE");
    return resultado.cliente;
  }
}
