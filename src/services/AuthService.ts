import { compare, hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import jwt, { type SignOptions } from "jsonwebtoken";
import { AppError } from "../errors/AppError.js";
import { ErrorMessages } from "../errors/ErrorMessages.js";
import { UsuariosRepository } from "../repositories/UsuariosRepository.js";
import type { LoginInputDto, LoginResponseDto, RegistrarUsuarioInputDto, RegistrarUsuarioResponseDto } from "../dtos/AuthDtos.js";

const repository = new UsuariosRepository();
let hashFicticio: Promise<string> | undefined;

export class AuthService {
  async registrar(entrada: RegistrarUsuarioInputDto): Promise<RegistrarUsuarioResponseDto> {
    try {
      const usuario = await repository.criar({
        nome: entrada.nome,
        email: entrada.email,
        senhaHash: await hash(entrada.senha, Number(process.env.BCRYPT_COST ?? 10)),
      });
      return { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: "ATENDENTE", ativo: usuario.ativo };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(ErrorMessages.USER_ALREADY_EXISTS, 409, "USER_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  async login(entrada: LoginInputDto): Promise<LoginResponseDto> {
    const { email, senha } = entrada;
    const usuario = await repository.buscarPorEmail(email);
    hashFicticio ??= hash("senha fictícia para comparação", Number(process.env.BCRYPT_COST ?? 10));
    const senhaCorreta = await compare(senha, usuario?.senhaHash ?? await hashFicticio);
    if (!usuario || !usuario.ativo || !senhaCorreta) {
      throw new AppError(ErrorMessages.INVALID_CREDENTIALS, 401, "INVALID_CREDENTIALS");
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
