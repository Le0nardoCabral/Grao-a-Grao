import { compare, hash } from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { AppError } from "../errors/AppError.js";
import { UsuariosRepository } from "../repositories/UsuariosRepository.js";

const repository = new UsuariosRepository();
let hashFicticio: Promise<string> | undefined;

export class AuthService {
  async login(email: string, senha: string) {
    const usuario = await repository.buscarPorEmail(email);
    hashFicticio ??= hash("senha fictícia para comparação", Number(process.env.BCRYPT_COST ?? 10));
    const senhaCorreta = await compare(senha, usuario?.senhaHash ?? await hashFicticio);
    if (!usuario || !usuario.ativo || !senhaCorreta) {
      throw new AppError("E-mail ou senha inválidos.", 401, "INVALID_CREDENTIALS");
    }

    const secret = process.env.JWT_SECRET!;

    const expiresIn = (process.env.JWT_EXPIRES_IN ?? "1d") as SignOptions["expiresIn"];
    const token = jwt.sign({ perfil: usuario.perfil }, secret, { subject: String(usuario.id), expiresIn });
    return {
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    };
  }
}
