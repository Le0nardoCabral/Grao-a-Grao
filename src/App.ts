import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Routes } from "./Routes.js";

export const App = express();
App.use(helmet());
App.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? false }));
App.use(express.json());
App.use(Routes);
