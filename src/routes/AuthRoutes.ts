import { Router } from "express";
import { NotImplemented } from "./NotImplemented.js";
import { AuthController } from "../controllers/AuthController.js";
import { Validate } from "../middlewares/Validate.js";
import { LoginSchema } from "../validators/AuthSchemas.js";
export const AuthRoutes = Router();
AuthRoutes.post("/register", NotImplemented);
AuthRoutes.post("/login", Validate(LoginSchema), AuthController.login);
