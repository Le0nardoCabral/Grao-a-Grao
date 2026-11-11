import "dotenv/config";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

type BancoEsperado = "desenvolvimento" | "teste" | "qualquer";

const destinos = {
  desenvolvimento: "grao_a_grao",
  teste: "grao_a_grao_teste",
} as const;

const hostsLocais = new Set(["localhost", "127.0.0.1", "[::1]", "db"]);

export function validarDestinoBanco(
  endereco: string | undefined,
  bancoEsperado: BancoEsperado = "qualquer",
): string {
  let url: URL;

  try {
    if (!endereco) throw new Error();
    url = new URL(endereco);
  } catch {
    throw new Error("Banco bloqueado: configure uma URL MySQL local autorizada.");
  }

  const banco = decodeURIComponent(url.pathname.slice(1));
  const bancoValido = Object.values(destinos).includes(
    banco as (typeof destinos)[keyof typeof destinos],
  );
  const nomeEsperado = bancoEsperado === "qualquer" ? undefined : destinos[bancoEsperado];

  if (
    url.protocol !== "mysql:" ||
    !hostsLocais.has(url.hostname) ||
    url.port !== "3306" ||
    !bancoValido ||
    (nomeEsperado !== undefined && banco !== nomeEsperado)
  ) {
    throw new Error("Banco bloqueado: configure uma URL MySQL local autorizada.");
  }

  return endereco;
}

function validarAmbienteDeTestes(): void {
  validarDestinoBanco(process.env.DATABASE_URL, "desenvolvimento");
  validarDestinoBanco(process.env.DATABASE_URL_TEST, "teste");
}

function aplicarMigrationsNoBancoDeTeste(): void {
  const endereco = validarDestinoBanco(process.env.DATABASE_URL_TEST, "teste");
  const cli = fileURLToPath(
    new URL("../node_modules/prisma/build/index.js", import.meta.url),
  );
  const resultado = spawnSync(process.execPath, [cli, "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: endereco },
    stdio: "inherit",
  });

  if (resultado.error) throw resultado.error;
  process.exitCode = resultado.status ?? 1;
}

const comando = process.argv[2];

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (comando === "testes") {
    validarAmbienteDeTestes();
  } else if (comando === "migracao-teste") {
    aplicarMigrationsNoBancoDeTeste();
  } else if (comando === "migracao" || comando === "seed") {
    validarDestinoBanco(process.env.DATABASE_URL);
  } else {
    throw new Error("Operação de banco desconhecida.");
  }
}
