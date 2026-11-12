import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  criarPlano,
  criarUsuario,
  iniciarServidor,
  limparTabelas,
  obterToken,
} from "./support/AuxiliarTeste.js";

type PlanoApi = {
  id: number;
  nome: string;
  mensalidadeCentavos: number;
  ativo: boolean;
};

type ClienteApi = {
  id: number;
  nome: string;
  email: string | null;
  dataNascimento: string | null;
  ativo: boolean;
  plano: { id: number; nome: string };
};

type ErroApi = { erro: { codigo: string } };

function cabecalhos(token: string) {
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
}

async function cadastrarPlano(
  url: string,
  headers: ReturnType<typeof cabecalhos>,
  mensalidadeCentavos: number,
): Promise<PlanoApi> {
  const resposta = await fetch(`${url}/planos`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      nome: `Plano ${randomUUID()}`,
      percentualBps: 200,
      limiteCentavos: 10_000,
      mensalidadeCentavos,
      minimoUsoCentavos: 100,
      dobroAniversario: false,
      validadeDias: 180,
    }),
  });
  assert.equal(resposta.status, 201);
  return await resposta.json() as PlanoApi;
}

test("cadastra, consulta, atualiza, lista, desativa e reativa clientes com acesso e vínculo seguros", async () => {
  await limparTabelas(["cliente", "plano", "usuario"]);
  const senha = "SenhaTeste123!";
  const admin = await criarUsuario("ADMIN", senha);
  const atendente = await criarUsuario("ATENDENTE", senha);
  const plano = await criarPlano();
  const servidor = await iniciarServidor();

  try {
    const tokenAdmin = await obterToken(servidor.url, admin.email, senha);
    const tokenAtendente = await obterToken(servidor.url, atendente.email, senha);
    const headersAdmin = cabecalhos(tokenAdmin);
    const headersAtendente = cabecalhos(tokenAtendente);

    const semToken = await fetch(`${servidor.url}/clientes`);
    assert.equal(semToken.status, 401);

    const cadastro = await fetch(`${servidor.url}/clientes`, {
      method: "POST",
      headers: headersAtendente,
      body: JSON.stringify({
        nome: "Cliente da Task",
        email: `cliente-${randomUUID()}@teste.invalid`,
        telefone: "11999998888",
        dataNascimento: "1990-05-17",
        planoId: plano.id,
      }),
    });
    assert.equal(cadastro.status, 201);
    const cliente = await cadastro.json() as ClienteApi;
    assert.equal(cliente.ativo, true);
    assert.equal(cliente.plano.id, plano.id);
    assert.equal(cliente.dataNascimento, "1990-05-17");

    const listagem = await fetch(
      `${servidor.url}/clientes?pagina=1&limite=10`,
      { headers: headersAtendente },
    );
    assert.equal(listagem.status, 200);
    const pagina = await listagem.json() as {
      dados: ClienteApi[];
      pagina: number;
      limite: number;
      total: number;
    };
    assert.equal(pagina.pagina, 1);
    assert.equal(pagina.limite, 10);
    assert.ok(pagina.dados.some((item) => item.id === cliente.id));

    const consulta = await fetch(`${servidor.url}/clientes/${cliente.id}`, {
      headers: headersAtendente,
    });
    assert.equal(consulta.status, 200);

    const atualizacao = await fetch(`${servidor.url}/clientes/${cliente.id}`, {
      method: "PUT",
      headers: headersAtendente,
      body: JSON.stringify({ nome: "Cliente Atualizado" }),
    });
    assert.equal(atualizacao.status, 200);
    const clienteAtualizado = await atualizacao.json() as ClienteApi;
    assert.equal(clienteAtualizado.nome, "Cliente Atualizado");
    assert.equal(clienteAtualizado.plano.id, plano.id);

    const incluirInativosAtendente = await fetch(
      `${servidor.url}/clientes/${cliente.id}?incluirInativos=true`,
      { headers: headersAtendente },
    );
    assert.equal(incluirInativosAtendente.status, 403);

    const semPermissao = await fetch(`${servidor.url}/clientes/${cliente.id}`, {
      method: "DELETE",
      headers: headersAtendente,
    });
    assert.equal(semPermissao.status, 403);

    const desativacao = await fetch(`${servidor.url}/clientes/${cliente.id}`, {
      method: "DELETE",
      headers: headersAdmin,
    });
    assert.equal(desativacao.status, 204);
    assert.equal(await desativacao.text(), "");

    const consultaInativa = await fetch(
      `${servidor.url}/clientes/${cliente.id}?incluirInativos=true`,
      { headers: headersAdmin },
    );
    assert.equal(consultaInativa.status, 200);
    assert.equal((await consultaInativa.json() as ClienteApi).ativo, false);

    const listaInativosAtendente = await fetch(
      `${servidor.url}/clientes?pagina=1&limite=10&incluirInativos=true`,
      { headers: headersAtendente },
    );
    assert.equal(listaInativosAtendente.status, 403);

    const listaInativosAdmin = await fetch(
      `${servidor.url}/clientes?pagina=1&limite=10&incluirInativos=true`,
      { headers: headersAdmin },
    );
    assert.equal(listaInativosAdmin.status, 200);
    const clientesInativosAdmin = await listaInativosAdmin.json() as {
      dados: ClienteApi[];
    };
    assert.ok(clientesInativosAdmin.dados.some(
      (item) => item.id === cliente.id && !item.ativo,
    ));

    const reativacao = await fetch(
      `${servidor.url}/clientes/${cliente.id}/reativar`,
      { method: "POST", headers: headersAdmin },
    );
    assert.equal(reativacao.status, 200);
    assert.equal((await reativacao.json() as ClienteApi).ativo, true);

    const clienteParaPlanoInativo = await fetch(`${servidor.url}/clientes`, {
      method: "POST",
      headers: headersAtendente,
      body: JSON.stringify({ nome: "Cliente Plano Inativo", planoId: plano.id }),
    });
    assert.equal(clienteParaPlanoInativo.status, 201);
    const clienteInativo = await clienteParaPlanoInativo.json() as ClienteApi;

    const desativarCliente = await fetch(
      `${servidor.url}/clientes/${clienteInativo.id}`,
      { method: "DELETE", headers: headersAdmin },
    );
    assert.equal(desativarCliente.status, 204);

    const desativarClientePrincipal = await fetch(
      `${servidor.url}/clientes/${cliente.id}`,
      { method: "DELETE", headers: headersAdmin },
    );
    assert.equal(desativarClientePrincipal.status, 204);

    const desativarPlano = await fetch(`${servidor.url}/planos/${plano.id}`, {
      method: "DELETE",
      headers: headersAdmin,
    });
    assert.equal(desativarPlano.status, 204);

    const reativarComPlanoInativo = await fetch(
      `${servidor.url}/clientes/${clienteInativo.id}/reativar`,
      { method: "POST", headers: headersAdmin },
    );
    assert.equal(reativarComPlanoInativo.status, 409);
    assert.equal(
      (await reativarComPlanoInativo.json() as ErroApi).erro.codigo,
      "PLAN_INACTIVE",
    );

    const reativarPlano = await fetch(
      `${servidor.url}/planos/${plano.id}/reativar`,
      { method: "POST", headers: headersAdmin },
    );
    assert.equal(reativarPlano.status, 200);

    const reativarCliente = await fetch(
      `${servidor.url}/clientes/${clienteInativo.id}/reativar`,
      { method: "POST", headers: headersAdmin },
    );
    assert.equal(reativarCliente.status, 200);

    const recusarPlanoComCliente = await fetch(
      `${servidor.url}/planos/${plano.id}`,
      { method: "DELETE", headers: headersAdmin },
    );
    assert.equal(recusarPlanoComCliente.status, 409);
    assert.equal(
      (await recusarPlanoComCliente.json() as ErroApi).erro.codigo,
      "PLAN_HAS_ACTIVE_CLIENTS",
    );

    const planoConcorrente = await criarPlano();
    const [cadastroConcorrente, desativacaoConcorrente] = await Promise.all([
      fetch(`${servidor.url}/clientes`, {
        method: "POST",
        headers: headersAtendente,
        body: JSON.stringify({
          nome: "Cliente Concorrente",
          planoId: planoConcorrente.id,
        }),
      }),
      fetch(`${servidor.url}/planos/${planoConcorrente.id}`, {
        method: "DELETE",
        headers: headersAdmin,
      }),
    ]);

    const cadastroConcorrenteValido = cadastroConcorrente.status === 201;
    assert.ok(cadastroConcorrenteValido || cadastroConcorrente.status === 409);
    assert.ok(
      desativacaoConcorrente.status === 204 || desativacaoConcorrente.status === 409,
    );

    const planoConcorrenteConsulta = await fetch(
      `${servidor.url}/planos/${planoConcorrente.id}?incluirInativos=true`,
      { headers: headersAdmin },
    );
    assert.equal(planoConcorrenteConsulta.status, 200);
    const planoConcorrenteApi = await planoConcorrenteConsulta.json() as PlanoApi;

    const clientesConcorrentes = await fetch(
      `${servidor.url}/clientes?pagina=1&limite=100&incluirInativos=true`,
      { headers: headersAdmin },
    );
    assert.equal(clientesConcorrentes.status, 200);
    const clientesConcorrentesApi = await clientesConcorrentes.json() as {
      dados: ClienteApi[];
    };
    const clientesAtivosDoPlano = clientesConcorrentesApi.dados.filter(
      (item) => item.plano.id === planoConcorrente.id && item.ativo,
    );
    assert.ok(planoConcorrenteApi.ativo || clientesAtivosDoPlano.length === 0);
    if (cadastroConcorrenteValido) {
      assert.equal(clientesAtivosDoPlano.length, 1);
      assert.equal(desativacaoConcorrente.status, 409);
    } else {
      assert.equal(cadastroConcorrente.status, 409);
      assert.equal(desativacaoConcorrente.status, 204);
    }

    const planoReativacaoConcorrente = await criarPlano();
    const cadastroReativacao = await fetch(`${servidor.url}/clientes`, {
      method: "POST",
      headers: headersAtendente,
      body: JSON.stringify({
        nome: "Cliente Reativação Concorrente",
        planoId: planoReativacaoConcorrente.id,
      }),
    });
    assert.equal(cadastroReativacao.status, 201);
    const clienteReativacao = await cadastroReativacao.json() as ClienteApi;

    const desativarClienteReativacao = await fetch(
      `${servidor.url}/clientes/${clienteReativacao.id}`,
      { method: "DELETE", headers: headersAdmin },
    );
    assert.equal(desativarClienteReativacao.status, 204);

    const [reativacaoConcorrente, desativacaoPlanoReativacaoConcorrente] = await Promise.all([
      fetch(`${servidor.url}/clientes/${clienteReativacao.id}/reativar`, {
        method: "POST",
        headers: headersAdmin,
      }),
      fetch(`${servidor.url}/planos/${planoReativacaoConcorrente.id}`, {
        method: "DELETE",
        headers: headersAdmin,
      }),
    ]);

    assert.ok(reativacaoConcorrente.status === 200 || reativacaoConcorrente.status === 409);
    assert.ok(
      desativacaoPlanoReativacaoConcorrente.status === 204
        || desativacaoPlanoReativacaoConcorrente.status === 409,
    );

    if (reativacaoConcorrente.status === 200) {
      assert.equal(desativacaoPlanoReativacaoConcorrente.status, 409);
      assert.equal(
        (await desativacaoPlanoReativacaoConcorrente.json() as ErroApi).erro.codigo,
        "PLAN_HAS_ACTIVE_CLIENTS",
      );
    } else {
      assert.equal(reativacaoConcorrente.status, 409);
      assert.equal((await reativacaoConcorrente.json() as ErroApi).erro.codigo, "PLAN_INACTIVE");
      assert.equal(desativacaoPlanoReativacaoConcorrente.status, 204);
    }

    const clienteReativacaoConsulta = await fetch(
      `${servidor.url}/clientes/${clienteReativacao.id}?incluirInativos=true`,
      { headers: headersAdmin },
    );
    assert.equal(clienteReativacaoConsulta.status, 200);
    const clienteReativacaoFinal = await clienteReativacaoConsulta.json() as ClienteApi;
    assert.equal(
      clienteReativacaoFinal.ativo,
      desativacaoPlanoReativacaoConcorrente.status === 409,
    );
  } finally {
    await servidor.encerrar();
    await limparTabelas(["cliente", "plano", "usuario"]);
  }
});

