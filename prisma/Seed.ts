import "dotenv/config";
import { hash } from "bcryptjs";
import { Perfil, PrismaClient } from "@prisma/client";
import { validarDestinoBanco } from "../scripts/ValidarDestinoBanco.js";

validarDestinoBanco(process.env.DATABASE_URL);
const prisma = new PrismaClient();

const initialPlans = [
  {
    nome: "Básico",
    mensalidadeCentavos: 1_990,
    percentualBps: 200,
    limiteCentavos: 20_000,
    minimoUsoCentavos: 2_000,
    dobroAniversario: false,
    validadeDias: 180,
  },
  {
    nome: "Intermediário",
    mensalidadeCentavos: 3_990,
    percentualBps: 500,
    limiteCentavos: 50_000,
    minimoUsoCentavos: 2_000,
    dobroAniversario: true,
    validadeDias: 180,
  },
  {
    nome: "Premium",
    mensalidadeCentavos: 6_990,
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
  if (Array.from(password).length < 8 || Buffer.byteLength(password, "utf8") > 72) {
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

  const atendente = await prisma.usuario.upsert({
    where: { email: "atendente.demo@grao.local" },
    update: {},
    create: {
      nome: "Atendente Demonstração",
      email: "atendente.demo@grao.local",
      senhaHash: await hash("Atendente123!", bcryptCost()),
      perfil: Perfil.ATENDENTE,
    },
  });
  await prisma.usuario.upsert({
    where: { email: "admin.demo@grao.local" },
    update: {},
    create: {
      nome: "admin",
      email: "admin.demo@grao.local",
      senhaHash: await hash("admin", bcryptCost()),
      perfil: Perfil.ADMIN,
    },
  });

  const planos = await prisma.plano.findMany({ where: { nome: { in: initialPlans.map(({ nome }) => nome) } } });
  const planoIdPorNome = new Map(planos.map((plano) => [plano.nome, plano.id]));
  const produtosDemo = [
    { nome: "Café Especial em Grãos", descricao: "Pacote de 500 g, torra média.", precoCentavos: 18_900 },
    { nome: "Cappuccino", descricao: "Cappuccino clássico da casa.", precoCentavos: 1_350 },
    { nome: "Espresso Duplo", descricao: "Dose dupla de espresso.", precoCentavos: 850 },
    { nome: "Bolo de Chocolate", descricao: "Fatia de bolo de chocolate.", precoCentavos: 1_200 },
    { nome: "Caneca Grão a Grão", descricao: "Caneca de cerâmica da cafeteria.", precoCentavos: 3_500 },
  ];
  const produtos = new Map<string, { id: number; precoCentavos: number }>();
  for (const produto of produtosDemo) {
    const salvo = await prisma.produto.upsert({
      where: { nome: produto.nome },
      update: {},
      create: produto,
    });
    produtos.set(produto.nome, { id: salvo.id, precoCentavos: salvo.precoCentavos });
  }
  await prisma.produto.upsert({
    where: { nome: "Café Sazonal Encerrado" },
    update: {},
    create: { nome: "Café Sazonal Encerrado", descricao: "Exemplo de produto inativo.", precoCentavos: 999, ativo: false },
  });

  const clientesDemo = [
    { nome: "Alice Martins", email: "alice.martins@grao.local", telefone: "11987650001", dataNascimento: new Date("1992-04-12T00:00:00.000Z"), plano: "Básico", ativo: true },
    { nome: "Bruno Costa", email: "bruno.costa@grao.local", telefone: "11987650002", dataNascimento: new Date("1988-09-23T00:00:00.000Z"), plano: "Intermediário", ativo: true },
    { nome: "Carla Oliveira", email: "carla.oliveira@grao.local", telefone: "11987650003", dataNascimento: new Date("1995-01-08T00:00:00.000Z"), plano: "Premium", ativo: true },
    { nome: "Diego Santos", email: "diego.santos@grao.local", telefone: "11987650004", dataNascimento: new Date("2000-06-30T00:00:00.000Z"), plano: "Básico", ativo: true },
    { nome: "Elisa Souza", email: "elisa.souza@grao.local", telefone: "11987650005", dataNascimento: new Date("1997-11-15T00:00:00.000Z"), plano: "Intermediário", ativo: true },
    { nome: "Fernanda Lima", email: "fernanda.lima@grao.local", telefone: "11987650006", dataNascimento: new Date("1990-03-05T00:00:00.000Z"), plano: "Premium", ativo: false },
  ];
  const clientes = new Map<string, { id: number }>();
  for (const cliente of clientesDemo) {
    const planoId = planoIdPorNome.get(cliente.plano);
    if (!planoId) throw new Error(`Plano de demonstração ausente: ${cliente.plano}`);
    const salvo = await prisma.cliente.upsert({
      where: { email: cliente.email },
      update: {},
      create: {
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        dataNascimento: cliente.dataNascimento,
        planoId,
        ativo: cliente.ativo,
      },
    });
    clientes.set(cliente.email, { id: salvo.id });
  }

  const agora = new Date();
  const diasApos = (dias: number) => new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000);
  const diasAntes = (dias: number) => new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
  async function criarCompraDemo(args: {
    chave: string;
    clienteId: number;
    itens: Array<{ nomeProduto: string; quantidade: number }>;
    criadaEm: Date;
    venceEm: Date;
    cashbackUsadoCentavos?: number;
    loteConsumidoId?: number;
  }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const existente = await tx.compra.findUnique({
        where: { usuarioId_chaveIdempotencia: { usuarioId: atendente.id, chaveIdempotencia: args.chave } },
      });
      if (existente) return;

      const itens = args.itens.map((item) => {
        const produto = produtos.get(item.nomeProduto);
        if (!produto) throw new Error(`Produto de demonstração ausente: ${item.nomeProduto}`);
        return {
          produtoId: produto.id,
          quantidade: item.quantidade,
          precoUnitarioCentavos: produto.precoCentavos,
          subtotalCentavos: produto.precoCentavos * item.quantidade,
        };
      });
      const valorBrutoCentavos = itens.reduce((total, item) => total + item.subtotalCentavos, 0);
      const cashbackUsadoCentavos = args.cashbackUsadoCentavos ?? 0;
      const cliente = await tx.cliente.findUniqueOrThrow({ where: { id: args.clienteId }, include: { plano: true } });
      const cashbackGeradoCentavos = Math.floor(
        ((valorBrutoCentavos - cashbackUsadoCentavos) * cliente.plano.percentualBps) / 10_000,
      );
      const compra = await tx.compra.create({
        data: {
          clienteId: args.clienteId,
          usuarioId: atendente.id,
          valorBrutoCentavos,
          cashbackUsadoCentavos,
          valorPagoCentavos: valorBrutoCentavos - cashbackUsadoCentavos,
          cashbackGeradoCentavos,
          chaveIdempotencia: args.chave,
          criadaEm: args.criadaEm,
          itens: { create: itens },
        },
      });
      if (args.loteConsumidoId && cashbackUsadoCentavos > 0) {
        const lote = await tx.loteCashback.findUniqueOrThrow({ where: { id: args.loteConsumidoId } });
        const saldoCentavos = lote.saldoCentavos - cashbackUsadoCentavos;
        if (saldoCentavos < 0) throw new Error("Saldo de cashback insuficiente para a compra de demonstração.");
        await tx.loteCashback.update({
          where: { id: lote.id },
          data: { saldoCentavos, status: saldoCentavos === 0 ? "CONSUMIDO" : "PARCIAL" },
        });
        await tx.usoCashback.create({
          data: { compraId: compra.id, loteId: lote.id, valorCentavos: cashbackUsadoCentavos },
        });
      }
      await tx.loteCashback.create({
        data: {
          clienteId: args.clienteId,
          compraOrigemId: compra.id,
          valorOriginalCentavos: cashbackGeradoCentavos,
          saldoCentavos: cashbackGeradoCentavos,
          geradoEm: args.criadaEm,
          venceEm: args.venceEm,
          status: "ATIVO",
        },
      });
    });
  }

  const alice = clientes.get("alice.martins@grao.local")!;
  const compraAliceInicial = await prisma.compra.upsert({
    where: { usuarioId_chaveIdempotencia: { usuarioId: atendente.id, chaveIdempotencia: "seed-demo-alice-01" } },
    update: {},
    create: {
      clienteId: alice.id,
      usuarioId: atendente.id,
      valorBrutoCentavos: produtos.get("Café Especial em Grãos")!.precoCentavos * 10,
      valorPagoCentavos: produtos.get("Café Especial em Grãos")!.precoCentavos * 10,
      cashbackGeradoCentavos: Math.floor((produtos.get("Café Especial em Grãos")!.precoCentavos * 10 * 200) / 10_000),
      chaveIdempotencia: "seed-demo-alice-01",
      criadaEm: diasAntes(10),
      itens: {
        create: [{
          produtoId: produtos.get("Café Especial em Grãos")!.id,
          quantidade: 10,
          precoUnitarioCentavos: produtos.get("Café Especial em Grãos")!.precoCentavos,
          subtotalCentavos: produtos.get("Café Especial em Grãos")!.precoCentavos * 10,
        }],
      },
      loteGerado: {
        create: {
          clienteId: alice.id,
          valorOriginalCentavos: Math.floor((produtos.get("Café Especial em Grãos")!.precoCentavos * 10 * 200) / 10_000),
          saldoCentavos: Math.floor((produtos.get("Café Especial em Grãos")!.precoCentavos * 10 * 200) / 10_000),
          geradoEm: diasAntes(10),
          venceEm: diasApos(20),
          status: "ATIVO",
        },
      },
    },
    include: { loteGerado: true },
  });
  const loteAlice = compraAliceInicial.loteGerado
    ?? await prisma.loteCashback.findUniqueOrThrow({ where: { compraOrigemId: compraAliceInicial.id } });
  await criarCompraDemo({
    chave: "seed-demo-alice-02",
    clienteId: alice.id,
    itens: [{ nomeProduto: "Cappuccino", quantidade: 2 }, { nomeProduto: "Bolo de Chocolate", quantidade: 2 }],
    criadaEm: diasAntes(2),
    venceEm: diasApos(180),
    cashbackUsadoCentavos: 2_000,
    loteConsumidoId: loteAlice.id,
  });
  await criarCompraDemo({
    chave: "seed-demo-bruno-01",
    clienteId: clientes.get("bruno.costa@grao.local")!.id,
    itens: [{ nomeProduto: "Café Especial em Grãos", quantidade: 3 }],
    criadaEm: diasAntes(4),
    venceEm: diasApos(150),
  });
  await criarCompraDemo({
    chave: "seed-demo-carla-01",
    clienteId: clientes.get("carla.oliveira@grao.local")!.id,
    itens: [{ nomeProduto: "Café Especial em Grãos", quantidade: 2 }],
    criadaEm: diasAntes(3),
    venceEm: diasApos(120),
  });
  await criarCompraDemo({
    chave: "seed-demo-diego-01",
    clienteId: clientes.get("diego.santos@grao.local")!.id,
    itens: [{ nomeProduto: "Cappuccino", quantidade: 4 }],
    criadaEm: diasAntes(1),
    venceEm: diasApos(90),
  });
  await criarCompraDemo({
    chave: "seed-demo-elisa-01",
    clienteId: clientes.get("elisa.souza@grao.local")!.id,
    itens: [{ nomeProduto: "Bolo de Chocolate", quantidade: 2 }],
    criadaEm: diasAntes(6),
    venceEm: diasApos(60),
  });

  console.log("Carga inicial concluída: planos, usuários e dados de demonstração estão disponíveis.");
}

main()
  .catch((error: unknown) => {
    const mensagensSeguras = [
      "Configure SEED_ADMIN_EMAIL no arquivo .env antes de executar o seed.",
      "Configure SEED_ADMIN_PASSWORD no arquivo .env antes de executar o seed.",
      "SEED_ADMIN_PASSWORD deve ter ao menos 8 caracteres e no máximo 72 bytes.",
      "BCRYPT_COST deve ser um inteiro entre 4 e 31.",
    ];
    console.error(error instanceof Error && mensagensSeguras.includes(error.message) ? error.message : "Falha ao executar a carga inicial.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
