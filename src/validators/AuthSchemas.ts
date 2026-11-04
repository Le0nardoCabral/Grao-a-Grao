import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email(),
  senha: z.string().min(1).max(200),
});
