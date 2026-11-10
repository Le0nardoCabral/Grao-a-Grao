import assert from "node:assert/strict";
import test from "node:test";
import { criarClienteTeste } from "./AuxiliarTeste.js";

test("a tabela Plano tem a coluna mensalidadeCentavos", async () => {
  const prisma = criarClienteTeste();
  try {
    const colunas = await prisma.$queryRaw<Array<{ nome: string }>>`
      SELECT COLUMN_NAME AS nome FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Plano'
        AND COLUMN_NAME = 'mensalidadeCentavos'
    `;
    assert.equal(colunas.length, 1);
  } finally {
    await prisma.$disconnect();
  }
});
