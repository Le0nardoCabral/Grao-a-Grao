import { Prisma, StatusLote, type PrismaClient } from "@prisma/client";
import { prisma } from "./PrismaClient.js";

export class ComprasRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  transaction<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>) {
    return this.client.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 15_000,
    });
  }

  buscarCompraIdempotente(usuarioId: number, chaveIdempotencia: string) {
    return this.client.compra.findUnique({
      where: { usuarioId_chaveIdempotencia: { usuarioId, chaveIdempotencia } },
      include: { itens: true, cliente: { include: { plano: true } } },
    });
  }

  async buscarSaldoDisponivel(clienteId: number): Promise<number> {
    const resultado = await this.client.loteCashback.aggregate({
      where: {
        clienteId,
        status: { in: [StatusLote.ATIVO, StatusLote.PARCIAL] },
        saldoCentavos: { gt: 0 },
        venceEm: { gt: new Date() },
      },
      _sum: { saldoCentavos: true },
    });
    return resultado._sum.saldoCentavos ?? 0;
  }
}
