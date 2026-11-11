import { Router } from "express";
import { PlanosController } from "../controllers/PlanosController.js";
import { Authenticate } from "../middlewares/Authenticate.js";
import { AuthorizeRole } from "../middlewares/AuthorizeRole.js";
import { Validate } from "../middlewares/Validate.js";
import {
  AtualizarPlanoSchema,
  CriarPlanoSchema,
  IncluirInativosPlanoSchema,
  ListarPlanosSchema,
  PlanoIdSchema,
} from "../validators/PlanoSchemas.js";

export const PlanosRoutes = Router();

PlanosRoutes.use(Authenticate);
PlanosRoutes.post(
  "/",
  AuthorizeRole("ADMIN"),
  Validate(CriarPlanoSchema),
  PlanosController.criar,
);
PlanosRoutes.get(
  "/",
  AuthorizeRole("ADMIN", "ATENDENTE"),
  Validate(ListarPlanosSchema, "query"),
  PlanosController.listar,
);
PlanosRoutes.post(
  "/:id/reativar",
  AuthorizeRole("ADMIN"),
  Validate(PlanoIdSchema, "params"),
  PlanosController.reativar,
);
PlanosRoutes.get(
  "/:id",
  AuthorizeRole("ADMIN", "ATENDENTE"),
  Validate(PlanoIdSchema, "params"),
  Validate(IncluirInativosPlanoSchema, "query"),
  PlanosController.buscarPorId,
);
PlanosRoutes.put(
  "/:id",
  AuthorizeRole("ADMIN"),
  Validate(PlanoIdSchema, "params"),
  Validate(AtualizarPlanoSchema),
  PlanosController.atualizar,
);
PlanosRoutes.delete(
  "/:id",
  AuthorizeRole("ADMIN"),
  Validate(PlanoIdSchema, "params"),
  PlanosController.excluir,
);
