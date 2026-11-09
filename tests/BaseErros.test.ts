import assert from "node:assert/strict";
import test from "node:test";
import { iniciarServidor } from "./AuxiliarTeste.js";

test("rota inexistente devolve erro padronizado", async () => {
  const servidor = await iniciarServidor();
  try {
    const resposta = await fetch(`${servidor.url}/rota-inexistente`);
    assert.equal(resposta.status, 404);
    assert.deepEqual(await resposta.json(), { erro: { codigo: "NOT_FOUND", mensagem: "Rota não encontrada." } });
  } finally {
    await servidor.encerrar();
  }
});
