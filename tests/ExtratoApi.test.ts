import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { criarClienteTeste, criarPlano, criarProduto, criarUsuario, limparTabelas, iniciarServidor } from "./AuxiliarTeste.js";

test("extrato após compra mostra saldo e lote sem gravar durante a consulta", async () => {
  await limparTabelas(["usoCashback", "itemCompra", "loteCashback", "compra", "cliente", "produto", "plano", "usuario"]);
  const usuario = await criarUsuario("ATENDENTE", "SenhaTeste123!");
  const plano = await criarPlano();
  const prismaPlano = criarClienteTeste();
  await prismaPlano.plano.update({ where: { id: plano.id }, data: { validadeDias: 15 } });
  await prismaPlano.$disconnect();
  const cliente = await (async () => {
    const prisma = criarClienteTeste();
    try { return await prisma.cliente.create({ data: { nome: "Cliente de extrato", planoId: plano.id } }); }
    finally { await prisma.$disconnect(); }
  })();
  const produto = await criarProduto();
  const servidor = await iniciarServidor();
  try {
    const login = await fetch(`${servidor.url}/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: usuario.email, senha: "SenhaTeste123!" }),
    });
    const { token } = await login.json() as { token: string };
    const compra = await fetch(`${servidor.url}/compras`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": randomUUID() },
      body: JSON.stringify({ clienteId: cliente.id, itens: [{ produtoId: produto.id, quantidade: 1 }] }),
    });
    assert.equal(compra.status, 201);
    const prisma = criarClienteTeste();
    try {
      const contagemAntes = await prisma.loteCashback.count({ where: { clienteId: cliente.id } });
      const resposta = await fetch(`${servidor.url}/clientes/${cliente.id}/extrato`, { headers: { authorization: `Bearer ${token}` } });
      assert.equal(resposta.status, 200);
      const extrato = await resposta.json() as { saldoDisponivelCentavos: number; lotesAVencer: Array<{ saldoCentavos: number }> };
      assert.equal(extrato.saldoDisponivelCentavos, 20);
      assert.equal(extrato.lotesAVencer.length, 1);
      assert.equal(extrato.lotesAVencer[0]?.saldoCentavos, 20);
      assert.equal(await prisma.loteCashback.count({ where: { clienteId: cliente.id } }), contagemAntes);
    } finally { await prisma.$disconnect(); }
  } finally {
    await servidor.encerrar();
    await limparTabelas(["usoCashback", "itemCompra", "loteCashback", "compra", "cliente", "produto", "plano", "usuario"]);
  }
});
