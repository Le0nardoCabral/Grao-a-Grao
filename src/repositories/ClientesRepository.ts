import type { Prisma } from "@prisma/client";
import { prisma } from "./PrismaClient.js";

export class ClientesRepository {
  buscarPlanoAtivo(planoId: number) {
    return prisma.plano.findFirst({ where: { id: planoId, ativo: true } });
  }

  criar(data: Prisma.ClienteCreateInput) {
    return prisma.cliente.create({ data, include: { plano: true } });
  }
}
