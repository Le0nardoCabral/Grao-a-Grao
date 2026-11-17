import assert from "node:assert/strict";
import test from "node:test";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

test("cadastro de cliente aparece na listagem", async () => {
  const contexto = await iniciarContextoApi();
  const senha = "SenhaTeste123!";

  try {
    const usuario = await contexto.criarUsuario("ATENDENTE", senha);
    const plano = await contexto.criarPlano();
    const token = await contexto.obterToken(usuario.email, senha);
    const cabecalhos = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    };
    const criacao = await fetch(`${contexto.url}/clientes`, {
      method: "POST",
      headers: cabecalhos,
      body: JSON.stringify({ nome: "Cliente integração", planoId: plano.id }),
    });
    assert.equal(criacao.status, 201);
    const cliente = await criacao.json() as { id: number };

    const listagem = await fetch(`${contexto.url}/clientes?pagina=1&limite=10`, {
      headers: cabecalhos,
    });
    assert.equal(listagem.status, 200);
    const corpo = await listagem.json() as { dados: Array<{ id: number }> };
    assert.ok(corpo.dados.some((item) => item.id === cliente.id));
  } finally {
    await contexto.encerrar();
  }
});
