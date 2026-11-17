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

test("recursos inexistentes devolvem erros específicos sem dados internos", async () => {
  const contexto = await iniciarContextoApi();
  const senha = "SenhaTeste123!";
  try {
    const usuario = await contexto.criarUsuario("ATENDENTE", senha);
    const token = await contexto.obterToken(usuario.email, senha);
    const headers = { authorization: `Bearer ${token}` };
    const recursos = [
      ["/clientes/2147483600", "CLIENT_NOT_FOUND"],
      ["/planos/2147483600", "PLAN_NOT_FOUND"],
      ["/produtos/2147483600", "PRODUCT_NOT_FOUND"],
    ] as const;
    for (const [path, code] of recursos) {
      const resposta = await fetch(`${contexto.url}${path}`, { headers });
      assert.equal(resposta.status, 404);
      assert.equal((await resposta.json() as { erro: { codigo: string } }).erro.codigo, code);
    }
  } finally {
    await contexto.encerrar();
  }
});
