import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1).url().refine((valor) => valor.startsWith("mysql://")),
  JWT_SECRET: z.string().min(32).refine((valor) => valor !== "replace-with-a-long-random-secret"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  BCRYPT_COST: z.coerce.number().int().min(4).max(31).default(10),
  JWT_EXPIRES_IN: z.string().min(1).default("1d"),
  CORS_ORIGIN: z.string().default(""),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

// Valida a configuração antes de iniciar a aplicação.
export function validarEnv(): void {
  const resultado = schema.safeParse(process.env);
  if (!resultado.success) {
    const campos = resultado.error.issues.map((item) => item.path.join(".")).join(", ");
    throw new Error(`Configuração de ambiente inválida: ${campos}`);
  }
}

export const Env = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? "",
  corsOrigins: process.env.CORS_ORIGIN?.split(",") ?? [],
};
