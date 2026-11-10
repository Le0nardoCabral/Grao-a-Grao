import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  senha: z.string().min(1).refine((senha) => Buffer.byteLength(senha, "utf8") <= 72, "Senha excede 72 bytes."),
}).strict();
