import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

async function prepararCompra(minimoUsoCentavos = 0) {
  const contexto = await iniciarContextoApi();
  try {
    const usuario = await contexto.criarUsuario("ATENDENTE", "SenhaTeste123!");
    const plano = await contexto.consultarBanco((prisma) => prisma.plano.create({
      data: { nome: `Plano ${randomUUID()}`, percentualBps: 200, limiteCentavos: 1_000_000, mensalidadeCentavos: 0, minimoUsoCentavos, validadeDias: 180 },
    }));
    const cliente = await contexto.criarCliente(plano.id);
    const produto = await contexto.criarProduto();
    await contexto.consultarBanco((prisma) => prisma.produto.update({ where: { id: produto.id }, data: { precoCentavos: 10_000 } }));
    const token = await contexto.obterToken(usuario.email, "SenhaTeste123!");
    return { contexto, usuario, plano, cliente, produto, token };
  } catch (erro) {
    await contexto.encerrar();
    throw erro;
  }
}

async function registrarCompra(url: string, token: string, chave: string, clienteId: number, produtoId: number, cashbackSolicitadoCentavos = 0, quantidade = 1) {
  return fetch(`${url}/compras`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": chave },
    body: JSON.stringify({ clienteId, itens: [{ produtoId, quantidade }], cashbackSolicitadoCentavos }),
  });
}

async function criarLoteInicial(contexto: Awaited<ReturnType<typeof iniciarContextoApi>>, clienteId: number, usuarioId: number, saldoCentavos: number, venceEm: Date) {
  return contexto.consultarBanco(async (prisma) => {
    const compra = await prisma.compra.create({
      data: { clienteId, usuarioId, valorBrutoCentavos: saldoCentavos, valorPagoCentavos: saldoCentavos, cashbackGeradoCentavos: saldoCentavos, chaveIdempotencia: randomUUID() },
    });
    return prisma.loteCashback.create({ data: { clienteId, compraOrigemId: compra.id, valorOriginalCentavos: saldoCentavos, saldoCentavos, venceEm } });
  });
}

test("cashback de compra de R$ 100 usa como base os R$ 80 pagos", async () => {
  const estado = await prepararCompra();
  try {
    await criarLoteInicial(estado.contexto, estado.cliente.id, estado.usuario.id, 2_000, new Date(Date.now() + 86_400_000));
    const chave = randomUUID();
    const primeira = await registrarCompra(estado.contexto.url, estado.token, chave, estado.cliente.id, estado.produto.id, 2_000);
    const resultado = await primeira.json() as { compra: { valorBrutoCentavos: number; valorPagoCentavos: number; cashbackGeradoCentavos: number } };
    assert.equal(primeira.status, 201);
    assert.equal(resultado.compra.valorBrutoCentavos, 10_000);
    assert.equal(resultado.compra.valorPagoCentavos, 8_000);
    assert.equal(resultado.compra.cashbackGeradoCentavos, 160);

  } finally {
    await estado.contexto.encerrar();
  }
});

test("a mesma chave devolve a compra original sem duplicá-la", async () => {
  const estado = await prepararCompra();
  try {
    const chave = randomUUID();
    const primeira = await registrarCompra(estado.contexto.url, estado.token, chave, estado.cliente.id, estado.produto.id);
    assert.equal(primeira.status, 201);
    const repetida = await registrarCompra(estado.contexto.url, estado.token, chave, estado.cliente.id, estado.produto.id);
    assert.equal(repetida.status, 200);
    const conflito = await registrarCompra(estado.contexto.url, estado.token, chave, estado.cliente.id, estado.produto.id, 0, 2);
    assert.equal(conflito.status, 409);
    assert.equal((await conflito.json() as { erro: { codigo: string } }).erro.codigo, "IDEMPOTENCY_KEY_CONFLICT");
    await estado.contexto.consultarBanco(async (prisma) => {
      assert.equal(await prisma.compra.count({ where: { usuarioId: estado.usuario.id, chaveIdempotencia: chave } }), 1);
    });
  } finally {
    await estado.contexto.encerrar();
  }
});

test("compra rejeita cashback acima do total, abaixo do mínimo e acima do saldo", async () => {
  const estado = await prepararCompra(2_000);
  try {
    const acimaDoTotal = await registrarCompra(estado.contexto.url, estado.token, randomUUID(), estado.cliente.id, estado.produto.id, 10_001);
    assert.equal(acimaDoTotal.status, 400);
    assert.equal((await acimaDoTotal.json() as { erro: { codigo: string } }).erro.codigo, "CASHBACK_EXCEEDS_PURCHASE");

    const abaixoDoMinimo = await registrarCompra(estado.contexto.url, estado.token, randomUUID(), estado.cliente.id, estado.produto.id, 1_000);
    assert.equal(abaixoDoMinimo.status, 400);
    assert.equal((await abaixoDoMinimo.json() as { erro: { codigo: string } }).erro.codigo, "CASHBACK_BELOW_PLAN_MINIMUM");

    const saldoInsuficiente = await registrarCompra(estado.contexto.url, estado.token, randomUUID(), estado.cliente.id, estado.produto.id, 2_000);
    assert.equal(saldoInsuficiente.status, 409);
    assert.equal((await saldoInsuficiente.json() as { erro: { codigo: string } }).erro.codigo, "INSUFFICIENT_CASHBACK");
  } finally {
    await estado.contexto.encerrar();
  }
});

test("uso do cashback consome primeiro o lote que vence antes", async () => {
  const estado = await prepararCompra();
  try {
    const agora = Date.now();
    const primeiro = await criarLoteInicial(estado.contexto, estado.cliente.id, estado.usuario.id, 1_500, new Date(agora + 86_400_000));
    const segundo = await criarLoteInicial(estado.contexto, estado.cliente.id, estado.usuario.id, 1_500, new Date(agora + 172_800_000));
    const resposta = await registrarCompra(estado.contexto.url, estado.token, randomUUID(), estado.cliente.id, estado.produto.id, 2_500);
    assert.equal(resposta.status, 201);
    await estado.contexto.consultarBanco(async (prisma) => {
      const usos = await prisma.usoCashback.findMany({ orderBy: { id: "asc" } });
      assert.deepEqual(usos.map((uso) => [uso.loteId, uso.valorCentavos]), [[primeiro.id, 1_500], [segundo.id, 1_000]]);
    });
  } finally {
    await estado.contexto.encerrar();
  }
});
