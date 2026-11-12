import { Prisma, StatusLote } from "@prisma/client";
import { AppError } from "../errors/AppError.js";
import { ComprasRepository } from "../repositories/ComprasRepository.js";
import { adicionarDiasEmBrasilia, mesEmBrasilia } from "./CashbackDateService.js";
import type { CriarCompraInputDto, CriarCompraResultadoDto, ItemCompraInputDto } from "../dtos/ComprasDtos.js";

const repository = new ComprasRepository();

function respostaIdempotente(
  compra: {
    id: number;
    clienteId: number;
    usuarioId: number;
    valorBrutoCentavos: number;
    cashbackUsadoCentavos: number;
    valorPagoCentavos: number;
    cashbackGeradoCentavos: number;
    cashbackCortadoCentavos: number;
    criadaEm: Date;
    itens: Array<{ produtoId: number; quantidade: number; precoUnitarioCentavos: number; subtotalCentavos: number }>;
  },
  limiteCentavos: number,
  saldoDisponivelCentavos: number,
): CriarCompraResultadoDto {
  const limiteAtingido = saldoDisponivelCentavos >= limiteCentavos;
  return {
    compra,
    cashbackCalculadoCentavos: compra.cashbackGeradoCentavos + compra.cashbackCortadoCentavos,
    cashbackCortadoCentavos: compra.cashbackCortadoCentavos,
    saldoDisponivelCentavos,
    limiteAtingido,
    motivoCashbackNaoGerado: compra.cashbackGeradoCentavos > 0
      ? null
      : compra.cashbackCortadoCentavos > 0 || limiteAtingido
        ? "LIMITE_DO_PLANO_ATINGIDO"
        : "VALOR_ARREDONDADO_PARA_ZERO",
    mensagemLimite: limiteAtingido
      ? "Limite do plano atingido. O cliente precisa usar o saldo antes de acumular cashback novamente."
      : null,
    repetida: true,
  };
}

function calcularCashback(valorCentavos: number, percentualBps: number, multiplicador: number): number {
  return Number((BigInt(valorCentavos) * BigInt(percentualBps) * BigInt(multiplicador)) / 10_000n);
}

function conteudoIgual(
  compra: { clienteId: number; cashbackUsadoCentavos: number; itens: ItemCompraInputDto[] },
  input: CriarCompraInputDto,
): boolean {
  const ordenar = (itens: ItemCompraInputDto[]) => [...itens]
    .sort((a, b) => a.produtoId - b.produtoId)
    .map((item) => `${item.produtoId}:${item.quantidade}`)
    .join("|");
  return compra.clienteId === input.clienteId
    && compra.cashbackUsadoCentavos === (input.cashbackSolicitadoCentavos ?? 0)
    && ordenar(compra.itens) === ordenar(input.itens);
}

