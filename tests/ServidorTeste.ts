import { App } from "../src/App.js";

const servidor = App.listen(0, "127.0.0.1", () => {
  const endereco = servidor.address();
  if (endereco && typeof endereco !== "string") process.send?.({ porta: endereco.port });
});

process.on("message", (mensagem: unknown) => {
  if (mensagem === "encerrar") servidor.close(() => process.exit(0));
});
process.on("disconnect", () => servidor.close(() => process.exit(0)));
