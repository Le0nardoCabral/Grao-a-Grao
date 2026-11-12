import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

test("extrato após compra mostra saldo e lote sem gravar durante a consulta", async () => {
  const contexto = await iniciarContextoApi();
  try {
    const usuario = await contexto.criarUsuario("ATENDENTE", "SenhaTeste123!");
    const plano = await contexto.criarPlano();
    await contexto.consultarBanco((prisma) => prisma.plano.update({ where: { id: plano.id }, data: { validadeDias: 15 } }));
    const cliente = await contexto.criarCliente(plano.id);
    const produto = await contexto.criarProduto();
    const token = await contexto.obterToken(usuario.email, "SenhaTeste123!");
    const compra = await fetch(`${contexto.url}/compras`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": randomUUID() },
      body: JSON.stringify({ clienteId: cliente.id, itens: [{ produtoId: produto.id, quantidade: 1 }] }),
    });
    assert.equal(compra.status, 201);
    await contexto.consultarBanco(async (prisma) => {
      const contagemAntes = await prisma.loteCashback.count({ where: { clienteId: cliente.id } });
      const resposta = await fetch(`${contexto.url}/clientes/${cliente.id}/extrato`, { headers: { authorization: `Bearer ${token}` } });
      assert.equal(resposta.status, 200);
      const extrato = await resposta.json() as { saldoDisponivelCentavos: number; lotesAVencer: Array<{ saldoCentavos: number }> };
      assert.equal(extrato.saldoDisponivelCentavos, 20);
      assert.equal(extrato.lotesAVencer.length, 1);
      assert.equal(extrato.lotesAVencer[0]?.saldoCentavos, 20);
      assert.equal(await prisma.loteCashback.count({ where: { clienteId: cliente.id } }), contagemAntes);
    });
  } finally {
    await contexto.encerrar();
  }
});
