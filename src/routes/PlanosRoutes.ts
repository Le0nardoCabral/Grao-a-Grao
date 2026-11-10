import { Router } from "express";
import { PlanosController } from "../controllers/PlanosController.js";
import { NotImplemented } from "./NotImplemented.js";

export const PlanosRoutes = Router();

PlanosRoutes.post("/", PlanosController.criar);
PlanosRoutes.get("/", PlanosController.listar);
PlanosRoutes.get("/:id", PlanosController.buscarPorId);
PlanosRoutes.put("/:id", NotImplemented);
PlanosRoutes.delete("/:id", NotImplemented);