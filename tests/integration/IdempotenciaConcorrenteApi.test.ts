import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

test("duas compras simultâneas com a mesma chave gravam uma compra", async () => {
  const contexto = await iniciarContextoApi();
  const senha = "SenhaTeste123!";

  try {
    const usuario = await contexto.criarUsuario("ATENDENTE", senha);
    const plano = await contexto.criarPlano();
    const cliente = await contexto.criarCliente(plano.id);
    const produto = await contexto.criarProduto();
    const token = await contexto.obterToken(usuario.email, senha);
    const chave = randomUUID();
    const requisicao = () => fetch(`${contexto.url}/compras`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "Idempotency-Key": chave,
      },
      body: JSON.stringify({ clienteId: cliente.id, itens: [{ produtoId: produto.id, quantidade: 1 }] }),
    });

    const respostas = await Promise.all([requisicao(), requisicao()]);
    assert.deepEqual(respostas.map((resposta) => resposta.status).sort(), [200, 201]);

    await contexto.consultarBanco(async (prisma) => {
      assert.equal(await prisma.compra.count({ where: { usuarioId: usuario.id, chaveIdempotencia: chave } }), 1);
    });
  } finally {
    await contexto.encerrar();
  }
});
