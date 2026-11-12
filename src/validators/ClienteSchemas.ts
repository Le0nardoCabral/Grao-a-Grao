import { z } from "zod";

function hojeEmBrasilia(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

const dataNascimentoSchema = z.iso.date()
  .refine((data) => data >= "1900-01-01" && data <= hojeEmBrasilia())
  .transform((data) => new Date(`${data}T00:00:00.000Z`))
  .nullable()
  .optional();

const CamposClienteSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(190)
    .transform((email) => email.toLowerCase())
    .nullable()
    .optional(),
  telefone: z.string().trim().min(8).max(30).nullable().optional(),
  dataNascimento: dataNascimentoSchema,
}).strict();

export const CriarClienteSchema = CamposClienteSchema.extend({
  planoId: z.number().int().positive().safe(),
});

export const AtualizarClienteSchema = CamposClienteSchema
  .refine((data) => Object.keys(data).length > 0);

export const ListarClientesSchema = z.object({
  pagina: z.string()
    .regex(/^[1-9]\d*$/)
    .refine((valor) => Number.isSafeInteger(Number(valor)))
    .optional(),
  limite: z.string()
    .regex(/^[1-9]\d*$/)
    .refine((valor) => Number(valor) <= 100)
    .optional(),
  incluirInativos: z.enum(["true", "false"]).optional().default("false"),
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
