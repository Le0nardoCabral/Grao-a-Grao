import { compare } from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { AppError } from "../errors/AppError.js";
import { UsuariosRepository } from "../repositories/UsuariosRepository.js";

const repository = new UsuariosRepository();

export class AuthService {
  async login(email: string, senha: string) {
    const usuario = await repository.buscarPorEmail(email);
    if (!usuario || !usuario.ativo || !(await compare(senha, usuario.senhaHash))) {
      throw new AppError("E-mail ou senha inválidos.", 401, "INVALID_CREDENTIALS");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret || secret === "replace-with-a-long-random-secret") {
      throw new AppError("Configure um JWT_SECRET seguro no ambiente.", 500, "CONFIGURATION_ERROR");
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"];
    const token = jwt.sign({ perfil: usuario.perfil }, secret, { subject: String(usuario.id), expiresIn });
    return {
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    };
  }
}
