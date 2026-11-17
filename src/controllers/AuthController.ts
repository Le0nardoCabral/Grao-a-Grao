import type { RequestHandler } from "express";
import { AuthService } from "../services/AuthService.js";
import type { LoginInputDto, LoginResponseDto, RegistrarUsuarioInputDto, RegistrarUsuarioResponseDto } from "../dtos/AuthDtos.js";

const service = new AuthService();

export class AuthController {
  static registrar: RequestHandler = async (request, response) => {
    const usuario: RegistrarUsuarioResponseDto = await service.registrar(request.body as RegistrarUsuarioInputDto);
    response.status(201).json(usuario);
  };

  static login: RequestHandler = async (request, response) => {
    const entrada = request.body as LoginInputDto;
    const saida: LoginResponseDto = await service.login(entrada);
    response.status(200).json(saida);
  };
}
