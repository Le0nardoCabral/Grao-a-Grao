import { Router } from "express";
import { ComprasController } from "../controllers/ComprasController.js";
import { Authenticate } from "../middlewares/Authenticate.js";
import { AuthorizeRole } from "../middlewares/AuthorizeRole.js";
import { Validate } from "../middlewares/Validate.js";
import { CriarCompraSchema } from "../validators/CompraSchemas.js";
export const ComprasRoutes = Router();
ComprasRoutes.post("/", Authenticate, AuthorizeRole("ADMIN", "ATENDENTE"), Validate(CriarCompraSchema), ComprasController.criar);
