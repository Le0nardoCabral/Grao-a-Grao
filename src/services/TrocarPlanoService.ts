import { AppError } from "../errors/AppError.js";
import { TrocarPlanoRepository } from "../repositories/TrocarPlanoRepository.js";

export class TrocarPlanoService {
  constructor(private readonly repository = new TrocarPlanoRepository()) {}

  async executar(clienteId: number, planoId: number) {
    const resultado = await this.repository.executar(clienteId, planoId);
    if (resultado.tipo === "CLIENTE_NAO_ENCONTRADO") throw new AppError("Cliente não encontrado.", 404, "CLIENT_NOT_FOUND");
    if (resultado.tipo === "CLIENTE_INATIVO") throw new AppError("Cliente inativo.", 409, "CLIENT_INACTIVE");
    if (resultado.tipo === "PLANO_NAO_ENCONTRADO") throw new AppError("Plano não encontrado.", 404, "PLAN_NOT_FOUND");
    if (resultado.tipo === "PLANO_INATIVO") throw new AppError("O plano informado está inativo.", 409, "PLAN_INACTIVE");
    return resultado.cliente;
  }
}
