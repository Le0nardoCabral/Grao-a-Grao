import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/AppError.js";
import { ErrorMessages } from "../errors/ErrorMessages.js";

export const Validate = (schema: ZodType, source: "body" | "params" | "query" = "body"): RequestHandler => (request, _response, next) => {
  if (source === "body" && !request.is("application/json")) {
    return next(new AppError(ErrorMessages.VALIDATION_ERROR, 400, "VALIDATION_ERROR", [{ campo: "Content-Type", mensagem: ErrorMessages.CONTENT_TYPE_JSON_REQUIRED }]));
  }
  const result = schema.safeParse(request[source]);
  if (!result.success) {
    const detalhes = result.error.issues.flatMap((issue) => issue.code === "unrecognized_keys"
      ? issue.keys.map((chave) => ({ campo: [...issue.path, chave].join("."), mensagem: ErrorMessages.UNKNOWN_FIELD }))
      : [{ campo: issue.path.join("."), mensagem: ErrorMessages.INVALID_VALUE }]);
    return next(new AppError(ErrorMessages.VALIDATION_ERROR, 400, "VALIDATION_ERROR", detalhes));
  }
  if (source === "body") request.body = result.data;
  return next();
};
