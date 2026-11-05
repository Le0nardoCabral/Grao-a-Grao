import { z } from "zod";

export const CriarClienteSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(190).transform((email) => email.toLowerCase()).nullable().optional(),
  telefone: z.string().trim().min(8).max(30).nullable().optional(),
  dataNascimento: z.iso.date().transform((date) => new Date(`${date}T00:00:00.000Z`)).nullable().optional(),
  planoId: z.number().int().positive().safe(),
});
