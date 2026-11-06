import assert from "node:assert/strict";
import test from "node:test";
import {
  adicionarDiasEmBrasilia,
  mesEmBrasilia,
} from "../src/services/CashbackDateService.js";

test("adiciona dias preservando o horário local de Brasília", () => {
  const generatedAt = new Date("2026-01-15T15:30:45.123Z");

  assert.equal(
    adicionarDiasEmBrasilia(generatedAt, 180).toISOString(),
    "2026-07-14T15:30:45.123Z",
  );
});

test("identifica o mês atual pelo horário de Brasília", () => {
  const instantAtStartOfDecemberInUtc = new Date("2026-12-01T01:30:00.000Z");

  assert.equal(mesEmBrasilia(instantAtStartOfDecemberInUtc), 11);
});
