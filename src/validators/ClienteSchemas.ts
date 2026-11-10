import { z } from "zod";

export const CriarClienteSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(190)
    .transform((email) => email.toLowerCase())
    .nullable()
    .optional(),
  telefone: z.string().trim().min(8).max(30).nullable().optional(),
  dataNascimento: z.iso.date()
    .transform((date) => new Date(`${date}T00:00:00.000Z`))
    .nullable()
    .optional(),
  planoId: z.number().int().positive().safe(),
}).strict();

export const ListarClientesSchema = z.object({
  page: z.string()
    .regex(/^[1-9]\d*$/)
    .refine((valor) => Number.isSafeInteger(Number(valor)))
    .optional(),

  limit: z.string()
    .regex(/^[1-9]\d*$/)
    .refine((valor) => Number(valor) <= 100)
    .optional(),

  busca: z.string()
    .refine((valor) => valor.trim().length > 0)
    .optional(),

  planoId: z.string()
    .regex(/^[1-9]\d*$/)
    .refine((valor) => Number.isSafeInteger(Number(valor)))
    .optional(),

  ativo: z.enum(["true", "false"]).optional(),
}).strict();

export const ClienteIdSchema = z.object({
  id: z.coerce.number().int().positive().safe(),
}).strict();

export const TrocarPlanoSchema = z.object({
  planoId: z.number().int().positive().safe(),
}).strict();

export const IncluirInativosSchema = z.object({
  incluirInativos: z.enum(["true", "false"]).optional().default("false"),
}).strict();
