import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { iniciarContextoApi } from "../support/ApiTestContext.js";

type Plano = {
  id: number;
  nome: string;
  mensalidadeCentavos: number;
  minimoUsoCentavos: number;
  ativo: boolean;
};

type CorpoErro = {
  erro: { codigo: string };
};

function novoPlano(nome: string) {
  return {
    nome,
    percentualBps: 250,
    limiteCentavos: 10_000,
    mensalidadeCentavos: 1_990,
    minimoUsoCentavos: 1_000,
    dobroAniversario: false,
    validadeDias: 180,
  };
}

test("administra planos com acesso, paginação e proteção de clientes ativos", async () => {
  const contexto = await iniciarContextoApi();
  const senha = "SenhaTeste123!";

  try {
    const admin = await contexto.criarUsuario("ADMIN", senha);
    const atendente = await contexto.criarUsuario("ATENDENTE", senha);
    const tokenAdmin = await contexto.obterToken(admin.email, senha);
    const tokenAtendente = await contexto.obterToken(atendente.email, senha);
    const semToken = await fetch(`${contexto.url}/planos`);
    assert.equal(semToken.status, 401);

    const cabecalhosAdmin = {
      authorization: `Bearer ${tokenAdmin}`,
      "content-type": "application/json",
    };
    const cabecalhosAtendente = {
      authorization: `Bearer ${tokenAtendente}`,
      "content-type": "application/json",
    };
    const payload = novoPlano(`Plano ${randomUUID()}`);

    const criacaoAtendente = await fetch(`${contexto.url}/planos`, {
      method: "POST",
      headers: cabecalhosAtendente,
      body: JSON.stringify(payload),
    });
    assert.equal(criacaoAtendente.status, 403);

    const criacao = await fetch(`${contexto.url}/planos`, {
      method: "POST",
      headers: cabecalhosAdmin,
      body: JSON.stringify(payload),
    });
    assert.equal(criacao.status, 201);
    const plano = await criacao.json() as Plano;
    assert.equal(plano.mensalidadeCentavos, payload.mensalidadeCentavos);
    assert.equal(plano.ativo, true);

    const listagem = await fetch(
      `${contexto.url}/planos?pagina=1&limite=100`,
      { headers: cabecalhosAtendente },
    );
    assert.equal(listagem.status, 200);
    const pagina = await listagem.json() as {
      dados: Array<{ id: number }>;
      pagina: number;
      limite: number;
    };
    assert.equal(pagina.pagina, 1);
    assert.equal(pagina.limite, 100);
    assert.ok(pagina.dados.some((item) => item.id === plano.id));

    const consulta = await fetch(`${contexto.url}/planos/${plano.id}`, {
      headers: cabecalhosAtendente,
    });
    assert.equal(consulta.status, 200);

    const atualizacao = await fetch(`${contexto.url}/planos/${plano.id}`, {
      method: "PUT",
      headers: cabecalhosAdmin,
      body: JSON.stringify({
        nome: `${payload.nome} atualizado`,
        mensalidadeCentavos: 2_490,
      }),
    });
    assert.equal(atualizacao.status, 200);
    const planoAtualizado = await atualizacao.json() as Plano;
    assert.equal(planoAtualizado.mensalidadeCentavos, 2_490);

    const planoSemClientes = await fetch(`${contexto.url}/planos`, {
      method: "POST",
      headers: cabecalhosAdmin,
      body: JSON.stringify(novoPlano(`Plano ${randomUUID()}`)),
    });
    assert.equal(planoSemClientes.status, 201);
    const planoDesativavel = await planoSemClientes.json() as Plano;

    const desativacao = await fetch(
      `${contexto.url}/planos/${planoDesativavel.id}`,
      { method: "DELETE", headers: cabecalhosAdmin },
    );
    assert.equal(desativacao.status, 204);

    const consultaInativa = await fetch(
      `${contexto.url}/planos/${planoDesativavel.id}?incluirInativos=true`,
      { headers: cabecalhosAdmin },
    );
    assert.equal(consultaInativa.status, 200);

    const reativacao = await fetch(
      `${contexto.url}/planos/${planoDesativavel.id}/reativar`,
      { method: "POST", headers: cabecalhosAdmin },
    );
    assert.equal(reativacao.status, 200);
    assert.equal((await reativacao.json() as Plano).ativo, true);

    const segundoPlano = await fetch(`${contexto.url}/planos`, {
      method: "POST",
      headers: cabecalhosAdmin,
      body: JSON.stringify(novoPlano(`Plano ${randomUUID()}`)),
    });
    assert.equal(segundoPlano.status, 201);
    const planoComCliente = await segundoPlano.json() as Plano;
    await contexto.criarCliente(planoComCliente.id);

    const desativacaoBloqueada = await fetch(
      `${contexto.url}/planos/${planoComCliente.id}`,
      { method: "DELETE", headers: cabecalhosAdmin },
    );
    assert.equal(desativacaoBloqueada.status, 409);
    const corpoErro = await desativacaoBloqueada.json() as CorpoErro;
    assert.equal(corpoErro.erro.codigo, "PLAN_HAS_ACTIVE_CLIENTS");
  } finally {
    await contexto.encerrar();
  }
});
