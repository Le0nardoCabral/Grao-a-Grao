import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { ErrorMessages } from "../errors/ErrorMessages.js";

export const AuthorizeRole = (...profiles: Array<"ADMIN" | "ATENDENTE">): RequestHandler => (request, _response, next) => {
  if (!request.auth) return next(new AppError(ErrorMessages.AUTHENTICATION_REQUIRED, 401, "UNAUTHENTICATED"));
  if (!profiles.includes(request.auth.perfil)) return next(new AppError(ErrorMessages.ACCESS_FORBIDDEN, 403, "FORBIDDEN"));
  return next();
};
