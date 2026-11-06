
import "dotenv/config";
import { hash } from "bcryptjs";
import { Perfil } from "@prisma/client";
import { prisma } from "../src/repositories/PrismaClient.js";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Configure SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD no .env."
    );
  }

  if (password.length < 12 || password.length > 72) {
    throw new Error("A senha deve ter entre 12 e 72 caracteres.");
  }

  const existente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existente) {
    throw new Error(
      "Já existe um usuário com esse e-mail. Nenhum cadastro foi alterado."
    );
  }

  const senhaHash = await hash(password, 12);

  const admin = await prisma.usuario.create({
    data: {
      nome: "Administrador de teste",
      email,
      senhaHash,
      perfil: Perfil.ADMIN,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
    },
  });

  console.log("Administrador criado com sucesso!");
  console.log(admin);
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao criar administrador:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
