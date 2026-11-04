import type { RequestHandler } from "express";
import { AuthService } from "../services/AuthService.js";

const service = new AuthService();

export class AuthController {
  static login: RequestHandler = async (request, response) => {
    response.status(200).json(await service.login(request.body.email, request.body.senha));
  };
}
