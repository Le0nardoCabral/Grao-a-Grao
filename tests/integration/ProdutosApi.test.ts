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

    const reativacao = await fetch(`${contexto.url}/produtos/${produto.id}/reativar`, {
      method: "POST", headers: cabecalhos,
    });
    assert.equal(reativacao.status, 200);
    assert.equal((await reativacao.json() as { ativo: boolean }).ativo, true);
  } finally {
    await contexto.encerrar();
  }
});

test("middleware restringe criação, edição, desativação e reativação de produtos ao ADMIN", async () => {
  const contexto = await iniciarContextoApi();
  const senha = "SenhaTeste123!";
  try {
    const admin = await contexto.criarUsuario("ADMIN", senha);
    const atendente = await contexto.criarUsuario("ATENDENTE", senha);
    const tokenAdmin = await contexto.obterToken(admin.email, senha);
    const tokenAtendente = await contexto.obterToken(atendente.email, senha);
    const headersAtendente = { authorization: `Bearer ${tokenAtendente}`, "content-type": "application/json" };
    const headersAdmin = { authorization: `Bearer ${tokenAdmin}`, "content-type": "application/json" };
    const produtoAtivo = await contexto.criarProduto();
    const produtoInativo = await contexto.consultarBanco((prisma) => prisma.produto.create({
      data: { nome: "Produto inativo para teste de acesso", precoCentavos: 800, ativo: false },
    }));

    const proibidos = await Promise.all([
      fetch(`${contexto.url}/produtos`, { method: "POST", headers: headersAtendente, body: JSON.stringify({ nome: "Produto criado por atendente", precoCentavos: 500 }) }),
      fetch(`${contexto.url}/produtos?incluirInativos=true`, { headers: headersAtendente }),
      fetch(`${contexto.url}/produtos/${produtoAtivo.id}`, { method: "PUT", headers: headersAtendente, body: JSON.stringify({ precoCentavos: 600 }) }),
      fetch(`${contexto.url}/produtos/${produtoAtivo.id}`, { method: "DELETE", headers: headersAtendente }),
      fetch(`${contexto.url}/produtos/${produtoInativo.id}/reativar`, { method: "POST", headers: headersAtendente }),
    ]);
    assert.deepEqual(proibidos.map((resposta) => resposta.status), [403, 403, 403, 403, 403]);
    for (const resposta of proibidos) {
      assert.equal((await resposta.json() as { erro: { codigo: string } }).erro.codigo, "FORBIDDEN");
    }
    assert.equal((await fetch(`${contexto.url}/produtos/${produtoAtivo.id}`, { headers: headersAdmin })).status, 200);
  } finally {
    await contexto.encerrar();
  }
});
