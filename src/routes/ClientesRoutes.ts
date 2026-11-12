import { Router } from "express";
import { ClientesController } from "../controllers/ClientesController.js";
import { Authenticate } from "../middlewares/Authenticate.js";
import { AuthorizeRole } from "../middlewares/AuthorizeRole.js";
import { Validate } from "../middlewares/Validate.js";
import {
  AtualizarClienteSchema,
  ClienteIdSchema,
  CriarClienteSchema,
  IncluirInativosSchema,
  ListarClientesSchema,
  TrocarPlanoSchema,
} from "../validators/ClienteSchemas.js";
export const ClientesRoutes = Router();
ClientesRoutes.post("/", Authenticate, AuthorizeRole("ADMIN", "ATENDENTE"), Validate(CriarClienteSchema), ClientesController.criar);
ClientesRoutes.get("/", Authenticate, AuthorizeRole("ADMIN", "ATENDENTE"), Validate(ListarClientesSchema, "query"), ClientesController.listar);
ClientesRoutes.get(
  "/:id/extrato",
  Authenticate,
  AuthorizeRole("ADMIN", "ATENDENTE"),
  Validate(ClienteIdSchema, "params"),
  Validate(IncluirInativosSchema, "query"),
  ClientesController.extrato,
);
ClientesRoutes.post(
  "/:id/trocar-plano",
  Authenticate,
  AuthorizeRole("ADMIN"),
  Validate(ClienteIdSchema, "params"),
  Validate(TrocarPlanoSchema),
  ClientesController.trocarPlano,
);
ClientesRoutes.post(
  "/:id/reativar",
  Authenticate,
  AuthorizeRole("ADMIN"),
  Validate(ClienteIdSchema, "params"),
  ClientesController.reativar,
);
ClientesRoutes.get(
  "/:id",
  Authenticate,
  AuthorizeRole("ADMIN", "ATENDENTE"),
  Validate(ClienteIdSchema, "params"),
  Validate(IncluirInativosSchema, "query"),
  ClientesController.buscarPorId,
);
ClientesRoutes.put(
  "/:id",
  Authenticate,
  AuthorizeRole("ADMIN", "ATENDENTE"),
  Validate(ClienteIdSchema, "params"),
  Validate(AtualizarClienteSchema),
  ClientesController.atualizar,
);
ClientesRoutes.delete(
  "/:id",
  Authenticate,
  AuthorizeRole("ADMIN"),
  Validate(ClienteIdSchema, "params"),
  ClientesController.desativar,
);
