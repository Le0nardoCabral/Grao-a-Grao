import { PlanosRepository } from "../repositories/PlanosRepository.js";

const repository = new PlanosRepository();

export class PlanosService {
  async listar(ativo?: boolean) {
    return repository.listar(ativo);
  }

  async buscarPorId(id: number) {
    return repository.buscarPorId(id);
  }
}