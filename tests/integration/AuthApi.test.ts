import assert from "node:assert/strict";
import test from "node:test";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

test("login válido devolve token e usuário sem senha nem hash", async () => {
  const contexto = await iniciarContextoApi();
  try {
    const usuario = await contexto.criarUsuario("ATENDENTE", "SenhaTeste123!");
    const resposta = await fetch(`${contexto.url}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: usuario.email, senha: "SenhaTeste123!" }) });
    assert.equal(resposta.status, 200);
    const corpo = await resposta.json() as { token: unknown; usuario: Record<string, unknown> };
    assert.equal(typeof corpo.token, "string");
    assert.deepEqual(corpo.usuario, { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil });
    assert.ok(!("senha" in corpo.usuario));
    assert.ok(!("senhaHash" in corpo.usuario));
  } finally {
    await contexto.encerrar();
  }
});
