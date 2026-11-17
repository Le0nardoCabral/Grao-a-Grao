import type { Prisma } from "@prisma/client";
import { prisma } from "./PrismaClient.js";

export class ProdutosRepository {
  criar(data: Prisma.ProdutoCreateInput) {
    return prisma.produto.create({ data });
  }

  listar(incluirInativos = false) {
    return prisma.produto.findMany({
      where: incluirInativos ? undefined : { ativo: true },
      orderBy: { nome: "asc" },
    });
  }

  buscarPorId(id: number) {
    return prisma.produto.findUnique({ where: { id } });
  }

  atualizar(id: number, data: Prisma.ProdutoUpdateInput) {
    return prisma.produto.update({ where: { id }, data });
  }

  desativar(id: number) {
    return prisma.produto.update({ where: { id }, data: { ativo: false } });
  }

  reativar(id: number) {
    return prisma.produto.updateMany({ where: { id, ativo: false }, data: { ativo: true } });
  }
}
