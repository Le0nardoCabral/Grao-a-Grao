import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  senha: z.string().min(1).refine((senha) => Buffer.byteLength(senha, "utf8") <= 72, "Senha excede 72 bytes."),
}).strict();

export const RegistrarUsuarioSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.email().max(190).transform((email) => email.toLowerCase()),
  senha: z.string().min(8).refine((senha) => Buffer.byteLength(senha, "utf8") <= 72, "Senha deve ter no máximo 72 bytes."),
}).strict();
