import assert from "node:assert/strict";
import test from "node:test";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

test("o servidor sobe e responde", async () => {
  const contexto = await iniciarContextoApi();
  try {
    const resposta = await fetch(`${contexto.url}/health`);
    assert.equal(resposta.status, 200);
    const docs = await fetch(`${contexto.url}/docs`);
    assert.equal(docs.status, 200);
    assert.match(docs.headers.get("content-type") ?? "", /text\/html/);
  } finally {
    await contexto.encerrar();
  }
});
