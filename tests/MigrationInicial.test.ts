import "dotenv/config";
import assert from "node:assert/strict";
import test from "node:test";
import { PrismaClient } from "@prisma/client";

test("as oito tabelas respondem a uma contagem", async () => {
  const endereco = process.env.DATABASE_URL_TEST;
  assert.ok(endereco, "DATABASE_URL_TEST deve estar definida");
  const url = new URL(endereco);
  assert.equal(url.protocol, "mysql:");
  assert.ok(["localhost", "127.0.0.1", "[::1]", "db"].includes(url.hostname));
  assert.equal(url.pathname, "/grao_a_grao_teste");
  const prisma = new PrismaClient({ datasources: { db: { url: endereco } } });
  try {
    await prisma.$queryRaw`SELECT COUNT(*) FROM Usuario`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM Plano`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM Produto`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM Cliente`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM Compra`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM ItemCompra`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM LoteCashback`;
    await prisma.$queryRaw`SELECT COUNT(*) FROM UsoCashback`;
  } finally {
    await prisma.$disconnect();
  }
});
