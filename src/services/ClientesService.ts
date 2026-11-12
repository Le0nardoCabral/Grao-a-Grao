import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError.js";
import { ClientesRepository } from "../repositories/ClientesRepository.js";
import type {
  CriarClienteInputDto,
  ClienteResponseDto,
  FiltrosListagemClientesDto,
  ListarClientesResponseDto,
} from "../dtos/ClientesDtos.js";

const repository = new ClientesRepository();

export class ClientesService {
  async criar(data: CriarClienteInputDto): Promise<ClienteResponseDto> {
    const plano = await repository.buscarPlanoAtivo(data.planoId);

    if (!plano) {
      throw new AppError("Plano ativo não encontrado.", 404, "PLAN_NOT_FOUND");
    }

    try {
      return await repository.criar({
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        dataNascimento: data.dataNascimento,
        plano: { connect: { id: data.planoId } },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(
          "Já existe um cliente com esse e-mail.",
          409,
          "CLIENT_ALREADY_EXISTS"
        );
      }

      throw error;
    }
  }

  async listar(filtros: FiltrosListagemClientesDto): Promise<ListarClientesResponseDto> {
    const skip = (filtros.page - 1) * filtros.limit;

    const { clientes, total } = await repository.listar({
      skip,
      take: filtros.limit,
      busca: filtros.busca,
      planoId: filtros.planoId,
      ativo: filtros.ativo,
    });

    return {
      clientes,
      paginacao: {
        pagina: filtros.page,
        limite: filtros.limit,
        total,
        totalPaginas: Math.ceil(total / filtros.limit),
      },
    };
  }
}
