import assert from "node:assert/strict";
import test from "node:test";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

test("middleware bloqueia ATENDENTE em todas as rotas exclusivas do ADMIN", async () => {
  const contexto = await iniciarContextoApi();
  const senha = "SenhaTeste123!";
  try {
    const admin = await contexto.criarUsuario("ADMIN", senha);
    const atendente = await contexto.criarUsuario("ATENDENTE", senha);
    const tokenAdmin = await contexto.obterToken(admin.email, senha);
    const tokenAtendente = await contexto.obterToken(atendente.email, senha);
    const authAtendente = { authorization: `Bearer ${tokenAtendente}`, "content-type": "application/json" };
    const authAdmin = { authorization: `Bearer ${tokenAdmin}`, "content-type": "application/json" };
    const plano = await contexto.criarPlano();
    const cliente = await contexto.criarCliente(plano.id);
    const produto = await contexto.criarProduto();
    const produtoInativo = await contexto.consultarBanco((prisma) => prisma.produto.create({
      data: { nome: "Produto inativo da autorização", precoCentavos: 500, ativo: false },
    }));

    const respostas = await Promise.all([
      fetch(`${contexto.url}/auth/register`, { method: "POST", headers: authAtendente, body: JSON.stringify({ nome: "Novo usuário", email: "novo@teste.invalid", senha }) }),
      fetch(`${contexto.url}/planos`, { method: "POST", headers: authAtendente, body: JSON.stringify({ nome: "Plano bloqueado", percentualBps: 100, limiteCentavos: 1000, mensalidadeCentavos: 0, minimoUsoCentavos: 0 }) }),
      fetch(`${contexto.url}/planos?incluirInativos=true`, { headers: authAtendente }),
      fetch(`${contexto.url}/planos/${plano.id}`, { method: "PUT", headers: authAtendente, body: JSON.stringify({ nome: "Plano alterado" }) }),
      fetch(`${contexto.url}/planos/${plano.id}`, { method: "DELETE", headers: authAtendente }),
      fetch(`${contexto.url}/planos/${plano.id}/reativar`, { method: "POST", headers: authAtendente }),
      fetch(`${contexto.url}/planos/receita-mensal`, { headers: authAtendente }),
      fetch(`${contexto.url}/produtos`, { method: "POST", headers: authAtendente, body: JSON.stringify({ nome: "Produto bloqueado", precoCentavos: 100 }) }),
      fetch(`${contexto.url}/produtos/${produto.id}`, { method: "PUT", headers: authAtendente, body: JSON.stringify({ precoCentavos: 200 }) }),
      fetch(`${contexto.url}/produtos/${produto.id}`, { method: "DELETE", headers: authAtendente }),
      fetch(`${contexto.url}/produtos/${produtoInativo.id}/reativar`, { method: "POST", headers: authAtendente }),
      fetch(`${contexto.url}/clientes/${cliente.id}/trocar-plano`, { method: "POST", headers: authAtendente, body: JSON.stringify({ planoId: plano.id }) }),
      fetch(`${contexto.url}/clientes/${cliente.id}`, { method: "DELETE", headers: authAtendente }),
      fetch(`${contexto.url}/clientes/${cliente.id}/reativar`, { method: "POST", headers: authAtendente }),
    ]);

    assert.deepEqual(respostas.map((resposta) => resposta.status), Array(14).fill(403));
    for (const resposta of respostas) {
      assert.equal((await resposta.json() as { erro: { codigo: string } }).erro.codigo, "FORBIDDEN");
    }
    assert.equal((await fetch(`${contexto.url}/planos`, { headers: authAdmin })).status, 200);
  } finally {
    await contexto.encerrar();
  }
});
