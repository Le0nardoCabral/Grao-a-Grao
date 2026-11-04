import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export const ErrorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      erro: { codigo: error.code, mensagem: error.message, ...(error.details ? { detalhes: error.details } : {}) },
    });
    return;
  }

  console.error(error);
  response.status(500).json({ erro: { codigo: "INTERNAL_ERROR", mensagem: "Erro interno do servidor." } });
};
