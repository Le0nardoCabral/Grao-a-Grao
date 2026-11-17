import { prisma } from "./PrismaClient.js";

export class UsuariosRepository {
  criar(data: { nome: string; email: string; senhaHash: string }) {
    return prisma.usuario.create({ data: { ...data, perfil: "ATENDENTE" } });
  }

  buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email } });
  }

  buscarPorId(id: number) {
    return prisma.usuario.findUnique({ where: { id } });
  }
}
