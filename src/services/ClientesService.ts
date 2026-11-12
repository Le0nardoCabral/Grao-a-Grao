import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError.js";
import { ErrorMessages } from "../errors/ErrorMessages.js";
import type {
  AtualizarClienteInputDto,
  AtualizarClienteResponseDto,
  BuscarClienteResponseDto,
  ClienteResponseDto,
  CriarClienteInputDto,
  CriarClienteResponseDto,
  DesativarClienteResponseDto,
  FiltrosListagemClientesDto,
  ListarClientesResponseDto,
  ReativarClienteResponseDto,
} from "../dtos/ClientesDtos.js";
import { ClientesRepository } from "../repositories/ClientesRepository.js";

const repository = new ClientesRepository();

function mapearCliente(cliente: {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  dataNascimento: Date | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  plano: { id: number; nome: string };
}): ClienteResponseDto {
  return {
    id: cliente.id,
    nome: cliente.nome,
    email: cliente.email,
    telefone: cliente.telefone,
    dataNascimento: cliente.dataNascimento?.toISOString().slice(0, 10) ?? null,
    plano: cliente.plano,
    ativo: cliente.ativo,
    criadoEm: cliente.criadoEm,
    atualizadoEm: cliente.atualizadoEm,
  };
}

function tratarDuplicidade(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError(ErrorMessages.CLIENT_ALREADY_EXISTS, 409, "CLIENT_ALREADY_EXISTS");
  }
  throw error;
}

export class ClientesService {
  async criar(data: CriarClienteInputDto): Promise<CriarClienteResponseDto> {
    try {
      const resultado = await repository.criar({
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        dataNascimento: data.dataNascimento,
        planoId: data.planoId,
      });
      if (resultado.tipo === "PLANO_NAO_ENCONTRADO") {
        throw new AppError(ErrorMessages.PLAN_NOT_FOUND, 404, "PLAN_NOT_FOUND");
      }
      if (resultado.tipo === "PLANO_INATIVO") {
        throw new AppError(ErrorMessages.PLAN_REFERENCE_INACTIVE, 409, "PLAN_INACTIVE");
      }
      return mapearCliente(resultado.cliente);
    } catch (error) {
      return tratarDuplicidade(error);
    }
  }

  async buscarPorId(id: number, incluirInativos: boolean): Promise<BuscarClienteResponseDto> {
    const cliente = await repository.buscarPorId(id, incluirInativos);
    if (!cliente) throw new AppError(ErrorMessages.CLIENT_NOT_FOUND, 404, "CLIENT_NOT_FOUND");
    return mapearCliente(cliente);
  }

  async atualizar(id: number, data: AtualizarClienteInputDto): Promise<AtualizarClienteResponseDto> {
    try {
      const cliente = await repository.atualizar(id, data);
      if (!cliente) throw new AppError(ErrorMessages.CLIENT_NOT_FOUND, 404, "CLIENT_NOT_FOUND");
      return mapearCliente(cliente);
    } catch (error) {
      return tratarDuplicidade(error);
    }
  }

  async desativar(id: number): Promise<DesativarClienteResponseDto> {
    if (!(await repository.desativar(id))) {
      throw new AppError(ErrorMessages.CLIENT_NOT_FOUND, 404, "CLIENT_NOT_FOUND");
    }
  }

  async reativar(id: number): Promise<ReativarClienteResponseDto> {
    const resultado = await repository.reativar(id);
    if (resultado.tipo === "CLIENTE_NAO_ENCONTRADO") {
      throw new AppError(ErrorMessages.CLIENT_NOT_FOUND, 404, "CLIENT_NOT_FOUND");
    }
    if (resultado.tipo === "CLIENTE_JA_ATIVO") {
      throw new AppError(ErrorMessages.CLIENT_ALREADY_ACTIVE, 409, "ALREADY_ACTIVE");
    }
    if (resultado.tipo === "PLANO_NAO_ENCONTRADO") {
      throw new AppError(ErrorMessages.PLAN_NOT_FOUND, 404, "PLAN_NOT_FOUND");
    }
    if (resultado.tipo === "PLANO_INATIVO") {
      throw new AppError(ErrorMessages.PLAN_CURRENTLY_INACTIVE, 409, "PLAN_INACTIVE");
    }
    return mapearCliente(resultado.cliente);
  }

  async listar(filtros: FiltrosListagemClientesDto): Promise<ListarClientesResponseDto> {
    const { dados, total } = await repository.listar({
      skip: (filtros.pagina - 1) * filtros.limite,
      take: filtros.limite,
      incluirInativos: filtros.incluirInativos,
    });
    return {
      dados: dados.map(mapearCliente),
      pagina: filtros.pagina,
      limite: filtros.limite,
      total,
    };
  }
}
