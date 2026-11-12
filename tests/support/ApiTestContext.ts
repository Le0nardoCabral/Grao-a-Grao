import type { Perfil, PrismaClient } from "@prisma/client";
import {
  criarCliente,
  criarClienteTeste,
  criarPlano,
  criarProduto,
  criarUsuario,
  iniciarServidor,
  limparTabelas,
  obterToken,
} from "./AuxiliarTeste.js";

const tabelas = ["usoCashback", "itemCompra", "loteCashback", "compra", "cliente", "produto", "plano", "usuario"] as const;

export async function iniciarContextoApi() {
  await limparTabelas([...tabelas]);
  const servidor = await iniciarServidor();
  let encerrado = false;

  return {
    url: servidor.url,
    criarUsuario: (perfil: Perfil, senha: string) => criarUsuario(perfil, senha),
    criarPlano,
    criarCliente,
    criarProduto,
    obterToken: (email: string, senha: string) => obterToken(servidor.url, email, senha),
    consultarBanco: async <T>(consulta: (prisma: PrismaClient) => Promise<T>): Promise<T> => {
      const prisma = criarClienteTeste();
      try {
        return await consulta(prisma);
      } finally {
        await prisma.$disconnect();
      }
    },
    encerrar: async () => {
      if (encerrado) return;
      encerrado = true;
      try {
        await servidor.encerrar();
      } finally {
        await limparTabelas([...tabelas]);
      }
    },
  };
}
