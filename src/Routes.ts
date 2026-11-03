import { Router } from "express";
import { AuthRoutes } from "./routes/AuthRoutes.js";
import { ClientesRoutes } from "./routes/ClientesRoutes.js";
import { PlanosRoutes } from "./routes/PlanosRoutes.js";
import { ProdutosRoutes } from "./routes/ProdutosRoutes.js";
import { ComprasRoutes } from "./routes/ComprasRoutes.js";

export const Routes = Router();
Routes.get("/health", (_request, response) => response.status(200).json({ status: "ok", projeto: "Grão a Grão" }));
Routes.use("/auth", AuthRoutes);
Routes.use("/clientes", ClientesRoutes);
Routes.use("/planos", PlanosRoutes);
Routes.use("/produtos", ProdutosRoutes);
Routes.use("/compras", ComprasRoutes);
