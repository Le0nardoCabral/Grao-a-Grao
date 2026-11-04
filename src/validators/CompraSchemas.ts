import { z } from "zod";

export const CriarCompraSchema = z.object({
  clienteId: z.number().int().positive().safe(),
  itens: z.array(z.object({
    produtoId: z.number().int().positive().safe(),
    quantidade: z.number().int().positive().safe(),
  })).min(1).max(100),
  cashbackSolicitadoCentavos: z.number().int().nonnegative().safe().optional(),
});
