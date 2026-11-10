import jwt, { type JwtPayload } from "jsonwebtoken";
import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";
import { UsuariosRepository } from "../repositories/UsuariosRepository.js";

const usuariosRepository = new UsuariosRepository();

export const Authenticate: RequestHandler = async (request, _response, next) => {
  const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return next(new AppError("Token de autenticação ausente.", 401, "UNAUTHENTICATED"));

  const secret = process.env.JWT_SECRET!;

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, secret) as JwtPayload;
  } catch {
    return next(new AppError("Token inválido ou expirado.", 401, "UNAUTHENTICATED"));
  }

  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId)) return next(new AppError("Token inválido.", 401, "UNAUTHENTICATED"));
  const usuario = await usuariosRepository.buscarPorId(userId);
  if (!usuario || !usuario.ativo) return next(new AppError("Usuário inválido ou inativo.", 401, "UNAUTHENTICATED"));
  request.auth = { userId, perfil: usuario.perfil };
  return next();
};
