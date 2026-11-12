import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError.js";
import { ErrorCodes } from "../errors/ErrorCodes.js";
import { ErrorMessages } from "../errors/ErrorMessages.js";
import { PlanosRepository } from "../repositories/PlanosRepository.js";
import type {
  AtualizacaoPlanoInputDto,
  FiltrosListagemPlanosDto,
  ListarPlanosResponseDto,
  NovoPlanoInputDto,
  PlanoResponseDto,
  ReceitaMensalResponseDto,
} from "../dtos/PlanosDtos.js";

const repository = new PlanosRepository();

export type { AtualizacaoPlanoInputDto, NovoPlanoInputDto } from "../dtos/PlanosDtos.js";

function tratarErroBanco(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new AppError(
        ErrorMessages.PLAN_ALREADY_EXISTS,
        ErrorCodes.PLAN_ALREADY_EXISTS,
        "PLAN_ALREADY_EXISTS",
      );
    }
    if (error.code === "P2025") {
      throw new AppError(
        ErrorMessages.PLAN_NOT_FOUND,
        ErrorCodes.PLAN_NOT_FOUND,
        "PLAN_NOT_FOUND",
      );
    }
  }

  throw error;
}

export class PlanosService {
  async receitaMensal(): Promise<ReceitaMensalResponseDto> {
    const planosBase = await repository.receitaMensal();
    let totalClientesAtivos = 0;
    let receitaMensalTotal = 0n;
    const planos = planosBase.map((plano) => {
      const receitaMensal = BigInt(plano.clientesAtivos) * BigInt(plano.mensalidadeCentavos);
      totalClientesAtivos += plano.clientesAtivos;
      receitaMensalTotal += receitaMensal;
      if (receitaMensal > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new RangeError("A receita mensal excede o limite numérico da resposta.");
      }
      return { ...plano, receitaMensalCentavos: Number(receitaMensal) };
    });

    if (receitaMensalTotal > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new RangeError("A receita mensal excede o limite numérico da resposta.");
    }
    return {
      planos,
      totalClientesAtivos,
      receitaMensalTotalCentavos: Number(receitaMensalTotal),
    };
  }

  async listar(filtros: FiltrosListagemPlanosDto): Promise<ListarPlanosResponseDto> {
    const { dados, total } = await repository.listar({
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
      incluirInativos: filtros.incluirInativos,
    });

    return {
      dados,
      pagina: filtros.pagina,
      limite: filtros.limite,
      total,
    };
  }

  async buscarPorId(id: number, incluirInativos = false): Promise<PlanoResponseDto> {
    const plano = await repository.buscarPorId(id, incluirInativos);
    if (!plano) {
      throw new AppError(
        ErrorMessages.PLAN_NOT_FOUND,
        ErrorCodes.PLAN_NOT_FOUND,
        "PLAN_NOT_FOUND",
      );
    }
    return plano;
  }

  async criar(data: NovoPlanoInputDto): Promise<PlanoResponseDto> {
    try {
      return await repository.criar(data);
    } catch (error) {
      return tratarErroBanco(error);
    }
  }

  async atualizar(id: number, data: AtualizacaoPlanoInputDto): Promise<PlanoResponseDto> {
    const plano = await this.buscarPorId(id);
    const limiteCentavos = data.limiteCentavos ?? plano.limiteCentavos;
    const minimoUsoCentavos = data.minimoUsoCentavos ?? plano.minimoUsoCentavos;

    if (minimoUsoCentavos > limiteCentavos) {
      throw new AppError(
        ErrorMessages.PLAN_MINIMUM_EXCEEDS_LIMIT,
        ErrorCodes.VALIDATION_ERROR,
        "VALIDATION_ERROR",
        [{ campo: "minimoUsoCentavos", mensagem: ErrorMessages.PLAN_MINIMUM_VALIDATION_DETAIL }],
      );
    }

    try {
      return await repository.atualizar(id, data);
    } catch (error) {
      return tratarErroBanco(error);
    }
  }

  async desativar(id: number): Promise<void> {
    const resultado = await repository.desativar(id);
    if (resultado.tipo === "NAO_ENCONTRADO") {
      throw new AppError(
        ErrorMessages.PLAN_NOT_FOUND,
        ErrorCodes.PLAN_NOT_FOUND,
        "PLAN_NOT_FOUND",
      );
    }
    if (resultado.tipo === "CLIENTES_ATIVOS") {
      throw new AppError(
        ErrorMessages.PLAN_HAS_ACTIVE_CLIENTS,
        ErrorCodes.PLAN_HAS_ACTIVE_CLIENTS,
        "PLAN_HAS_ACTIVE_CLIENTS",
      );
    }
  }

  async reativar(id: number): Promise<PlanoResponseDto> {
    const resultado = await repository.reativar(id);
    if (resultado.tipo === "NAO_ENCONTRADO") {
      throw new AppError(
        ErrorMessages.PLAN_NOT_FOUND,
        ErrorCodes.PLAN_NOT_FOUND,
        "PLAN_NOT_FOUND",
      );
    }
    if (resultado.tipo === "JA_ATIVO") {
      throw new AppError(
        ErrorMessages.PLAN_ALREADY_ACTIVE,
        ErrorCodes.ALREADY_ACTIVE,
        "ALREADY_ACTIVE",
      );
    }
    return resultado.plano;
  }
}
