import { StatusLote } from "@prisma/client";
import { prisma } from "./PrismaClient.js";

const activeStatuses = [StatusLote.ATIVO, StatusLote.PARCIAL];

export class ExtratoRepository {
  buscarCliente(clienteId: number) {
    return prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, ativo: true },
    });
  }

  async buscarSaldoDisponivel(clienteId: number, agora: Date): Promise<number> {
    const result = await prisma.loteCashback.aggregate({
      where: {
        clienteId,
        status: { in: activeStatuses },
        saldoCentavos: { gt: 0 },
        venceEm: { gt: agora },
      },
      _sum: { saldoCentavos: true },
    });

    return result._sum.saldoCentavos ?? 0;
  }

  buscarLotesAVencer(clienteId: number, agora: Date, limite: Date) {
    return prisma.loteCashback.findMany({
      where: {
        clienteId,
        status: { in: activeStatuses },
        saldoCentavos: { gt: 0 },
        venceEm: { gt: agora, lte: limite },
      },
      orderBy: [{ venceEm: "asc" }, { id: "asc" }],
      select: { id: true, saldoCentavos: true, venceEm: true },
    });
  }

  buscarCreditosRecentes(clienteId: number) {
    return prisma.loteCashback.findMany({
      where: { clienteId },
      orderBy: [{ geradoEm: "desc" }, { id: "desc" }],
      take: 50,
      select: {
        id: true,
        compraOrigemId: true,
        valorOriginalCentavos: true,
        geradoEm: true,
      },
    });
  }

  buscarUsosRecentes(clienteId: number) {
    return prisma.usoCashback.findMany({
      where: { lote: { clienteId } },
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      take: 50,
      select: {
        compraId: true,
        loteId: true,
        valorCentavos: true,
        criadoEm: true,
      },
    });
  }

  buscarExpiracoesRecentes(clienteId: number, agora: Date) {
    return prisma.loteCashback.findMany({
      where: {
        clienteId,
        saldoCentavos: { gt: 0 },
        OR: [
          { status: StatusLote.EXPIRADO },
          { status: { in: activeStatuses }, venceEm: { lte: agora } },
        ],
      },
      orderBy: [{ venceEm: "desc" }, { id: "desc" }],
      take: 50,
      select: { id: true, saldoCentavos: true, venceEm: true },
    });
  }
}
