import type { Request, Response } from "express";

export const NotImplemented = (_request: Request, response: Response): void => {
  response.status(501).json({ erro: "Funcionalidade ainda não implementada." });
};
