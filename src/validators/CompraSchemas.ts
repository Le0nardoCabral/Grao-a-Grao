import { z } from "zod";

export const CriarCompraSchema = z.object({
  clienteId: z.number().int().positive().safe(),
  itens: z.array(z.object({
    produtoId: z.number().int().positive().safe(),
    quantidade: z.number().int().positive().max(1_000).safe(),
  }).strict()).min(1).max(100),
  cashbackSolicitadoCentavos: z.number().int().nonnegative().safe().optional(),
}).strict().superRefine((compra, context) => {
  if (compra.cashbackSolicitadoCentavos !== undefined && compra.cashbackSolicitadoCentavos > 100_000_000) {
    context.addIssue({ code: "custom", path: ["cashbackSolicitadoCentavos"], message: "Valor acima do limite permitido." });
  }
  const produtoIds = compra.itens.map((item) => item.produtoId);
  if (new Set(produtoIds).size !== produtoIds.length) {
    context.addIssue({ code: "custom", path: ["itens"], message: "Cada produto deve aparecer uma única vez." });
  }
});

export const IdempotencyKeySchema = z.string().min(1).max(64);
