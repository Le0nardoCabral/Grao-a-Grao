import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { criarClienteTeste, limparTabelas } from "./support/AuxiliarTeste.js";

test("a carga prepara dados de demonstração e pode ser repetida sem duplicar", async () => {
  const endereco = process.env.DATABASE_URL_TEST;
  assert.ok(endereco);
  const url = new URL(endereco);
  assert.equal(url.protocol, "mysql:");
  assert.ok(["localhost", "127.0.0.1", "[::1]", "db"].includes(url.hostname));
  assert.equal(url.pathname, "/grao_a_grao_teste");

  await limparTabelas(["usoCashback", "itemCompra", "loteCashback", "compra", "cliente", "produto", "plano", "usuario"]);
  const prisma = criarClienteTeste();
  const executarSeed = () => {
    const resultado = spawnSync(process.execPath, ["--import", "tsx", "prisma/Seed.ts"], {
      env: { ...process.env, DATABASE_URL: endereco, SEED_ADMIN_EMAIL: "ADMIN@teste.invalid", SEED_ADMIN_PASSWORD: "SenhaFicticia123!", SEED_ADMIN_NAME: "Admin de teste" },
      encoding: "utf8",
    });
    assert.ifError(resultado.error);
    assert.equal(resultado.status, 0, "A carga inicial falhou no banco de teste");
  };
  try {
    executarSeed();
    const planos = await prisma.plano.findMany({ orderBy: { nome: "asc" } });
    const usuarios = await prisma.usuario.findMany({ orderBy: { email: "asc" } });
    const clientes = await prisma.cliente.findMany();
    const produtos = await prisma.produto.findMany();
    const compras = await prisma.compra.findMany();
    const lotes = await prisma.loteCashback.findMany();
    const usos = await prisma.usoCashback.findMany();
    assert.equal(planos.length, 3);
    assert.equal(usuarios.length, 3);
    assert.equal(usuarios.find((usuario) => usuario.email === "admin@teste.invalid")?.perfil, "ADMIN");
    assert.equal(usuarios.find((usuario) => usuario.email === "admin.demo@grao.local")?.perfil, "ADMIN");
    assert.equal(usuarios.find((usuario) => usuario.email === "admin.demo@grao.local")?.nome, "admin");
    assert.equal(usuarios.find((usuario) => usuario.email === "atendente.demo@grao.local")?.perfil, "ATENDENTE");
    assert.equal(clientes.length, 6);
    assert.equal(clientes.filter((cliente) => cliente.ativo).length, 5);
    assert.equal(produtos.length, 6);
    assert.equal(compras.length, 6);
    assert.equal(lotes.length, 6);
    assert.equal(usos.length, 1);
    assert.equal(usos[0].valorCentavos, 2_000);
    assert.equal(lotes.find((lote) => lote.status === "PARCIAL")?.saldoCentavos, 1_780);
    assert.ok(lotes.some((lote) => lote.venceEm.getTime() > Date.now() && lote.venceEm.getTime() <= Date.now() + 30 * 24 * 60 * 60 * 1000));
    executarSeed();
    assert.deepEqual(await prisma.plano.findMany({ orderBy: { nome: "asc" } }), planos);
    assert.deepEqual(await prisma.usuario.findMany({ orderBy: { email: "asc" } }), usuarios);
    assert.equal(await prisma.cliente.count(), clientes.length);
    assert.equal(await prisma.produto.count(), produtos.length);
    assert.equal(await prisma.compra.count(), compras.length);
    assert.equal(await prisma.loteCashback.count(), lotes.length);
    assert.equal(await prisma.usoCashback.count(), usos.length);
  } finally {
    await prisma.$disconnect();
    await limparTabelas(["usoCashback", "itemCompra", "loteCashback", "compra", "cliente", "produto", "plano", "usuario"]);
  }
});