test("calcula receita mensal apenas de planos e clientes ativos e restringe o acesso ao ADMIN", async () => {
  await limparTabelas(["cliente", "plano", "usuario"]);
  const senha = "SenhaTeste123!";
  const admin = await criarUsuario("ADMIN", senha);
  const atendente = await criarUsuario("ATENDENTE", senha);
  const servidor = await iniciarServidor();

  try {
    const tokenAdmin = await obterToken(servidor.url, admin.email, senha);
    const tokenAtendente = await obterToken(servidor.url, atendente.email, senha);
    const headersAdmin = cabecalhos(tokenAdmin);
    const headersAtendente = cabecalhos(tokenAtendente);

    const planoUm = await cadastrarPlano(servidor.url, headersAdmin, 1_250);
    const planoDois = await cadastrarPlano(servidor.url, headersAdmin, 2_900);
    const planoInativo = await cadastrarPlano(servidor.url, headersAdmin, 4_500);

    for (const [nome, planoId] of [
      ["Cliente Receita A", planoUm.id],
      ["Cliente Receita B", planoUm.id],
      ["Cliente Receita C", planoDois.id],
    ] as const) {
      const resposta = await fetch(`${servidor.url}/clientes`, {
        method: "POST",
        headers: headersAtendente,
        body: JSON.stringify({ nome, planoId }),
      });
      assert.equal(resposta.status, 201);
    }

    const clienteInativo = await fetch(`${servidor.url}/clientes`, {
      method: "POST",
      headers: headersAtendente,
      body: JSON.stringify({ nome: "Cliente Receita Inativo", planoId: planoDois.id }),
    });
    assert.equal(clienteInativo.status, 201);
    const clienteInativoApi = await clienteInativo.json() as ClienteApi;
    const desativarCliente = await fetch(
      `${servidor.url}/clientes/${clienteInativoApi.id}`,
      { method: "DELETE", headers: headersAdmin },
    );
    assert.equal(desativarCliente.status, 204);

    const desativarPlano = await fetch(`${servidor.url}/planos/${planoInativo.id}`, {
      method: "DELETE",
      headers: headersAdmin,
    });
    assert.equal(desativarPlano.status, 204);

    const semToken = await fetch(`${servidor.url}/planos/receita-mensal`);
    assert.equal(semToken.status, 401);

    const proibido = await fetch(`${servidor.url}/planos/receita-mensal`, {
      headers: headersAtendente,
    });
    assert.equal(proibido.status, 403);

    const respostaReceita = await fetch(
      `${servidor.url}/planos/receita-mensal`,
      { headers: headersAdmin },
    );
    assert.equal(respostaReceita.status, 200);
    const receita = await respostaReceita.json() as {
      planos: Array<{
        id: number;
        mensalidadeCentavos: number;
        clientesAtivos: number;
        receitaMensalCentavos: number;
      }>;
      totalClientesAtivos: number;
      receitaMensalTotalCentavos: number;
    };
    assert.deepEqual(receita.planos.map((item) => item.id), [planoUm.id, planoDois.id]);
    assert.deepEqual(
      receita.planos.map((item) => [item.clientesAtivos, item.receitaMensalCentavos]),
      [[2, 2_500], [1, 2_900]],
    );
    assert.equal(receita.totalClientesAtivos, 3);
    assert.equal(receita.receitaMensalTotalCentavos, 5_400);
  } finally {
    await servidor.encerrar();
    await limparTabelas(["cliente", "plano", "usuario"]);
  }
});
