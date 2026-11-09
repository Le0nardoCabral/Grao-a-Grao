import "dotenv/config";
import { validarEnv } from "./config/Env.js";
import { App } from "./App.js";

validarEnv();
const port = Number(process.env.PORT ?? 3000);
App.listen(port, () => console.log(`Grão a Grão API disponível em http://localhost:${port}`));
