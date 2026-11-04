import { prisma } from "./PrismaClient.js";

export class UsuariosRepository {
  buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email } });
  }

  buscarPorId(id: number) {
    return prisma.usuario.findUnique({ where: { id } });
  }
}
