import { Prisma } from "@prisma/client";
import { prisma } from "./PrismaClient.js";

const clienteComPlano = { include: { plano: { select: { id: true, nome: true } } } } as const;
type ClienteComPlano = Prisma.ClienteGetPayload<typeof clienteComPlano>;

type FiltrosListagemClientes = {
  skip: number;
  take: number;
  incluirInativos: boolean;
};

export type ResultadoCriacaoCliente =
  | { tipo: "PLANO_NAO_ENCONTRADO" }
  | { tipo: "PLANO_INATIVO" }
  | { tipo: "SUCESSO"; cliente: ClienteComPlano };

export type ResultadoReativacaoCliente =
  | { tipo: "CLIENTE_NAO_ENCONTRADO" }
  | { tipo: "CLIENTE_JA_ATIVO" }
  | { tipo: "PLANO_NAO_ENCONTRADO" }
  | { tipo: "PLANO_INATIVO" }
  | { tipo: "SUCESSO"; cliente: ClienteComPlano };

export class ClientesRepository {
  buscarPorId(id: number, incluirInativos = false): Promise<ClienteComPlano | null> {
    return prisma.cliente.findFirst({
      where: incluirInativos ? { id } : { id, ativo: true },
      ...clienteComPlano,
    });
  }

  async criar(data: Prisma.ClienteUncheckedCreateInput): Promise<ResultadoCriacaoCliente> {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM Plano WHERE id = ${data.planoId} FOR UPDATE`,
      );
      const plano = await transaction.plano.findUnique({ where: { id: data.planoId } });
      if (!plano) return { tipo: "PLANO_NAO_ENCONTRADO" };
      if (!plano.ativo) return { tipo: "PLANO_INATIVO" };

      const cliente = await transaction.cliente.create({
        data,
        ...clienteComPlano,
      });
      return { tipo: "SUCESSO", cliente };
    });
  }

  async atualizar(id: number, data: Prisma.ClienteUpdateInput): Promise<ClienteComPlano | null> {
    const resultado = await prisma.cliente.updateMany({
      where: { id, ativo: true },
      data,
    });
    if (resultado.count === 0) return null;
    return this.buscarPorId(id);
  }

  async desativar(id: number): Promise<boolean> {
    const resultado = await prisma.cliente.updateMany({
      where: { id, ativo: true },
      data: { ativo: false },
    });
    return resultado.count > 0;
  }

  async reativar(id: number): Promise<
    | { tipo: "CLIENTE_NAO_ENCONTRADO" }
    | { tipo: "CLIENTE_JA_ATIVO" }
    | { tipo: "PLANO_NAO_ENCONTRADO" }
    | { tipo: "PLANO_INATIVO" }
    | { tipo: "SUCESSO"; cliente: ClienteComPlano }
  > {
    for (let tentativa = 0; tentativa < 3; tentativa += 1) {
      const atual = await prisma.cliente.findUnique({ where: { id } });
      if (!atual) return { tipo: "CLIENTE_NAO_ENCONTRADO" };
      if (atual.ativo) return { tipo: "CLIENTE_JA_ATIVO" };

      const resultado = await prisma.$transaction(async (transaction) => {
        await transaction.$queryRaw(
          Prisma.sql`SELECT id FROM Plano WHERE id = ${atual.planoId} FOR UPDATE`,
        );
        const plano = await transaction.plano.findUnique({ where: { id: atual.planoId } });
        if (!plano) return { tipo: "PLANO_NAO_ENCONTRADO" } as const;

        await transaction.$queryRaw(
          Prisma.sql`SELECT id FROM Cliente WHERE id = ${id} FOR UPDATE`,
        );
        const cliente = await transaction.cliente.findUnique({ where: { id } });
        if (!cliente) return { tipo: "CLIENTE_NAO_ENCONTRADO" } as const;
        if (cliente.ativo) return { tipo: "CLIENTE_JA_ATIVO" } as const;
        if (cliente.planoId !== atual.planoId) return { tipo: "PLANO_ALTERADO" } as const;
        if (!plano.ativo) return { tipo: "PLANO_INATIVO" } as const;

        const reativado = await transaction.cliente.update({
          where: { id },
          data: { ativo: true },
          ...clienteComPlano,
        });
        return { tipo: "SUCESSO", cliente: reativado } as const;
      });

      if (resultado.tipo !== "PLANO_ALTERADO") return resultado;
    }
    throw new Error("Não foi possível confirmar o plano atual do cliente.");
  }

  async listar(filtros: FiltrosListagemClientes): Promise<{ dados: ClienteComPlano[]; total: number }> {
    const where: Prisma.ClienteWhereInput = filtros.incluirInativos ? {} : { ativo: true };
    const [dados, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip: filtros.skip,
        take: filtros.take,
        orderBy: [{ nome: "asc" }, { id: "asc" }],
        ...clienteComPlano,
      }),
      prisma.cliente.count({ where }),
    ]);
    return { dados, total };
  }

}
