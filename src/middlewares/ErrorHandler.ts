import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { ErrorCodes } from "../errors/ErrorCodes.js";

export const ErrorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (typeof error === "object" && error !== null && "type" in error && (error.type === "entity.parse.failed" || error.type === "entity.too.large")) {
    response.status(400).json({ erro: { codigo: "VALIDATION_ERROR", mensagem: "Dados da requisição inválidos.", detalhes: [{ campo: "body", mensagem: error.type === "entity.too.large" ? "Corpo excede 100 KB." : "JSON inválido." }] } });
    return;
  }
  if (error instanceof AppError && Object.hasOwn(ErrorCodes, error.code) && error.code !== "INTERNAL_ERROR") {
    response.status(error.statusCode).json({
      erro: { codigo: error.code, mensagem: error.message, ...(error.code === "VALIDATION_ERROR" && error.details ? { detalhes: error.details } : {}) },
    });
    return;
  }

  if (error instanceof Error) {
    const stack = error.stack?.replace(error.message, "").split("\n").filter((linha) => /^\s+at\s/.test(linha)).join("\n");
    console.error({ name: error.name, stack });
  } else {
    console.error("Erro interno inesperado ao processar requisição.");
  }
  response.status(500).json({ erro: { codigo: "INTERNAL_ERROR", mensagem: "Erro interno do servidor." } });
};
