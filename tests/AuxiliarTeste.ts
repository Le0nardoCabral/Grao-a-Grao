import "dotenv/config";
import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { PrismaClient, Perfil } from "@prisma/client";
import bcrypt from "bcryptjs";

type Tabela = "usoCashback" | "itemCompra" | "loteCashback" | "compra" | "cliente" | "produto" | "plano" | "usuario";

// Confere que o endereço pertence ao banco local de teste.
function enderecoTeste(): string {
  const endereco = process.env.DATABASE_URL_TEST;
  if (!endereco) throw new Error("DATABASE_URL_TEST não está definida");
  const url = new URL(endereco);
  if (url.protocol !== "mysql:" || !["localhost", "127.0.0.1", "[::1]", "db"].includes(url.hostname) || url.pathname !== "/grao_a_grao_teste") {
    throw new Error("DATABASE_URL_TEST deve apontar para o banco local grao_a_grao_teste");
  }
  return endereco;
}

// Cria um cliente dedicado ao banco de teste.
export function criarClienteTeste(): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: enderecoTeste() } } });
}

// Remove os registros das tabelas selecionadas na ordem das dependências.
export async function limparTabelas(tabelas: Tabela[]): Promise<void> {
  const prisma = criarClienteTeste();
  try {
    await prisma.$transaction(async (tx) => {
      if (tabelas.includes("usoCashback")) await tx.usoCashback.deleteMany();
      if (tabelas.includes("itemCompra")) await tx.itemCompra.deleteMany();
      if (tabelas.includes("loteCashback")) await tx.loteCashback.deleteMany();
      if (tabelas.includes("compra")) await tx.compra.deleteMany();
      if (tabelas.includes("cliente")) await tx.cliente.deleteMany();
      if (tabelas.includes("produto")) await tx.produto.deleteMany();
      if (tabelas.includes("plano")) await tx.plano.deleteMany();
      if (tabelas.includes("usuario")) await tx.usuario.deleteMany();
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Cria um usuário fictício com senha protegida por hash.
export async function criarUsuario(perfil: Perfil, senha: string) {
  const prisma = criarClienteTeste();
  try {
    return await prisma.usuario.create({ data: { nome: "Usuário de teste", email: `${randomUUID()}@teste.invalid`, senhaHash: await bcrypt.hash(senha, 10), perfil } });
  } finally { await prisma.$disconnect(); }
}

// Cria um plano fictício para os testes que precisarem dele.
export async function criarPlano() {
  const prisma = criarClienteTeste();
  try {
    return await prisma.plano.create({ data: { nome: `Teste ${randomUUID()}`, percentualBps: 200, limiteCentavos: 10000, mensalidadeCentavos: 0, minimoUsoCentavos: 100, dobroAniversario: false } });
  } finally { await prisma.$disconnect(); }
}

// Cria um cliente vinculado ao plano fornecido.
export async function criarCliente(planoId: number) {
  const prisma = criarClienteTeste();
  try { return await prisma.cliente.create({ data: { nome: "Cliente de teste", planoId } }); }
  finally { await prisma.$disconnect(); }
}

// Cria um produto fictício para os testes que precisarem dele.
export async function criarProduto() {
  const prisma = criarClienteTeste();
  try { return await prisma.produto.create({ data: { nome: `Teste ${randomUUID()}`, precoCentavos: 1000 } }); }
  finally { await prisma.$disconnect(); }
}

// Inicia a API isolada usando a conexão do banco de teste.
export async function iniciarServidor(): Promise<{ url: string; encerrar: () => Promise<void> }> {
  const endereco = enderecoTeste();
  const processo = fork(fileURLToPath(new URL("./ServidorTeste.ts", import.meta.url)), [], {
    execArgv: ["--import", "tsx"],
    env: { ...process.env, DATABASE_URL: endereco, NODE_ENV: "test" },
    stdio: ["ignore", "inherit", "inherit", "ipc"],
  });
  const porta = await new Promise<number>((resolve, reject) => {
    const limite = setTimeout(() => { processo.kill(); reject(new Error("Servidor de teste não iniciou")); }, 10000);
    processo.once("error", (erro) => { clearTimeout(limite); reject(erro); });
    processo.once("exit", (codigo) => { clearTimeout(limite); reject(new Error(`Servidor de teste encerrou: ${codigo}`)); });
    processo.once("message", (mensagem: unknown) => {
      if (typeof mensagem === "object" && mensagem !== null && "porta" in mensagem && typeof mensagem.porta === "number") {
        clearTimeout(limite);
        resolve(mensagem.porta);
      } else { clearTimeout(limite); processo.kill(); reject(new Error("Porta do servidor inválida")); }
    });
  });
  return {
    url: `http://127.0.0.1:${porta}`,
    encerrar: () => new Promise<void>((resolve, reject) => {
      if (processo.exitCode !== null || processo.signalCode !== null) { resolve(); return; }
      const limite = setTimeout(() => { processo.kill(); reject(new Error("Servidor de teste não encerrou")); }, 10000);
      processo.once("exit", () => { clearTimeout(limite); resolve(); });
      processo.send("encerrar", (erro) => { if (erro) { clearTimeout(limite); processo.kill(); reject(erro); } });
    }),
  };
}
