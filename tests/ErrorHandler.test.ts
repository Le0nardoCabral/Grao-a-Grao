import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { ErrorHandler } from "../src/middlewares/ErrorHandler.js";

test("erro interno responde 500 sem expor mensagem ou stack ao cliente", () => {
  let statusCode = 0;
  let payload: unknown;
  const response = {
    status(code: number) { statusCode = code; return this; },
    json(body: unknown) { payload = body; return this; },
  } as unknown as Response;
  const logOriginal = console.error;
  console.error = () => undefined;
  try {
    ErrorHandler(new Error("segredo-interno"), {} as Request, response, () => undefined);
  } finally {
    console.error = logOriginal;
  }

  assert.equal(statusCode, 500);
  assert.deepEqual(payload, { erro: { codigo: "INTERNAL_ERROR", mensagem: "Erro interno do servidor." } });
  assert.doesNotMatch(JSON.stringify(payload), /segredo-interno|stack/i);
});
