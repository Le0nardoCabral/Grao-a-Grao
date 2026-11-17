const privateResponses = { "401": { description: "Token ausente, inválido ou expirado" }, "403": { description: "Perfil sem permissão" } };

export const OpenApi = {
  openapi: "3.1.0",
  info: { title: "Grão a Grão API", version: "1.0.0", description: "API de cashback para cafeterias." },
  servers: [{ url: "http://localhost:3000" }],
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/health": { get: { summary: "Verifica se a API está disponível", responses: { "200": { description: "API disponível" } } } },
    "/auth/login": { post: { summary: "Autentica e obtém um token", responses: { "200": { description: "Login realizado" }, "401": { description: "Credenciais inválidas" } } } },
    "/auth/register": { post: { summary: "Cadastra um usuário atendente", security: [{ bearerAuth: [] }], responses: { "201": { description: "Usuário criado" }, ...privateResponses } } },
    "/clientes": {
      get: { summary: "Lista clientes paginados", security: [{ bearerAuth: [] }], responses: { "200": { description: "Página de clientes" }, ...privateResponses } },
      post: { summary: "Cadastra um cliente", security: [{ bearerAuth: [] }], responses: { "201": { description: "Cliente criado" }, ...privateResponses } },
    },
    "/clientes/{id}": {
      get: { summary: "Consulta um cliente", security: [{ bearerAuth: [] }], responses: { "200": { description: "Cliente" }, ...privateResponses } },
      put: { summary: "Atualiza um cliente", security: [{ bearerAuth: [] }], responses: { "200": { description: "Cliente atualizado" }, ...privateResponses } },
      delete: { summary: "Desativa um cliente", security: [{ bearerAuth: [] }], responses: { "204": { description: "Cliente desativado" }, ...privateResponses } },
    },
    "/clientes/{id}/extrato": { get: { summary: "Consulta extrato e saldo do cliente", security: [{ bearerAuth: [] }], responses: { "200": { description: "Extrato" }, ...privateResponses } } },
    "/clientes/{id}/trocar-plano": { post: { summary: "Troca o plano do cliente", security: [{ bearerAuth: [] }], responses: { "200": { description: "Plano atualizado" }, ...privateResponses } } },
    "/clientes/{id}/reativar": { post: { summary: "Reativa um cliente", security: [{ bearerAuth: [] }], responses: { "200": { description: "Cliente reativado" }, ...privateResponses } } },
    "/planos": {
      get: { summary: "Lista planos", security: [{ bearerAuth: [] }], responses: { "200": { description: "Planos" }, ...privateResponses } },
      post: { summary: "Cadastra um plano", security: [{ bearerAuth: [] }], responses: { "201": { description: "Plano criado" }, ...privateResponses } },
    },
    "/planos/receita-mensal": { get: { summary: "Consulta estimativa de receita mensal", security: [{ bearerAuth: [] }], responses: { "200": { description: "Receita mensal" }, ...privateResponses } } },
    "/planos/{id}": {
      get: { summary: "Consulta um plano", security: [{ bearerAuth: [] }], responses: { "200": { description: "Plano" }, ...privateResponses } },
      put: { summary: "Atualiza um plano", security: [{ bearerAuth: [] }], responses: { "200": { description: "Plano atualizado" }, ...privateResponses } },
      delete: { summary: "Desativa um plano", security: [{ bearerAuth: [] }], responses: { "204": { description: "Plano desativado" }, ...privateResponses } },
    },
    "/planos/{id}/reativar": { post: { summary: "Reativa um plano", security: [{ bearerAuth: [] }], responses: { "200": { description: "Plano reativado" }, ...privateResponses } } },
    "/produtos": {
      get: { summary: "Lista produtos", security: [{ bearerAuth: [] }], responses: { "200": { description: "Produtos" }, ...privateResponses } },
      post: { summary: "Cadastra um produto", security: [{ bearerAuth: [] }], responses: { "201": { description: "Produto criado" }, ...privateResponses } },
    },
    "/produtos/{id}": {
      get: { summary: "Consulta um produto", security: [{ bearerAuth: [] }], responses: { "200": { description: "Produto" }, ...privateResponses } },
      put: { summary: "Atualiza um produto", security: [{ bearerAuth: [] }], responses: { "200": { description: "Produto atualizado" }, ...privateResponses } },
      delete: { summary: "Desativa um produto", security: [{ bearerAuth: [] }], responses: { "204": { description: "Produto desativado" }, ...privateResponses } },
    },
    "/produtos/{id}/reativar": { post: { summary: "Reativa um produto", security: [{ bearerAuth: [] }], responses: { "200": { description: "Produto reativado" }, ...privateResponses } } },
    "/compras": { post: { summary: "Registra compra e calcula cashback", security: [{ bearerAuth: [] }], responses: { "201": { description: "Compra registrada" }, ...privateResponses } } },
  },
} as const;
