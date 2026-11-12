import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

test("troca de plano mantém saldo e lote e aplica o novo limite na próxima compra", async () => {
  const contexto = await iniciarContextoApi();
  try {
    const admin = await contexto.criarUsuario("ADMIN", "SenhaTeste123!");
    const dados = await contexto.consultarBanco(async (prisma) => {
      const planoAntigo = await prisma.plano.create({ data: { nome: `Antigo ${randomUUID()}`, percentualBps: 200, limiteCentavos: 50_000, mensalidadeCentavos: 0, minimoUsoCentavos: 0 } });
      const planoNovo = await prisma.plano.create({ data: { nome: `Novo ${randomUUID()}`, percentualBps: 200, limiteCentavos: 4_000, mensalidadeCentavos: 0, minimoUsoCentavos: 0 } });
      const cliente = await prisma.cliente.create({ data: { nome: "Cliente de teste", planoId: planoAntigo.id } });
      const produto = await prisma.produto.create({ data: { nome: `Produto ${randomUUID()}`, precoCentavos: 10_000 } });
      const origem = await prisma.compra.create({
        data: { clienteId: cliente.id, usuarioId: admin.id, valorBrutoCentavos: 4_000, valorPagoCentavos: 4_000, cashbackGeradoCentavos: 4_000, chaveIdempotencia: randomUUID() },
      });
      const lote = await prisma.loteCashback.create({
        data: { clienteId: cliente.id, compraOrigemId: origem.id, valorOriginalCentavos: 4_000, saldoCentavos: 4_000, venceEm: new Date(Date.now() + 86_400_000) },
      });
      return { planoNovo, cliente, produto, lote };
    });
    const token = await contexto.obterToken(admin.email, "SenhaTeste123!");
    const troca = await fetch(`${contexto.url}/clientes/${dados.cliente.id}/trocar-plano`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ planoId: dados.planoNovo.id }),
    });
    assert.equal(troca.status, 200);
    const compra = await fetch(`${contexto.url}/compras`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": randomUUID() },
      body: JSON.stringify({ clienteId: dados.cliente.id, itens: [{ produtoId: dados.produto.id, quantidade: 1 }] }),
    });
    assert.equal(compra.status, 201);
    await contexto.consultarBanco(async (prisma) => {
      const clienteAtual = await prisma.cliente.findUniqueOrThrow({ where: { id: dados.cliente.id } });
      const loteAtual = await prisma.loteCashback.findUniqueOrThrow({ where: { id: dados.lote.id } });
      assert.equal(clienteAtual.planoId, dados.planoNovo.id);
      assert.equal(loteAtual.saldoCentavos, 4_000);
      const body = await compra.json() as { compra: { cashbackGeradoCentavos: number }; motivoCashbackNaoGerado: string | null };
      assert.equal(body.compra.cashbackGeradoCentavos, 0);
      assert.equal(body.motivoCashbackNaoGerado, "LIMITE_DO_PLANO_ATINGIDO");
    });
  } finally {
    await contexto.encerrar();
  }
});
