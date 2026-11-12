import assert from "node:assert/strict";
import test from "node:test";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

test("entrada inválida retorna erro 400 no formato padronizado", async () => {
  const contexto = await iniciarContextoApi();
  const senha = "SenhaTeste123!";

  try {
    const usuario = await contexto.criarUsuario("ATENDENTE", senha);
    const plano = await contexto.criarPlano();
    const token = await contexto.obterToken(usuario.email, senha);
    const resposta = await fetch(`${contexto.url}/clientes`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ nome: "Cliente inválido", planoId: plano.id, campoExtra: true }),
    });
    assert.equal(resposta.status, 400);
    assert.deepEqual(await resposta.json(), {
      erro: {
        codigo: "VALIDATION_ERROR",
        mensagem: "Dados da requisição inválidos.",
        detalhes: [{ campo: "campoExtra", mensagem: "Campo não permitido." }],
      },
    });
  } finally {
    await contexto.encerrar();
  }
});