export class RegistrarCompraService {
  async executar(usuarioId: number, input: CriarCompraInputDto, chaveIdempotencia: string): Promise<CriarCompraResultadoDto> {
    try {
      return await repository.transaction(async (transaction) => {
        const compraExistente = await transaction.compra.findUnique({
          where: { usuarioId_chaveIdempotencia: { usuarioId, chaveIdempotencia } },
          include: { itens: true },
        });
        if (compraExistente) {
          if (!conteudoIgual(compraExistente, input)) {
            throw new AppError("A chave de idempotência já foi usada com outro conteúdo.", 409, "IDEMPOTENCY_KEY_CONFLICT");
          }
          const cliente = await transaction.cliente.findUnique({ where: { id: compraExistente.clienteId }, include: { plano: true } });
          if (!cliente) throw new AppError("Cliente não encontrado.", 404, "CLIENT_NOT_FOUND");
          const saldoAtual = await transaction.loteCashback.aggregate({
            where: {
              clienteId: cliente.id,
              status: { in: [StatusLote.ATIVO, StatusLote.PARCIAL] },
              saldoCentavos: { gt: 0 },
              venceEm: { gt: new Date() },
            },
            _sum: { saldoCentavos: true },
          });
          const compra = await transaction.compra.findUniqueOrThrow({
            where: { id: compraExistente.id },
            select: {
              id: true,
              clienteId: true,
              usuarioId: true,
              valorBrutoCentavos: true,
              cashbackUsadoCentavos: true,
              valorPagoCentavos: true,
              cashbackGeradoCentavos: true,
              cashbackCortadoCentavos: true,
              criadaEm: true,
              itens: { select: { produtoId: true, quantidade: true, precoUnitarioCentavos: true, subtotalCentavos: true } },
            },
          });
          return respostaIdempotente(compra, cliente.plano.limiteCentavos, saldoAtual._sum.saldoCentavos ?? 0);
        }

        await transaction.$queryRaw(Prisma.sql`SELECT id FROM Cliente WHERE id = ${input.clienteId} FOR UPDATE`);
        const agora = new Date();
        const cliente = await transaction.cliente.findUnique({ where: { id: input.clienteId }, include: { plano: true } });
        if (!cliente) throw new AppError("Cliente não encontrado.", 404, "CLIENT_NOT_FOUND");
        if (!cliente.ativo) throw new AppError("Cliente inativo.", 409, "CLIENT_INACTIVE");
        if (!cliente.plano.ativo) throw new AppError("O plano atual do cliente está inativo.", 409, "PLAN_INACTIVE");

        const produtoIds = input.itens.map((item) => item.produtoId);
        const produtos = await transaction.produto.findMany({ where: { id: { in: produtoIds } } });
        const produtoPorId = new Map(produtos.map((produto) => [produto.id, produto]));
        if (produtoPorId.size !== produtoIds.length) throw new AppError("Um ou mais produtos não existem.", 404, "PRODUCT_NOT_FOUND");
        if (produtos.some((produto) => !produto.ativo)) throw new AppError("Um ou mais produtos estão inativos.", 409, "PRODUCT_INACTIVE");

        const itensCalculados = input.itens.map((item) => {
          const produto = produtoPorId.get(item.produtoId)!;
          const subtotalCentavos = produto.precoCentavos * item.quantidade;
          if (!Number.isSafeInteger(subtotalCentavos)) {
            throw new AppError("O subtotal do item excede o limite permitido.", 400, "INVALID_PURCHASE_AMOUNT");
          }
          return { produtoId: produto.id, quantidade: item.quantidade, precoUnitarioCentavos: produto.precoCentavos, subtotalCentavos };
        });
        const valorBrutoCentavos = itensCalculados.reduce((total, item) => total + item.subtotalCentavos, 0);
        if (!Number.isSafeInteger(valorBrutoCentavos) || valorBrutoCentavos <= 0 || valorBrutoCentavos > 100_000_000) {
          throw new AppError("O valor total da compra é inválido.", 400, "INVALID_PURCHASE_AMOUNT");
        }

        await transaction.loteCashback.updateMany({
          where: { clienteId: cliente.id, status: { in: [StatusLote.ATIVO, StatusLote.PARCIAL] }, venceEm: { lte: agora } },
          data: { status: StatusLote.EXPIRADO },
        });
        const lotes = await transaction.loteCashback.findMany({
          where: {
            clienteId: cliente.id,
            status: { in: [StatusLote.ATIVO, StatusLote.PARCIAL] },
            saldoCentavos: { gt: 0 },
            venceEm: { gt: agora },
          },
          orderBy: [{ venceEm: "asc" }, { geradoEm: "asc" }, { id: "asc" }],
        });
        const saldoDisponivelCentavos = lotes.reduce((total, lote) => total + lote.saldoCentavos, 0);
        const cashbackUsadoCentavos = input.cashbackSolicitadoCentavos ?? 0;
        if (cashbackUsadoCentavos > valorBrutoCentavos) {
          throw new AppError("Não é permitido usar cashback acima do valor da compra.", 400, "CASHBACK_EXCEEDS_PURCHASE");
        }
        if (cashbackUsadoCentavos > 0 && cashbackUsadoCentavos < cliente.plano.minimoUsoCentavos) {
          throw new AppError(`O plano exige uso mínimo de ${cliente.plano.minimoUsoCentavos} centavos.`, 400, "CASHBACK_BELOW_PLAN_MINIMUM");
        }
        if (cashbackUsadoCentavos > saldoDisponivelCentavos) {
          throw new AppError("Saldo de cashback insuficiente.", 409, "INSUFFICIENT_CASHBACK");
        }

        let restanteParaDebitar = cashbackUsadoCentavos;
        const usosPlanejados: Array<{ loteId: number; valorCentavos: number }> = [];
        for (const lote of lotes) {
          if (restanteParaDebitar === 0) break;
          const valorDebitado = Math.min(lote.saldoCentavos, restanteParaDebitar);
          const saldoNovo = lote.saldoCentavos - valorDebitado;
          const atualizado = await transaction.loteCashback.updateMany({
            where: { id: lote.id, clienteId: cliente.id, saldoCentavos: lote.saldoCentavos, status: lote.status, venceEm: { gt: agora } },
            data: { saldoCentavos: saldoNovo, status: saldoNovo === 0 ? StatusLote.CONSUMIDO : StatusLote.PARCIAL },
          });
          if (atualizado.count !== 1) throw new AppError("Conflito de concorrência ao registrar a compra.", 409, "PURCHASE_CONFLICT");
          usosPlanejados.push({ loteId: lote.id, valorCentavos: valorDebitado });
          restanteParaDebitar -= valorDebitado;
        }

        const saldoAposUsoCentavos = saldoDisponivelCentavos - cashbackUsadoCentavos;
        const valorPagoCentavos = valorBrutoCentavos - cashbackUsadoCentavos;
        const noMesDeAniversario = cliente.dataNascimento !== null
          && cliente.dataNascimento.getUTCMonth() + 1 === mesEmBrasilia(agora);
        const multiplicador = cliente.plano.dobroAniversario && noMesDeAniversario ? 2 : 1;
        const cashbackCalculadoCentavos = calcularCashback(valorPagoCentavos, cliente.plano.percentualBps, multiplicador);
        const espacoNoLimiteCentavos = Math.max(0, cliente.plano.limiteCentavos - saldoAposUsoCentavos);
        const cashbackGeradoCentavos = Math.min(cashbackCalculadoCentavos, espacoNoLimiteCentavos);
        const cashbackCortadoCentavos = cashbackCalculadoCentavos - cashbackGeradoCentavos;
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
            cashbackCortadoCentavos,
            chaveIdempotencia,
            itens: { create: itensCalculados },
          },
          select: {
            id: true,
            clienteId: true,
            usuarioId: true,
            valorBrutoCentavos: true,
            cashbackUsadoCentavos: true,
            valorPagoCentavos: true,
            cashbackGeradoCentavos: true,
            cashbackCortadoCentavos: true,
            criadaEm: true,
            itens: { select: { produtoId: true, quantidade: true, precoUnitarioCentavos: true, subtotalCentavos: true } },
          },
        });
        if (cashbackUsadoCentavos > 0) {
          await transaction.usoCashback.createMany({ data: usosPlanejados.map((uso) => ({ ...uso, compraId: compra.id })) });
        }
        if (cashbackGeradoCentavos > 0) {
          await transaction.loteCashback.create({
            data: {
              clienteId: cliente.id,
              compraOrigemId: compra.id,
              valorOriginalCentavos: cashbackGeradoCentavos,
              saldoCentavos: cashbackGeradoCentavos,
              geradoEm: agora,
              venceEm: adicionarDiasEmBrasilia(agora, cliente.plano.validadeDias),
              status: StatusLote.ATIVO,
            },
          });
        }
        return {
          compra,
          cashbackCalculadoCentavos,
          cashbackCortadoCentavos,
          saldoDisponivelCentavos: saldoFinalCentavos,
          limiteAtingido,
          motivoCashbackNaoGerado: cashbackGeradoCentavos > 0
            ? null
            : limiteAtingido || cashbackCortadoCentavos > 0
              ? "LIMITE_DO_PLANO_ATINGIDO"
              : "VALOR_ARREDONDADO_PARA_ZERO",
          mensagemLimite: limiteAtingido
            ? "Limite do plano atingido. O cliente precisa usar o saldo antes de acumular cashback novamente."
            : null,
          repetida: false,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const compraExistente = await repository.buscarCompraIdempotente(usuarioId, chaveIdempotencia);
        if (compraExistente && conteudoIgual(compraExistente, input)) {
          const saldo = await repository.buscarSaldoDisponivel(compraExistente.clienteId);
          return respostaIdempotente(compraExistente, compraExistente.cliente.plano.limiteCentavos, saldo);
        }
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code)) {
        throw new AppError("Conflito de concorrência ao registrar a compra. Tente novamente.", 409, "PURCHASE_CONFLICT");
      }
      throw error;
    }
  }
}
