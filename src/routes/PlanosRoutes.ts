
import { Router } from "express";
import { PlanosController } from "../controllers/PlanosController.js";
import { NotImplemented } from "./NotImplemented.js";

export const PlanosRoutes = Router();

PlanosRoutes.post("/", NotImplemented);
PlanosRoutes.get("/", PlanosController.listar);
PlanosRoutes.get("/:id", NotImplemented);
PlanosRoutes.put("/:id", NotImplemented);
PlanosRoutes.delete("/:id", NotImplemented);
