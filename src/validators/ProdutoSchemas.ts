import { z } from "zod";

export const CriarProdutoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().trim().max(2_000).nullable().optional(),
  precoCentavos: z.number().int().positive().safe(),
});

export const AtualizarProdutoSchema = CriarProdutoSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "Informe ao menos um campo para atualizar.",
);

export const ProdutoIdSchema = z.object({ id: z.coerce.number().int().positive().safe() });
export const ListarProdutosSchema = z.object({
  incluirInativos: z.enum(["true", "false"]).optional().default("false"),
});
