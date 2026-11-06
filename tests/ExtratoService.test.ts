import assert from "node:assert/strict";
import test from "node:test";
import { AppError } from "../src/errors/AppError.js";
import {
  ExtratoService,
  type ExtratoRepositoryPort,
} from "../src/services/ExtratoService.js";

const now = new Date("2026-11-06T15:00:00.000Z");

function createRepository(overrides: Partial<ExtratoRepositoryPort> = {}): ExtratoRepositoryPort {
  return {
    buscarCliente: async () => ({ id: 1, ativo: true }),
    buscarSaldoDisponivel: async () => 3_000,
    buscarLotesAVencer: async () => [
      { id: 3, saldoCentavos: 3_000, venceEm: new Date("2026-11-20T15:00:00.000Z") },
    ],
    buscarCreditosRecentes: async () => [
      {
        id: 3,
        compraOrigemId: 10,
        valorOriginalCentavos: 4_000,
        geradoEm: new Date("2026-10-01T15:00:00.000Z"),
      },
    ],
    buscarUsosRecentes: async () => [
      {
        compraId: 11,
        loteId: 3,
        valorCentavos: 1_000,
        criadoEm: new Date("2026-10-15T15:00:00.000Z"),
      },
    ],
    buscarExpiracoesRecentes: async () => [
      { id: 2, saldoCentavos: 500, venceEm: new Date("2026-11-01T15:00:00.000Z") },
    ],
    ...overrides,
  };
}

test("monta saldo, lotes a vencer e movimentos em ordem decrescente", async () => {
  const service = new ExtratoService(createRepository());

  const result = await service.executar(1, false, now);

  assert.equal(result.saldoDisponivelCentavos, 3_000);
  assert.equal(result.lotesAVencer.length, 1);
  assert.deepEqual(result.movimentos.map((movement) => movement.tipo), [
    "EXPIRACAO",
    "USO",
    "CREDITO",
  ]);
  assert.equal(result.movimentos[0]?.compraId, null);
});

test("oculta cliente inativo quando o filtro não foi autorizado", async () => {
  const service = new ExtratoService(createRepository({
    buscarCliente: async () => ({ id: 1, ativo: false }),
  }));

  await assert.rejects(
    service.executar(1, false, now),
    (error: unknown) => error instanceof AppError
      && error.statusCode === 404
      && error.code === "CLIENT_NOT_FOUND",
  );
});
