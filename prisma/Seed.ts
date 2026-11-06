import "dotenv/config";
import { hash } from "bcryptjs";
import { Perfil, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initialPlans = [
  {
    nome: "Básico",
    percentualBps: 200,
    limiteCentavos: 20_000,
    minimoUsoCentavos: 2_000,
    dobroAniversario: false,
    validadeDias: 180,
  },
  {
    nome: "Intermediário",
    percentualBps: 500,
    limiteCentavos: 50_000,
    minimoUsoCentavos: 2_000,
    dobroAniversario: true,
    validadeDias: 180,
  },
  {
    nome: "Premium",
    percentualBps: 800,
    limiteCentavos: 100_000,
    minimoUsoCentavos: 0,
    dobroAniversario: true,
    validadeDias: 180,
  },
];

function requiredSeedValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Configure ${name} no arquivo .env antes de executar o seed.`);
  return value;
}

function bcryptCost(): number {
  const value = Number(process.env.BCRYPT_COST ?? 10);
  if (!Number.isInteger(value) || value < 4 || value > 31) {
    throw new Error("BCRYPT_COST deve ser um inteiro entre 4 e 31.");
  }
  return value;
}

function validatePassword(password: string): void {
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("SEED_ADMIN_PASSWORD deve ter ao menos 8 caracteres e no máximo 72 bytes.");
  }
}

async function main(): Promise<void> {
  const adminEmail = requiredSeedValue("SEED_ADMIN_EMAIL").toLowerCase();
  const adminPassword = requiredSeedValue("SEED_ADMIN_PASSWORD");
  const adminName = process.env.SEED_ADMIN_NAME?.trim() || "Administrador";
  validatePassword(adminPassword);

  for (const plan of initialPlans) {
    await prisma.plano.upsert({
      where: { nome: plan.nome },
      update: {},
      create: plan,
    });
  }

  const existingAdmin = await prisma.usuario.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });

  if (!existingAdmin) {
    await prisma.usuario.create({
      data: {
        nome: adminName,
        email: adminEmail,
        senhaHash: await hash(adminPassword, bcryptCost()),
        perfil: Perfil.ADMIN,
      },
    });
  }

  console.log("Carga inicial concluída: planos e primeiro administrador estão disponíveis.");
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao executar a carga inicial:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
