import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export const AuthorizeRole = (...profiles: Array<"ADMIN" | "ATENDENTE">): RequestHandler => (request, _response, next) => {
  if (!request.auth) return next(new AppError("Autenticação obrigatória.", 401, "UNAUTHENTICATED"));
  if (!profiles.includes(request.auth.perfil)) return next(new AppError("Acesso não permitido para este perfil.", 403, "FORBIDDEN"));
  return next();
};
