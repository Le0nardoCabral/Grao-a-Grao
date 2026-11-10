import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError.js";
import { PlanosRepository } from "../repositories/PlanosRepository.js";

const repository = new PlanosRepository();

export type NovoPlano = {
  nome: string;
  percentualBps: number;
  limiteCentavos: number;
  mensalidadeCentavos: number;
  minimoUsoCentavos?: number;
  dobroAniversario?: boolean;
  validadeDias?: number;
  ativo?: boolean;
};

export class PlanosService {
  async listar(ativo?: boolean) {
    return repository.listar(ativo);
  }

  async buscarPorId(id: number) {
    return repository.buscarPorId(id);
  }

  async criar(data: NovoPlano) {
    try {
      return await repository.criar(data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(
          "Já existe um plano com esse nome.",
          409,
          "PLAN_ALREADY_EXISTS"
        );
      }

      throw error;
    }
  }
}