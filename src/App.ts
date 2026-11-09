import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Routes } from "./Routes.js";
import { AppError } from "./errors/AppError.js";
import { ErrorHandler } from "./middlewares/ErrorHandler.js";
import { ErrorCodes } from "./errors/ErrorCodes.js";

export const App = express();
App.use((request, response, next) => {
  const docs = request.path === "/docs" || request.path.startsWith("/docs/");
  return helmet(docs ? { contentSecurityPolicy: { directives: { scriptSrc: ["'self'", "'unsafe-inline'"], styleSrc: ["'self'", "'unsafe-inline'"] } } } : {})(request, response, next);
});
App.use(cors({ origin: (process.env.CORS_ORIGIN ?? "").split(",").map((origem) => origem.trim()).filter(Boolean) }));
App.use(express.json({ limit: "100kb" }));
App.use(Routes);
App.use((_request, _response, next) => next(new AppError("Rota não encontrada.", ErrorCodes.NOT_FOUND, "NOT_FOUND")));
App.use(ErrorHandler);
