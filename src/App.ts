import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Routes } from "./Routes.js";
import { AppError } from "./errors/AppError.js";
import { ErrorHandler } from "./middlewares/ErrorHandler.js";

export const App = express();
App.use(helmet());
App.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? false }));
App.use(express.json());
App.use(Routes);
App.use((_request, _response, next) => next(new AppError("Rota não encontrada.", 404, "NOT_FOUND")));
App.use(ErrorHandler);
