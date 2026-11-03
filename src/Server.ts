import "dotenv/config";
import { App } from "./App.js";

const port = Number(process.env.PORT ?? 3000);
App.listen(port, () => console.log(`Grão a Grão API disponível em http://localhost:${port}`));
