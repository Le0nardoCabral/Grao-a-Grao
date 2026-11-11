import { z } from "zod";

const dinheiroPlanoSchema = z.number().int().min(0).max(100_000_000).safe();

const CamposPlanoSchema = z.object({
  nome: z.string().trim().min(2).max(80),
  percentualBps: z.number().int().min(1).max(5_000).safe(),
  limiteCentavos: z.number().int().positive().max(100_000_000).safe(),
  mensalidadeCentavos: dinheiroPlanoSchema,
  minimoUsoCentavos: dinheiroPlanoSchema,
  dobroAniversario: z.boolean().default(false),
  validadeDias: z.number().int().min(1).max(3_650).safe().default(180),
}).strict();

export const CriarPlanoSchema = CamposPlanoSchema.refine(
  (data) => data.minimoUsoCentavos <= data.limiteCentavos,
  {
    path: ["minimoUsoCentavos"],
    message: "Não pode superar o limiteCentavos.",
  },
);

export const AtualizarPlanoSchema = CamposPlanoSchema.partial()
  .refine((data) => Object.keys(data).length > 0, "Informe ao menos um campo para atualizar.");

export const PlanoIdSchema = z.object({
  id: z.coerce.number().int().positive().safe(),
}).strict();

export const ListarPlanosSchema = z.object({
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

export const IncluirInativosPlanoSchema = z.object({
  incluirInativos: z.enum(["true", "false"]).optional().default("false"),
}).strict();
