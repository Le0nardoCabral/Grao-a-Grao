import { Prisma, type Plano, type Cliente } from "@prisma/client";
import { prisma } from "./PrismaClient.js";

type ResultadoTroca =
  | { tipo: "CLIENTE_NAO_ENCONTRADO" }
  | { tipo: "CLIENTE_INATIVO" }
  | { tipo: "PLANO_NAO_ENCONTRADO" }
  | { tipo: "PLANO_INATIVO" }
  | { tipo: "SUCESSO"; cliente: Cliente & { plano: Plano }; alterado: boolean };

export class TrocarPlanoRepository {
  async executar(clienteId: number, planoId: number): Promise<ResultadoTroca> {
    return prisma.$transaction(async (transaction) => {
      const clienteExistente = await transaction.cliente.findUnique({ where: { id: clienteId } });
      if (!clienteExistente) return { tipo: "CLIENTE_NAO_ENCONTRADO" };

      await transaction.$queryRaw(Prisma.sql`SELECT id FROM Plano WHERE id = ${planoId} FOR UPDATE`);
      const plano = await transaction.plano.findUnique({ where: { id: planoId } });
      if (!plano) return { tipo: "PLANO_NAO_ENCONTRADO" };

      await transaction.$queryRaw(Prisma.sql`SELECT id FROM Cliente WHERE id = ${clienteId} FOR UPDATE`);
      const cliente = await transaction.cliente.findUnique({ where: { id: clienteId } });
      if (!cliente) return { tipo: "CLIENTE_NAO_ENCONTRADO" };
      if (!cliente.ativo) return { tipo: "CLIENTE_INATIVO" };
      if (!plano.ativo) return { tipo: "PLANO_INATIVO" };

      const atualizado = cliente.planoId === planoId
        ? await transaction.cliente.findUniqueOrThrow({ where: { id: clienteId }, include: { plano: true } })
        : await transaction.cliente.update({ where: { id: clienteId }, data: { planoId }, include: { plano: true } });
      return { tipo: "SUCESSO", cliente: atualizado, alterado: cliente.planoId !== planoId };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5_000, timeout: 10_000 });
  }
}
