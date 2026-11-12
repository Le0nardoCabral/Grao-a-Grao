import type { Request, Response } from "express";
import { ErrorMessages } from "../errors/ErrorMessages.js";

export const NotImplemented = (_request: Request, response: Response): void => {
  response.status(501).json({ erro: ErrorMessages.FIELD_NOT_IMPLEMENTED });
};
