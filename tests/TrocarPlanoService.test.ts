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

test("troca de plano mantém saldo e lote e aplica o novo limite na próxima compra", async () => {
  await limparTabelas(["usoCashback", "itemCompra", "loteCashback", "compra", "cliente", "produto", "plano", "usuario"]);
  const admin = await criarUsuario("ADMIN", "SenhaTeste123!");
  const prisma = criarClienteTeste();
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
  await prisma.$disconnect();
  const servidor = await iniciarServidor();
  try {
    const login = await fetch(`${servidor.url}/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: admin.email, senha: "SenhaTeste123!" }),
    });
    const { token } = await login.json() as { token: string };
    const troca = await fetch(`${servidor.url}/clientes/${cliente.id}/trocar-plano`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ planoId: planoNovo.id }),
    });
    assert.equal(troca.status, 200);
    const compra = await fetch(`${servidor.url}/compras`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": randomUUID() },
      body: JSON.stringify({ clienteId: cliente.id, itens: [{ produtoId: produto.id, quantidade: 1 }] }),
    });
    assert.equal(compra.status, 201);
    const prismaApos = criarClienteTeste();
    try {
      const clienteAtual = await prismaApos.cliente.findUniqueOrThrow({ where: { id: cliente.id } });
      const loteAtual = await prismaApos.loteCashback.findUniqueOrThrow({ where: { id: lote.id } });
      assert.equal(clienteAtual.planoId, planoNovo.id);
      assert.equal(loteAtual.saldoCentavos, 4_000);
      const body = await compra.json() as { compra: { cashbackGeradoCentavos: number }; motivoCashbackNaoGerado: string | null };
      assert.equal(body.compra.cashbackGeradoCentavos, 0);
      assert.equal(body.motivoCashbackNaoGerado, "LIMITE_DO_PLANO_ATINGIDO");
    } finally { await prismaApos.$disconnect(); }
  } finally {
    await servidor.encerrar();
    await limparTabelas(["usoCashback", "itemCompra", "loteCashback", "compra", "cliente", "produto", "plano", "usuario"]);
  }
});
