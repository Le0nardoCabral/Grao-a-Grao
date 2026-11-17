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

test("valida Content-Type, JSON, corpo, parâmetros de rota e filtros de consulta", async () => {
  const contexto = await iniciarContextoApi();
  const senha = "SenhaTeste123!";
  try {
    const usuario = await contexto.criarUsuario("ATENDENTE", senha);
    const admin = await contexto.criarUsuario("ADMIN", senha);
    const plano = await contexto.criarPlano();
    const token = await contexto.obterToken(usuario.email, senha);
    const tokenAdmin = await contexto.obterToken(admin.email, senha);
    const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
    const codigo = async (resposta: Response) => (await resposta.json() as { erro: { codigo: string } }).erro.codigo;

    const semJson = await fetch(`${contexto.url}/clientes`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "text/plain" }, body: "{}",
    });
    assert.equal(semJson.status, 400);
    assert.equal(await codigo(semJson), "VALIDATION_ERROR");

    const jsonMalformado = await fetch(`${contexto.url}/clientes`, {
      method: "POST", headers, body: "{ json quebrado",
    });
    assert.equal(jsonMalformado.status, 400);
    assert.equal(await codigo(jsonMalformado), "VALIDATION_ERROR");

    const campoObrigatorio = await fetch(`${contexto.url}/clientes`, {
      method: "POST", headers, body: JSON.stringify({ nome: "Sem plano" }),
    });
    assert.equal(campoObrigatorio.status, 400);
    assert.equal(await codigo(campoObrigatorio), "VALIDATION_ERROR");

    const tipoInvalido = await fetch(`${contexto.url}/clientes`, {
      method: "POST", headers, body: JSON.stringify({ nome: "Plano inválido", planoId: "não é número" }),
    });
    assert.equal(tipoInvalido.status, 400);
    assert.equal(await codigo(tipoInvalido), "VALIDATION_ERROR");

    const idInvalido = await fetch(`${contexto.url}/clientes/abc`, { headers });
    assert.equal(idInvalido.status, 400);
    assert.equal(await codigo(idInvalido), "VALIDATION_ERROR");

    const filtroInvalido = await fetch(`${contexto.url}/clientes?pagina=0`, { headers });
    assert.equal(filtroInvalido.status, 400);
    assert.equal(await codigo(filtroInvalido), "VALIDATION_ERROR");

    const filtroInativosInvalido = await fetch(`${contexto.url}/clientes/1/extrato?incluirInativos=sim`, { headers });
    assert.equal(filtroInativosInvalido.status, 400);
    assert.equal(await codigo(filtroInativosInvalido), "VALIDATION_ERROR");

    const queryPlanoInvalida = await fetch(`${contexto.url}/planos?pagina=0`, { headers });
    assert.equal(queryPlanoInvalida.status, 400);
    assert.equal(await codigo(queryPlanoInvalida), "VALIDATION_ERROR");

    const queryProdutoInvalida = await fetch(`${contexto.url}/produtos?incluirInativos=sim`, { headers });
    assert.equal(queryProdutoInvalida.status, 400);
    assert.equal(await codigo(queryProdutoInvalida), "VALIDATION_ERROR");

    const idProdutoInvalido = await fetch(`${contexto.url}/produtos/abc`, { headers });
    assert.equal(idProdutoInvalido.status, 400);
    assert.equal(await codigo(idProdutoInvalido), "VALIDATION_ERROR");

    const combinacaoPlanoInvalida = await fetch(`${contexto.url}/planos`, {
      method: "POST",
      headers: { authorization: `Bearer ${tokenAdmin}`, "content-type": "application/json" },
      body: JSON.stringify({ nome: "Plano inválido", percentualBps: 100, limiteCentavos: 1000, mensalidadeCentavos: 0, minimoUsoCentavos: 1001 }),
    });
    assert.equal(combinacaoPlanoInvalida.status, 400);
    assert.equal(await codigo(combinacaoPlanoInvalida), "VALIDATION_ERROR");

    const dataNascimentoFutura = await fetch(`${contexto.url}/clientes`, {
      method: "POST", headers, body: JSON.stringify({ nome: "Data futura", planoId: plano.id, dataNascimento: "2099-01-01" }),
    });
    assert.equal(dataNascimentoFutura.status, 400);
    assert.equal(await codigo(dataNascimentoFutura), "VALIDATION_ERROR");

    const corpoExcessivo = await fetch(`${contexto.url}/clientes`, {
      method: "POST", headers,
      body: JSON.stringify({ nome: "x".repeat(102_400), planoId: plano.id }),
    });
    assert.equal(corpoExcessivo.status, 400);
    assert.equal(await codigo(corpoExcessivo), "VALIDATION_ERROR");

    assert.ok(plano.id > 0);
  } finally {
    await contexto.encerrar();
  }
});

test("valida chave de idempotência e itens repetidos ou com quantidade fora da regra", async () => {
  const contexto = await iniciarContextoApi();
  const senha = "SenhaTeste123!";
  try {
    const usuario = await contexto.criarUsuario("ATENDENTE", senha);
    const plano = await contexto.criarPlano();
    const cliente = await contexto.criarCliente(plano.id);
    const produto = await contexto.criarProduto();
    const token = await contexto.obterToken(usuario.email, senha);
    const body = (itens: unknown[]) => JSON.stringify({ clienteId: cliente.id, itens });
    const codigo = async (resposta: Response) => (await resposta.json() as { erro: { codigo: string } }).erro.codigo;
    const url = `${contexto.url}/compras`;

    const semChave = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: body([{ produtoId: produto.id, quantidade: 1 }]),
    });
    assert.equal(semChave.status, 400);
    assert.equal(await codigo(semChave), "IDEMPOTENCY_KEY_REQUIRED");

    const chaveLonga = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": "x".repeat(65) },
      body: body([{ produtoId: produto.id, quantidade: 1 }]),
    });
    assert.equal(chaveLonga.status, 400);
    assert.equal(await codigo(chaveLonga), "IDEMPOTENCY_KEY_REQUIRED");

    const idsDuplicados = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": "teste-ids-duplicados" },
      body: body([{ produtoId: produto.id, quantidade: 1 }, { produtoId: produto.id, quantidade: 2 }]),
    });
    assert.equal(idsDuplicados.status, 400);
    assert.equal(await codigo(idsDuplicados), "VALIDATION_ERROR");

    const quantidadeExcessiva = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": "teste-quantidade" },
      body: body([{ produtoId: produto.id, quantidade: 1_001 }]),
    });
    assert.equal(quantidadeExcessiva.status, 400);
    assert.equal(await codigo(quantidadeExcessiva), "VALIDATION_ERROR");
  } finally {
    await contexto.encerrar();
  }
});
