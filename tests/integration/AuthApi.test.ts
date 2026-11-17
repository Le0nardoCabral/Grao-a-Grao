import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
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

test("admin cadastra atendente e login aceita o novo usuário", async () => {
  const contexto = await iniciarContextoApi();
  try {
    const senhaAdmin = "SenhaAdmin123!";
    const admin = await contexto.criarUsuario("ADMIN", senhaAdmin);
    const token = await contexto.obterToken(admin.email, senhaAdmin);
    const email = `novo-${Date.now()}@teste.invalid`;
    const cadastro = await fetch(`${contexto.url}/auth/register`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ nome: "Atendente Novo", email: email.toUpperCase(), senha: "SenhaNova123!" }),
    });
    assert.equal(cadastro.status, 201);
    const usuario = await cadastro.json() as { email: string; perfil: string; senhaHash?: string };
    assert.equal(usuario.email, email);
    assert.equal(usuario.perfil, "ATENDENTE");
    assert.ok(!("senhaHash" in usuario));
    const login = await fetch(`${contexto.url}/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, senha: "SenhaNova123!" }),
    });
    assert.equal(login.status, 200);
  } finally {
    await contexto.encerrar();
  }
});

test("middleware rejeita token ausente, inválido, expirado e associado a usuário indisponível", async () => {
  const contexto = await iniciarContextoApi();
  const senha = "SenhaTeste123!";
  try {
    const usuario = await contexto.criarUsuario("ATENDENTE", senha);
    const segredo = process.env.JWT_SECRET!;
    const gerarToken = (subject?: string, key = segredo, expiresIn: number | string = "1h") => jwt.sign(
      { perfil: "ADMIN" },
      key,
      { ...(subject === undefined ? {} : { subject }), expiresIn: expiresIn as jwt.SignOptions["expiresIn"] },
    );
    const consultar = (authorization?: string) => fetch(`${contexto.url}/clientes`, {
      headers: authorization ? { authorization: `Bearer ${authorization}` } : {},
    });
    const codigo = async (resposta: Response) => (await resposta.json() as { erro: { codigo: string } }).erro.codigo;

    const senhaErrada = await fetch(`${contexto.url}/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: usuario.email, senha: "SenhaIncorreta123!" }),
    });
    assert.equal(senhaErrada.status, 401);
    assert.equal(await codigo(senhaErrada), "INVALID_CREDENTIALS");

    assert.equal(await codigo(await consultar()), "UNAUTHENTICATED");
    assert.equal(await codigo(await fetch(`${contexto.url}/clientes`, { headers: { authorization: "Basic token" } })), "UNAUTHENTICATED");
    assert.equal(await codigo(await consultar("token-malformado")), "UNAUTHENTICATED");
    assert.equal(await codigo(await consultar(gerarToken(String(usuario.id), "segredo-incorreto"))), "UNAUTHENTICATED");
    assert.equal(await codigo(await consultar(gerarToken(String(usuario.id), segredo, -1))), "UNAUTHENTICATED");
    assert.equal(await codigo(await consultar(gerarToken())), "UNAUTHENTICATED");
    assert.equal(await codigo(await consultar(gerarToken("2147483600"))), "UNAUTHENTICATED");

    await contexto.consultarBanco((prisma) => prisma.usuario.update({ where: { id: usuario.id }, data: { ativo: false } }));
    assert.equal(await codigo(await consultar(gerarToken(String(usuario.id)))), "UNAUTHENTICATED");
    const loginUsuarioInativo = await fetch(`${contexto.url}/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: usuario.email, senha }),
    });
    assert.equal(loginUsuarioInativo.status, 401);
    assert.equal(await codigo(loginUsuarioInativo), "INVALID_CREDENTIALS");
  } finally {
    await contexto.encerrar();
  }
});

test("cadastro de usuário é exclusivo do ADMIN", async () => {
  const contexto = await iniciarContextoApi();
  const senha = "SenhaTeste123!";
  try {
    const atendente = await contexto.criarUsuario("ATENDENTE", senha);
    const token = await contexto.obterToken(atendente.email, senha);
    const corpo = JSON.stringify({ nome: "Outro atendente", email: "outro@teste.invalid", senha: "SenhaNova123!" });
    const semToken = await fetch(`${contexto.url}/auth/register`, {
      method: "POST", headers: { "content-type": "application/json" }, body: corpo,
    });
    const atendenteProibido = await fetch(`${contexto.url}/auth/register`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: corpo,
    });
    assert.equal(semToken.status, 401);
    assert.equal(atendenteProibido.status, 403);
  } finally {
    await contexto.encerrar();
  }
});
