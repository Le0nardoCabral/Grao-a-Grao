import type { Prisma } from "@prisma/client";
import { prisma } from "./PrismaClient.js";

type FiltrosListagemClientes = {
  skip: number;
  take: number;
  busca?: string;
  planoId?: number;
  ativo?: boolean;
};

export class ClientesRepository {
  buscarPlanoAtivo(planoId: number) {
    return prisma.plano.findFirst({
      where: { id: planoId, ativo: true },
    });
  }

  criar(data: Prisma.ClienteCreateInput) {
    return prisma.cliente.create({
      data,
      include: { plano: true },
    });
  }

  async listar(filtros: FiltrosListagemClientes) {
    const where: Prisma.ClienteWhereInput = {};

    if (filtros.busca) {
      where.OR = [
        { nome: { contains: filtros.busca } },
        { email: { contains: filtros.busca } },
        { telefone: { contains: filtros.busca } },
      ];
    }

    if (filtros.planoId !== undefined) {
      where.planoId = filtros.planoId;
    }

    if (filtros.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip: filtros.skip,
        take: filtros.take,
        orderBy: { nome: "asc" },
        include: { plano: true },
      }),

      prisma.cliente.count({ where }),
    ]);

    return { clientes, total };
  }
}