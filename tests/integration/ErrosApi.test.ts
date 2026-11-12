import assert from "node:assert/strict";
import test from "node:test";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

test("rota inexistente devolve erro padronizado", async () => {
  const contexto = await iniciarContextoApi();
  try {
    const resposta = await fetch(`${contexto.url}/rota-inexistente`);
    assert.equal(resposta.status, 404);
    assert.deepEqual(await resposta.json(), { erro: { codigo: "NOT_FOUND", mensagem: "Rota não encontrada." } });
  } finally {
    await contexto.encerrar();
  }
});
