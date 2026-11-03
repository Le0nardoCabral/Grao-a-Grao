import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const planos = [
  { nome: "Básico", percentualBps: 200, limiteCentavos: 20_000, minimoUsoCentavos: 2_000, dobroAniversario: false, validadeDias: 180 },
  { nome: "Intermediário", percentualBps: 500, limiteCentavos: 50_000, minimoUsoCentavos: 2_000, dobroAniversario: true, validadeDias: 180 },
  { nome: "Premium", percentualBps: 800, limiteCentavos: 100_000, minimoUsoCentavos: 0, dobroAniversario: true, validadeDias: 180 },
];

await Promise.all(planos.map((plano) => prisma.plano.upsert({
  where: { nome: plano.nome }, update: plano, create: plano,
})));
await prisma.$disconnect();
