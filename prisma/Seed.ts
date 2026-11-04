import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient, Perfil, StatusLote } from "@prisma/client";

const prisma = new PrismaClient();

const planosSeed = [
  { nome: "Básico", percentualBps: 200, limiteCentavos: 20_000, minimoUsoCentavos: 2_000, dobroAniversario: false, validadeDias: 180 },
  { nome: "Intermediário", percentualBps: 500, limiteCentavos: 50_000, minimoUsoCentavos: 2_000, dobroAniversario: true, validadeDias: 180 },
  { nome: "Premium", percentualBps: 800, limiteCentavos: 100_000, minimoUsoCentavos: 0, dobroAniversario: true, validadeDias: 180 },
];

const produtosSeed = [
  { nome: "Espresso", descricao: "Café espresso curto", precoCentavos: 750 },
  { nome: "Cappuccino", descricao: "Espresso com leite vaporizado e espuma", precoCentavos: 1_200 },
  { nome: "Latte", descricao: "Espresso com bastante leite vaporizado", precoCentavos: 1_300 },
  { nome: "Mocha", descricao: "Espresso, leite vaporizado e chocolate", precoCentavos: 1_500 },
  { nome: "Café coado", descricao: "Café especial coado na hora", precoCentavos: 800 },
  { nome: "Cold brew", descricao: "Café extraído a frio", precoCentavos: 1_400 },
  { nome: "Pão de queijo", descricao: "Porção individual", precoCentavos: 850 },
  { nome: "Croissant", descricao: "Croissant de manteiga", precoCentavos: 1_100 },
  { nome: "Cookie", descricao: "Cookie artesanal com gotas de chocolate", precoCentavos: 700 },
  { nome: "Bolo de cenoura", descricao: "Fatia com cobertura de chocolate", precoCentavos: 950 },
];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function requiredSeedValue(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Configure ${name} no arquivo .env antes de executar o seed.`);
  return value;
}

async function main(): Promise<void> {
  const planos = await Promise.all(planosSeed.map((plano) => prisma.plano.upsert({
    where: { nome: plano.nome },
    update: plano,
    create: plano,
  })));
  const planoPorNome = new Map(planos.map((plano) => [plano.nome, plano]));

  await Promise.all(produtosSeed.map((produto) => prisma.produto.upsert({
    where: { nome: produto.nome },
    update: { ...produto, ativo: true },
    create: produto,
  })));

  const adminEmail = requiredSeedValue("SEED_ADMIN_EMAIL");
  const adminPassword = requiredSeedValue("SEED_ADMIN_PASSWORD");
  const attendantEmail = requiredSeedValue("SEED_ATTENDANT_EMAIL");
  const attendantPassword = requiredSeedValue("SEED_ATTENDANT_PASSWORD");

  const [adminHash, attendantHash] = await Promise.all([
    hash(adminPassword, 12),
    hash(attendantPassword, 12),
  ]);

  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: { nome: "Administrador de demonstração", senhaHash: adminHash, perfil: Perfil.ADMIN, ativo: true },
    create: { nome: "Administrador de demonstração", email: adminEmail, senhaHash: adminHash, perfil: Perfil.ADMIN },
  });
  const atendente = await prisma.usuario.upsert({
    where: { email: attendantEmail },
    update: { nome: "Atendente de demonstração", senhaHash: attendantHash, perfil: Perfil.ATENDENTE, ativo: true },
    create: { nome: "Atendente de demonstração", email: attendantEmail, senhaHash: attendantHash, perfil: Perfil.ATENDENTE },
  });

  const clientesSeed = [
    { nome: "Ana Cliente Demo", email: "ana.demo@grao.local", telefone: "11999990001", dataNascimento: new Date("1995-07-10T00:00:00.000Z"), plano: "Básico" },
    { nome: "Bruno Cliente Demo", email: "bruno.demo@grao.local", telefone: "11999990002", dataNascimento: new Date("1992-03-15T00:00:00.000Z"), plano: "Intermediário" },
    { nome: "Carla Cliente Demo", email: "carla.demo@grao.local", telefone: "11999990003", dataNascimento: new Date("1998-11-20T00:00:00.000Z"), plano: "Premium" },
  ];

  const clientes = await Promise.all(clientesSeed.map((cliente) => {
    const plano = planoPorNome.get(cliente.plano);
    if (!plano) throw new Error(`Plano não encontrado: ${cliente.plano}`);
    return prisma.cliente.upsert({
      where: { email: cliente.email },
      update: {
        nome: cliente.nome,
        telefone: cliente.telefone,
        dataNascimento: cliente.dataNascimento,
        planoId: plano.id,
        ativo: true,
      },
      create: {
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        dataNascimento: cliente.dataNascimento,
        planoId: plano.id,
      },
    });
  }));

  // Cria histórico de exemplo somente em bancos sem compras, evitando duplicar vendas ao repetir o seed.
  if (await prisma.compra.count() === 0) {
    const cliente = clientes.find((item) => item.email === "ana.demo@grao.local");
    const plano = planoPorNome.get("Básico");
    if (!cliente || !plano) throw new Error("Dados básicos do cliente de demonstração não encontrados.");

    const itensDemo = [
      { nomeProduto: "Mocha", quantidade: 100, diasAtras: 60 },
      { nomeProduto: "Latte", quantidade: 100, diasAtras: 30 },
    ];

    for (const item of itensDemo) {
      const produto = await prisma.produto.findUnique({ where: { nome: item.nomeProduto } });
      if (!produto) throw new Error(`Produto não encontrado: ${item.nomeProduto}`);

      const criadaEm = addDays(new Date(), -item.diasAtras);
      const valorBrutoCentavos = produto.precoCentavos * item.quantidade;
      const cashbackCentavos = Math.floor(valorBrutoCentavos * plano.percentualBps / 10_000);

      await prisma.compra.create({
        data: {
          clienteId: cliente.id,
          usuarioId: atendente.id,
          valorBrutoCentavos,
          cashbackUsadoCentavos: 0,
          valorPagoCentavos: valorBrutoCentavos,
          cashbackGeradoCentavos: cashbackCentavos,
          criadaEm,
          itens: {
            create: {
              produtoId: produto.id,
              quantidade: item.quantidade,
              precoUnitarioCentavos: produto.precoCentavos,
              subtotalCentavos: valorBrutoCentavos,
            },
          },
          loteGerado: {
            create: {
              clienteId: cliente.id,
              valorOriginalCentavos: cashbackCentavos,
              saldoCentavos: cashbackCentavos,
              geradoEm: criadaEm,
              venceEm: addDays(criadaEm, plano.validadeDias),
              status: StatusLote.ATIVO,
            },
          },
        },
      });
    }
  }

  const ana = clientes.find((cliente) => cliente.email === "ana.demo@grao.local");
  const latte = await prisma.produto.findUnique({ where: { nome: "Latte" } });
  console.log("Seed concluído: 3 planos, 10 produtos, 2 usuários, 3 clientes e histórico de demonstração quando o banco estava sem compras.");
  console.log(`IDs para demonstração: cliente Ana=${ana?.id ?? "não encontrado"}, produto Latte=${latte?.id ?? "não encontrado"}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao executar o seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
