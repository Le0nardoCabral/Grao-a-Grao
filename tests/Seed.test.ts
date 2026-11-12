import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { criarClienteTeste, limparTabelas } from "./support/AuxiliarTeste.js";

test("a carga cria três planos e um admin sem duplicar", async () => {
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
    const usuarios = await prisma.usuario.findMany();
    assert.equal(planos.length, 3);
    assert.equal(usuarios.length, 1);
    assert.equal(usuarios[0].perfil, "ADMIN");
    assert.equal(usuarios[0].email, "admin@teste.invalid");
    executarSeed();
    assert.deepEqual(await prisma.plano.findMany({ orderBy: { nome: "asc" } }), planos);
    assert.deepEqual(await prisma.usuario.findMany(), usuarios);
  } finally {
    await prisma.$disconnect();
    await limparTabelas(["plano", "usuario"]);
  }
});
