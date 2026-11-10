import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import {
  criarClienteTeste,
  criarProduto,
  criarUsuario,
  limparTabelas,
  iniciarServidor,
} from "./AuxiliarTeste.js";

async function prepararCompra() {
  await limparTabelas(["usoCashback", "itemCompra", "loteCashback", "compra", "cliente", "produto", "plano", "usuario"]);
  const usuario = await criarUsuario("ATENDENTE", "SenhaTeste123!");
  const prisma = criarClienteTeste();
  const plano = await prisma.plano.create({
    data: { nome: `Plano ${randomUUID()}`, percentualBps: 200, limiteCentavos: 1_000_000, mensalidadeCentavos: 0, minimoUsoCentavos: 0, validadeDias: 180 },
  });
  const cliente = await prisma.cliente.create({ data: { nome: "Cliente de teste", planoId: plano.id } });
  await prisma.$disconnect();
  const produto = await criarProduto();
  const prismaProduto = criarClienteTeste();
  await prismaProduto.produto.update({ where: { id: produto.id }, data: { precoCentavos: 10_000 } });
  await prismaProduto.$disconnect();
  const servidor = await iniciarServidor();
  const login = await fetch(`${servidor.url}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: usuario.email, senha: "SenhaTeste123!" }),
  });
  assert.equal(login.status, 200);
  const sessao = await login.json() as { token: string };
  return { usuario, plano, cliente, produto, servidor, token: sessao.token };
}

async function registrarCompra(url: string, token: string, chave: string, clienteId: number, produtoId: number, cashbackSolicitadoCentavos = 0) {
  return fetch(`${url}/compras`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": chave },
    body: JSON.stringify({ clienteId, itens: [{ produtoId, quantidade: 1 }], cashbackSolicitadoCentavos }),
  });
}

async function criarLoteInicial(clienteId: number, usuarioId: number, saldoCentavos: number, venceEm: Date) {
  const prisma = criarClienteTeste();
  try {
    const compra = await prisma.compra.create({
      data: { clienteId, usuarioId, valorBrutoCentavos: saldoCentavos, valorPagoCentavos: saldoCentavos, cashbackGeradoCentavos: saldoCentavos, chaveIdempotencia: randomUUID() },
    });
    return prisma.loteCashback.create({ data: { clienteId, compraOrigemId: compra.id, valorOriginalCentavos: saldoCentavos, saldoCentavos, venceEm } });
  } finally {
    await prisma.$disconnect();
  }
}

test("cashback de compra de R$ 100 usa como base os R$ 80 pagos", async () => {
  const estado = await prepararCompra();
  try {
    await criarLoteInicial(estado.cliente.id, estado.usuario.id, 2_000, new Date(Date.now() + 86_400_000));
    const chave = randomUUID();
    const primeira = await registrarCompra(estado.servidor.url, estado.token, chave, estado.cliente.id, estado.produto.id, 2_000);
    const resultado = await primeira.json() as { compra: { valorBrutoCentavos: number; valorPagoCentavos: number; cashbackGeradoCentavos: number } };
    assert.equal(primeira.status, 201);
    assert.equal(resultado.compra.valorBrutoCentavos, 10_000);
    assert.equal(resultado.compra.valorPagoCentavos, 8_000);
    assert.equal(resultado.compra.cashbackGeradoCentavos, 160);

  } finally {
    await estado.servidor.encerrar();
    await limparTabelas(["usoCashback", "itemCompra", "loteCashback", "compra", "cliente", "produto", "plano", "usuario"]);
  }
});

test("a mesma chave devolve a compra original sem duplicá-la", async () => {
  const estado = await prepararCompra();
  try {
    const chave = randomUUID();
    const primeira = await registrarCompra(estado.servidor.url, estado.token, chave, estado.cliente.id, estado.produto.id);
    assert.equal(primeira.status, 201);
    const repetida = await registrarCompra(estado.servidor.url, estado.token, chave, estado.cliente.id, estado.produto.id);
    assert.equal(repetida.status, 200);
    const prisma = criarClienteTeste();
    try { assert.equal(await prisma.compra.count({ where: { usuarioId: estado.usuario.id, chaveIdempotencia: chave } }), 1); }
    finally { await prisma.$disconnect(); }
  } finally {
    await estado.servidor.encerrar();
    await limparTabelas(["usoCashback", "itemCompra", "loteCashback", "compra", "cliente", "produto", "plano", "usuario"]);
  }
});

test("uso do cashback consome primeiro o lote que vence antes", async () => {
  const estado = await prepararCompra();
  try {
    const agora = Date.now();
    const primeiro = await criarLoteInicial(estado.cliente.id, estado.usuario.id, 1_500, new Date(agora + 86_400_000));
    const segundo = await criarLoteInicial(estado.cliente.id, estado.usuario.id, 1_500, new Date(agora + 172_800_000));
    const resposta = await registrarCompra(estado.servidor.url, estado.token, randomUUID(), estado.cliente.id, estado.produto.id, 2_500);
    assert.equal(resposta.status, 201);
    const prisma = criarClienteTeste();
    try {
      const usos = await prisma.usoCashback.findMany({ orderBy: { id: "asc" } });
      assert.deepEqual(usos.map((uso) => [uso.loteId, uso.valorCentavos]), [[primeiro.id, 1_500], [segundo.id, 1_000]]);
    } finally { await prisma.$disconnect(); }
  } finally {
    await estado.servidor.encerrar();
    await limparTabelas(["usoCashback", "itemCompra", "loteCashback", "compra", "cliente", "produto", "plano", "usuario"]);
  }
});
