import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

test("cria, consulta, atualiza, lista e desativa um produto pela API", async () => {
  const contexto = await iniciarContextoApi();
  const senha = "SenhaTeste123!";

  try {
    const usuario = await contexto.criarUsuario("ADMIN", senha);
    const token = await contexto.obterToken(usuario.email, senha);
    const cabecalhos = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    };
    const nome = `Produto ${randomUUID()}`;
    const criacao = await fetch(`${contexto.url}/produtos`, {
      method: "POST",
      headers: cabecalhos,
      body: JSON.stringify({ nome, precoCentavos: 1_250 }),
    });
    assert.equal(criacao.status, 201);
    const produto = await criacao.json() as { id: number };

    const consulta = await fetch(`${contexto.url}/produtos/${produto.id}`, { headers: cabecalhos });
    assert.equal(consulta.status, 200);

    const atualizacao = await fetch(`${contexto.url}/produtos/${produto.id}`, {
      method: "PUT",
      headers: cabecalhos,
      body: JSON.stringify({ precoCentavos: 1_500 }),
    });
    assert.equal(atualizacao.status, 200);
    assert.equal((await atualizacao.json() as { precoCentavos: number }).precoCentavos, 1_500);

    const desativacao = await fetch(`${contexto.url}/produtos/${produto.id}`, {
      method: "DELETE",
      headers: cabecalhos,
    });
    assert.equal(desativacao.status, 204);

    const listagem = await fetch(`${contexto.url}/produtos`, { headers: cabecalhos });
    assert.equal(listagem.status, 200);
    const produtos = await listagem.json() as Array<{ id: number }>;
    assert.ok(!produtos.some((item) => item.id === produto.id));
  } finally {
    await contexto.encerrar();
  }
});
