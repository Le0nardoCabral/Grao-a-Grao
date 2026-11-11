import { Prisma, type Plano } from "@prisma/client";
import { prisma } from "./PrismaClient.js";

type FiltrosListagemPlanos = {
  skip: number;
  take: number;
  incluirInativos: boolean;
};

export type ResultadoDesativacaoPlano =
  | { tipo: "NAO_ENCONTRADO" }
  | { tipo: "CLIENTES_ATIVOS" }
  | { tipo: "SUCESSO" };

export type ResultadoReativacaoPlano =
  | { tipo: "NAO_ENCONTRADO" }
  | { tipo: "JA_ATIVO" }
  | { tipo: "SUCESSO"; plano: Plano };

export class PlanosRepository {
  async listar(filtros: FiltrosListagemPlanos) {
    const where: Prisma.PlanoWhereInput = filtros.incluirInativos
      ? {}
      : { ativo: true };

    const [dados, total] = await Promise.all([
      prisma.plano.findMany({
        where,
        skip: filtros.skip,
        take: filtros.take,
        orderBy: [{ nome: "asc" }, { id: "asc" }],
      }),
      prisma.plano.count({ where }),
    ]);

    return { dados, total };
  }

  buscarPorId(id: number, incluirInativos = false) {
    return prisma.plano.findFirst({
      where: incluirInativos ? { id } : { id, ativo: true },
    });
  }

  criar(data: Prisma.PlanoCreateInput) {
    return prisma.plano.create({ data });
  }

  atualizar(id: number, data: Prisma.PlanoUpdateInput) {
    return prisma.plano.update({ where: { id, ativo: true }, data });
  }

  async desativar(id: number): Promise<ResultadoDesativacaoPlano> {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM Plano WHERE id = ${id} FOR UPDATE`,
      );

      const plano = await transaction.plano.findUnique({ where: { id } });
      if (!plano || !plano.ativo) return { tipo: "NAO_ENCONTRADO" };

      const clientesAtivos = await transaction.cliente.count({
        where: { planoId: id, ativo: true },
      });
      if (clientesAtivos > 0) return { tipo: "CLIENTES_ATIVOS" };

      await transaction.plano.update({
        where: { id },
        data: { ativo: false },
      });
      return { tipo: "SUCESSO" };
    });
  }

  async reativar(id: number): Promise<ResultadoReativacaoPlano> {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(
        Prisma.sql`SELECT id FROM Plano WHERE id = ${id} FOR UPDATE`,
      );

      const plano = await transaction.plano.findUnique({ where: { id } });
      if (!plano) return { tipo: "NAO_ENCONTRADO" };
      if (plano.ativo) return { tipo: "JA_ATIVO" };

      const atualizado = await transaction.plano.update({
        where: { id },
        data: { ativo: true },
      });
      return { tipo: "SUCESSO", plano: atualizado };
    });
  }
}
