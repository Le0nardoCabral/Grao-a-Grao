import { Prisma, StatusLote } from "@prisma/client";
import { AppError } from "../errors/AppError.js";
import { ComprasRepository } from "../repositories/ComprasRepository.js";

type ItemCompraInput = { produtoId: number; quantidade: number };
type CompraInput = {
  clienteId: number;
  itens: ItemCompraInput[];
  cashbackSolicitadoCentavos?: number;
};

const repository = new ComprasRepository();

function calcularCashback(valorCentavos: number, percentualBps: number, multiplicador: number): number {
  return Number((BigInt(valorCentavos) * BigInt(percentualBps) * BigInt(multiplicador)) / 10_000n);
}

function adicionarDias(data: Date, dias: number): Date {
  const vencimento = new Date(data);
  vencimento.setDate(vencimento.getDate() + dias);
  return vencimento;
}

export class RegistrarCompraService {
  async executar(usuarioId: number, input: CompraInput) {
    try {
      return await repository.transaction(async (transaction) => {
        const agora = new Date();
        const cliente = await transaction.cliente.findUnique({
          where: { id: input.clienteId },
          include: { plano: true },
        });

        if (!cliente || !cliente.ativo) throw new AppError("Cliente não encontrado ou inativo.", 404, "CLIENT_NOT_FOUND");
        if (!cliente.plano.ativo) throw new AppError("O plano atual do cliente está inativo.", 409, "PLAN_INACTIVE");

        const produtoIds = [...new Set(input.itens.map((item) => item.produtoId))];
        const produtos = await transaction.produto.findMany({
          where: { id: { in: produtoIds }, ativo: true },
        });
        const produtoPorId = new Map(produtos.map((produto) => [produto.id, produto]));
        if (produtoPorId.size !== produtoIds.length) {
          throw new AppError("Um ou mais produtos não existem ou estão inativos.", 404, "PRODUCT_NOT_FOUND");
        }

        const itensCalculados = input.itens.map((item) => {
          const produto = produtoPorId.get(item.produtoId)!;
          const subtotalCentavos = produto.precoCentavos * item.quantidade;
          if (!Number.isSafeInteger(subtotalCentavos)) {
            throw new AppError("O subtotal do item excede o limite permitido.", 400, "INVALID_PURCHASE_AMOUNT");
          }
          return {
            produtoId: produto.id,
            quantidade: item.quantidade,
            precoUnitarioCentavos: produto.precoCentavos,
            subtotalCentavos,
          };
        });
        const valorBrutoCentavos = itensCalculados.reduce((total, item) => total + item.subtotalCentavos, 0);
        if (!Number.isSafeInteger(valorBrutoCentavos) || valorBrutoCentavos <= 0) {
          throw new AppError("O valor total da compra é inválido.", 400, "INVALID_PURCHASE_AMOUNT");
        }

        await transaction.loteCashback.updateMany({
          where: {
            clienteId: cliente.id,
            status: { in: [StatusLote.ATIVO, StatusLote.PARCIAL] },
            venceEm: { lte: agora },
          },
          data: { saldoCentavos: 0, status: StatusLote.EXPIRADO },
        });

        const lotes = await transaction.loteCashback.findMany({
          where: {
            clienteId: cliente.id,
            status: { in: [StatusLote.ATIVO, StatusLote.PARCIAL] },
            saldoCentavos: { gt: 0 },
            venceEm: { gt: agora },
          },
          orderBy: [{ geradoEm: "asc" }, { id: "asc" }],
        });
        const saldoDisponivelCentavos = lotes.reduce((total, lote) => total + lote.saldoCentavos, 0);
        const cashbackUsadoCentavos = input.cashbackSolicitadoCentavos ?? 0;

        if (cashbackUsadoCentavos > valorBrutoCentavos) {
          throw new AppError("Não é permitido usar cashback acima do valor da compra.", 400, "CASHBACK_EXCEEDS_PURCHASE");
        }
        if (cashbackUsadoCentavos > saldoDisponivelCentavos) {
          throw new AppError("Saldo de cashback insuficiente.", 400, "INSUFFICIENT_CASHBACK");
        }
        if (cashbackUsadoCentavos > 0 && cashbackUsadoCentavos < cliente.plano.minimoUsoCentavos) {
          throw new AppError(
            `O plano exige uso mínimo de ${cliente.plano.minimoUsoCentavos} centavos.`,
            400,
            "CASHBACK_BELOW_PLAN_MINIMUM",
          );
        }

        let restanteParaDebitar = cashbackUsadoCentavos;
        const usosPlanejados: Array<{ loteId: number; valorCentavos: number }> = [];
        for (const lote of lotes) {
          if (restanteParaDebitar === 0) break;
          const valorDebitado = Math.min(lote.saldoCentavos, restanteParaDebitar);
          const saldoNovo = lote.saldoCentavos - valorDebitado;
          const atualizado = await transaction.loteCashback.updateMany({
            where: {
              id: lote.id,
              clienteId: cliente.id,
              saldoCentavos: lote.saldoCentavos,
              status: lote.status,
              venceEm: { gt: agora },
            },
            data: {
              saldoCentavos: saldoNovo,
              status: saldoNovo === 0 ? StatusLote.CONSUMIDO : StatusLote.PARCIAL,
            },
          });
          if (atualizado.count !== 1) {
            throw new AppError("O saldo foi alterado por outra compra. Tente novamente.", 409, "CASHBACK_CONCURRENT_UPDATE");
          }
          usosPlanejados.push({ loteId: lote.id, valorCentavos: valorDebitado });
          restanteParaDebitar -= valorDebitado;
        }

        const saldoAposUsoCentavos = saldoDisponivelCentavos - cashbackUsadoCentavos;
        const valorPagoCentavos = valorBrutoCentavos - cashbackUsadoCentavos;
        const noMesDeAniversario = cliente.dataNascimento !== null
          && cliente.dataNascimento.getUTCMonth() === agora.getUTCMonth();
        const multiplicador = cliente.plano.dobroAniversario && noMesDeAniversario ? 2 : 1;
        const cashbackCalculadoCentavos = calcularCashback(
          valorBrutoCentavos,
          cliente.plano.percentualBps,
          multiplicador,
        );
        const espacoNoLimiteCentavos = Math.max(0, cliente.plano.limiteCentavos - saldoAposUsoCentavos);
        const cashbackGeradoCentavos = Math.min(cashbackCalculadoCentavos, espacoNoLimiteCentavos);
        const cashbackDescartadoCentavos = cashbackCalculadoCentavos - cashbackGeradoCentavos;
        const saldoFinalCentavos = saldoAposUsoCentavos + cashbackGeradoCentavos;
        const limiteAtingido = saldoFinalCentavos >= cliente.plano.limiteCentavos;

        const compra = await transaction.compra.create({
          data: {
            clienteId: cliente.id,
            usuarioId,
            valorBrutoCentavos,
            cashbackUsadoCentavos,
            valorPagoCentavos,
            cashbackGeradoCentavos,
            itens: { create: itensCalculados },
          },
          include: { itens: { include: { produto: true } } },
        });

        if (cashbackUsadoCentavos > 0) {
          await transaction.usoCashback.createMany({
            data: usosPlanejados.map((uso) => ({ ...uso, compraId: compra.id })),
          });
        }

        if (cashbackGeradoCentavos > 0) {
          await transaction.loteCashback.create({
            data: {
              clienteId: cliente.id,
              compraOrigemId: compra.id,
              valorOriginalCentavos: cashbackGeradoCentavos,
              saldoCentavos: cashbackGeradoCentavos,
              geradoEm: agora,
              venceEm: adicionarDias(agora, cliente.plano.validadeDias),
              status: StatusLote.ATIVO,
            },
          });
        }

        return {
          compra,
          cashbackCalculadoCentavos,
          cashbackDescartadoCentavos,
          saldoDisponivelCentavos: saldoFinalCentavos,
          limiteAtingido,
          motivoCashbackNaoGerado: limiteAtingido
            ? "LIMITE_DO_PLANO_ATINGIDO"
            : cashbackCalculadoCentavos === 0
              ? "VALOR_ARREDONDADO_PARA_ZERO"
              : cashbackDescartadoCentavos > 0
                ? "LIMITE_DO_PLANO_ATINGIDO"
                : null,
          mensagemLimite: limiteAtingido
            ? "Limite do plano atingido. O cliente precisa usar o saldo antes de acumular cashback novamente."
            : null,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        throw new AppError("Conflito de concorrência ao registrar a compra. Tente novamente.", 409, "PURCHASE_CONFLICT");
      }
      throw error;
    }
  }
}
