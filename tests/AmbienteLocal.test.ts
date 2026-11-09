import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { PrismaClient } from "@prisma/client";

test("os bancos locais de desenvolvimento e teste respondem a uma consulta simples", async () => {
  const variaveis = ["DATABASE_URL", "DATABASE_URL_TEST"] as const;
  const urls = variaveis.map((variavel) => {
    const valor = process.env[variavel];
    assert.ok(valor, `${variavel} deve estar definida`);
    const url = new URL(valor);
    assert.equal(url.protocol, "mysql:");
    assert.ok(["localhost", "127.0.0.1", "[::1]", "db"].includes(url.hostname), `${variavel} deve apontar para um banco local`);
    return url;
  });

  assert.equal(urls[0].pathname, "/grao_a_grao");
  assert.equal(urls[1].pathname, "/grao_a_grao_teste");
  assert.notEqual(urls[0].pathname, urls[1].pathname);

  for (const url of urls) {
    const prisma = new PrismaClient({ datasources: { db: { url: url.href } } });
    try {
      const resultado = await prisma.$queryRaw<Array<{ resultado: bigint }>>`SELECT 1 AS resultado`;
      assert.equal(Number(resultado[0].resultado), 1);
    } finally {
      await prisma.$disconnect();
    }
  }
});
