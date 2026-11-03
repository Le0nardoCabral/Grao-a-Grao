export const Env = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? "",
  corsOrigins: process.env.CORS_ORIGIN?.split(",") ?? [],
};
