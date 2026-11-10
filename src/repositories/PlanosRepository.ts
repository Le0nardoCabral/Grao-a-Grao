import type { Prisma } from "@prisma/client";
import { prisma } from "./PrismaClient.js";

export class PlanosRepository {
  async listar(ativo?: boolean) {
    const where: Prisma.PlanoWhereInput = {};

    if (ativo !== undefined) {
      where.ativo = ativo;
    }

    return prisma.plano.findMany({
      where,
      orderBy: { nome: "asc" },
    });
  }

  async buscarPorId(id: number) {
    return prisma.plano.findUnique({
      where: { id },
    });
  }
} 