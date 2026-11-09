import assert from "node:assert/strict";
import test from "node:test";
import { iniciarServidor } from "./AuxiliarTeste.js";

test("o servidor sobe e responde", async () => {
  const servidor = await iniciarServidor();
  try {
    const resposta = await fetch(`${servidor.url}/health`);
    assert.equal(resposta.status, 200);
  } finally {
    await servidor.encerrar();
  }
});
