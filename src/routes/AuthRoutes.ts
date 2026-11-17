import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { Authenticate } from "../middlewares/Authenticate.js";
import { AuthorizeRole } from "../middlewares/AuthorizeRole.js";
import { Validate } from "../middlewares/Validate.js";
import { LoginSchema, RegistrarUsuarioSchema } from "../validators/AuthSchemas.js";
export const AuthRoutes = Router();
AuthRoutes.post("/register", Authenticate, AuthorizeRole("ADMIN"), Validate(RegistrarUsuarioSchema), AuthController.registrar);
AuthRoutes.post("/login", Validate(LoginSchema), AuthController.login);
