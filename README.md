# Grão a Grão

API REST de um programa de cashback para cafeterias. Clientes pertencem a planos,
acumulam cashback em lotes com validade e podem usar o saldo em compras futuras.

A especificação vigente está em [`context/indice.md`](./context/indice.md). O
`ARQUITETURA.md` da raiz registra a proposta inicial e não representa sozinho o
estado atual do projeto.

## Tecnologias

- Node.js 22, TypeScript 5.9 e Express 5
- Prisma ORM 6 e MySQL 8.4
- Zod 4, JWT, bcrypt, Helmet e CORS
- Docker e Docker Compose
- `node:test` com execução TypeScript por `tsx`

## Estado atual

| Recurso | Situação |
|---|---|
| Login com JWT | Implementado |
| Cadastro de usuário | Pendente; responde `501` |
| Clientes | Cadastro, listagem e extrato implementados |
| Planos | Pendente; rotas respondem `501` |
| Produtos | CRUD implementado |
| Compra e cashback | Implementação transacional existente, ainda sem idempotência |
| OpenAPI/Swagger | Pendente |

O extrato informa o saldo disponível, os lotes que vencem nos próximos 30 dias
e até 50 movimentos recentes de crédito, uso e expiração. Lotes vencidos são
ignorados no saldo mesmo antes de sua situação ser materializada no banco.

## Executar localmente via Docker

Use Docker Compose para manter a API e os dois bancos no ambiente local. O `.env`
fornece as demais configurações da API; dentro do Compose, as URLs do banco são
sobrescritas para os bancos locais `grao_a_grao` e `grao_a_grao_teste`.

1. Inicie o MySQL:

   ```bash
   docker compose up -d db
   ```

2. Construa a imagem de desenvolvimento:

   ```bash
   docker compose build api
   ```

   Reconstrua a imagem depois de alterar `Dockerfile`, `package.json`,
   `package-lock.json` ou arquivos de `scripts/`, pois esses arquivos são
   copiados para a imagem e não são montados como volumes. Para reconstruir e
   executar em uma etapa, use `docker compose run --build --rm api <comando>`.

3. Aplique as migrations nos bancos de desenvolvimento e teste:

   ```bash
   docker compose run --rm api npm run db:deploy
   docker compose run --rm api npm run db:deploy:test
   ```

   O primeiro comando usa `DATABASE_URL` e o segundo seleciona e valida
   `DATABASE_URL_TEST` antes de chamar o Prisma.

4. Carregue os planos iniciais e o administrador no banco de desenvolvimento:

   ```bash
   docker compose run --rm api npm run db:seed
   ```

5. Inicie a API:

   ```bash
   docker compose up --build api
   ```

A API fica em `http://localhost:3000`. `GET /health` verifica se o processo HTTP
está respondendo. Não execute `npx prisma migrate ...` diretamente; use os
scripts protegidos acima.

## Testes e compilação

Com o MySQL do Compose ativo e as migrations aplicadas ao banco de teste, rode
os testes HTTP da API:

```bash
docker compose run --rm api npm run test:integration
```

Os testes de integração iniciam a API em uma porta local livre, usam somente
`grao_a_grao_teste` e limpam os dados antes e depois de cada caso. O comando
valida o destino dos bancos antes de executar.

Para rodar todos os testes (integração, unidade e infraestrutura) e compilar:

```bash
docker compose run --rm api npm test
docker compose run --rm api npm run build
```

O script de teste valida que as URLs configuradas apontam para os bancos locais
esperados. Os testes com dados usam `grao_a_grao_teste`; a validação de ambiente
também faz uma consulta simples aos dois bancos locais.

## Rotas disponíveis

Todas as rotas abaixo, exceto login e health check, exigem
`Authorization: Bearer <token>`.

| Método | Rota | Perfis | Situação |
|---|---|---|---|
| GET | `/health` | Público | Implementado |
| POST | `/auth/login` | Público | Implementado |
| POST | `/auth/register` | ADMIN | Pendente |
| POST | `/clientes` | ADMIN, ATENDENTE | Implementado |
| GET | `/clientes` | ADMIN, ATENDENTE | Implementado |
| GET | `/clientes/:id/extrato` | ADMIN, ATENDENTE | Implementado |
| GET, PUT, DELETE | `/clientes/:id` | Conforme especificação | Pendente |
| POST | `/clientes/:id/trocar-plano` | ADMIN | Pendente |
| CRUD | `/planos` | Conforme especificação | Pendente |
| CRUD | `/produtos` | Conforme especificação | Implementado |
| POST | `/compras` | ADMIN, ATENDENTE | Implementado parcialmente |

Para consultar o extrato de um cliente ativo:

```bash
curl http://localhost:3000/clientes/1/extrato \
  -H 'Authorization: Bearer SEU_TOKEN'
```

Somente o ADMIN pode consultar cliente desativado, usando
`?incluirInativos=true`.

## Estrutura

```text
src/          rotas, controllers, services, repositories e middlewares
prisma/       schema e carga inicial
tests/        testes unitários e de infraestrutura
tests/integration/ testes HTTP da API com banco local de teste
tests/support/ auxiliares, servidor isolado e contexto de integração
context/      especificação vigente de negócio, API, dados e arquitetura
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia a API com recarga automática. |
| `npm test` | Valida as URLs e executa os testes automatizados; prefira executar no Docker. |
| `npm run build` | Compila TypeScript em `dist/`. |
| `npm start` | Executa a versão compilada. |
| `npm run prisma:generate` | Gera o Prisma Client. |
| `npm run db:migrate` | Cria ou aplica migrations em desenvolvimento. |
| `npm run db:deploy` | Aplica migrations versionadas ao banco local indicado por `DATABASE_URL`. |
| `npm run db:deploy:test` | Aplica migrations versionadas somente ao banco local de teste. |
| `npm run db:seed` | Cria os planos iniciais e o primeiro admin sem sobrescrever dados. |

## Pendências prioritárias

1. Criar e versionar a migration inicial.
2. Corrigir o cálculo da compra para usar o valor pago como base.
3. Implementar idempotência e persistir o cashback cortado pelo limite.
4. Completar clientes, planos, reativação e cadastro de atendentes.
5. Publicar OpenAPI 3.1 e Swagger quando os contratos implementados estiverem estáveis.

## Integrantes

- David Vanjao
- Leonardo Cabral
- Nathália Rodrigues
- Pedro Lucas
