import assert from "node:assert/strict";
import test from "node:test";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

test("o servidor sobe e responde", async () => {
  const contexto = await iniciarContextoApi();
  try {
    const resposta = await fetch(`${contexto.url}/health`);
    assert.equal(resposta.status, 200);
  } finally {
    await contexto.encerrar();
  }
});
