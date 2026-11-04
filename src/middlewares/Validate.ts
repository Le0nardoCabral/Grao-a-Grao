import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/AppError.js";

export const Validate = (schema: ZodType, source: "body" | "params" | "query" = "body"): RequestHandler => (request, _response, next) => {
  const result = schema.safeParse(request[source]);
  if (!result.success) {
    return next(new AppError("Dados da requisição inválidos.", 400, "VALIDATION_ERROR", result.error.issues));
  }
  if (source === "body") request.body = result.data;
  return next();
};
