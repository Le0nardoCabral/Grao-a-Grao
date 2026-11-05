# Grão a Grão

API REST para um programa de cashback de cafeterias. Clientes vinculados a planos acumulam saldo em lotes com validade e podem usar o cashback em compras futuras. A aplicação já implementa autenticação por JWT, CRUD de produtos e registro transacional de compras; os demais recursos seguem como estrutura planejada.

## Tecnologias

- Node.js 22 e TypeScript
- Express 5
- Prisma ORM 6 e MySQL 8.4
- Docker Compose
- Helmet, CORS e Zod (estrutura preparada para segurança e validação)

A arquitetura e as regras completas estão em [ARQUITETURA.md](./ARQUITETURA.md).

## Pré-requisitos

Para execução local: Node.js 22+, npm e MySQL 8+. Para execução conteinerizada: Docker e Docker Compose.

## Rodar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie seu arquivo de ambiente:

   ```bash
   cp .env.example .env
   ```

   Troque `JWT_SECRET` por um valor aleatório antes de iniciar:

   ```bash
   openssl rand -base64 32
   ```

3. Edite `DATABASE_URL` no `.env` para apontar para seu MySQL local. Crie o banco `grao_a_grao` e configure usuário e senha correspondentes.

4. Gere o Prisma Client e aplique a migration inicial:

   ```bash
   npx prisma generate
   npx prisma migrate dev --name inicial
   ```

5. Popule o banco de demonstração:

   ```bash
   npm run db:seed
   ```

O seed cria os três planos, dez produtos, usuários `admin@grao.local` e `atendente@grao.local`, três clientes e duas compras com lotes de cashback para a cliente Ana quando ainda não há compras no banco. As senhas de demonstração ficam em `SEED_ADMIN_PASSWORD` e `SEED_ATTENDANT_PASSWORD` no `.env`; altere-as antes de compartilhar o ambiente.

6. Inicie a API em desenvolvimento:

   ```bash
   npm run dev
   ```

A API fica em `http://localhost:3000`. A rota `GET /health` verifica o servidor.

## Fluxo de catálogo e compra implementado

As rotas de produtos e compra exigem token JWT. As credenciais criadas pelo seed estão nas variáveis `SEED_ADMIN_*` e `SEED_ATTENDANT_*` do `.env.example`. O usuário admin cadastra produtos; admin e atendente consultam o catálogo e registram compras.

1. Faça login e copie o `token` retornado:

   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"atendente@grao.local","senha":"Atendente123!"}'
   ```

2. Consulte os produtos:

   ```bash
   curl http://localhost:3000/produtos -H 'Authorization: Bearer SEU_TOKEN'
   ```

3. O seed imprime os IDs da cliente Ana e do produto Latte. Use esses IDs para registrar uma compra de demonstração e consumir parte do lote mais antigo:

   ```bash
   ANA_ID=ID_IMPRESSO_PELO_SEED
   LATTE_ID=ID_IMPRESSO_PELO_SEED
   curl -X POST http://localhost:3000/compras \
     -H 'Authorization: Bearer SEU_TOKEN' \
     -H 'Content-Type: application/json' \
     -d "{\"clienteId\":${ANA_ID},\"itens\":[{\"produtoId\":${LATTE_ID},\"quantidade\":25}],\"cashbackSolicitadoCentavos\":2500}"
   ```

O valor bruto é recalculado com os preços do catálogo. O fluxo marca lotes vencidos, consome cashback pelos lotes com vencimento mais próximo, aplica mínimo do plano e limite de saldo e grava compra, itens, usos e novo lote na mesma transação. Os dois lotes de demonstração somam saldo suficiente para o mínimo do plano Básico; o uso de 2.500 centavos consome primeiro o lote mais antigo.

## Rodar com Docker Compose

1. Crie as variáveis locais:

   ```bash
   cp .env.example .env
   ```

2. Construa e inicie a API e o MySQL:

   ```bash
   docker compose up --build
   ```

O Compose aguarda o MySQL ficar saudável antes de iniciar a API. Em outro terminal, crie a migration e carregue os dados de demonstração:

```bash
docker compose exec api npx prisma migrate dev --name inicial
docker compose exec api npm run db:seed
```

A API fica em `http://localhost:3000`; o MySQL fica disponível na porta `3306`. Use `Ctrl+C` para parar e `docker compose down` para remover os contêineres. Os dados ficam no volume `mysql_data`; para apagá-los junto, execute `docker compose down -v`.

## Rotas previstas

| Grupo | Rotas |
|---|---|
| Autenticação | `POST /auth/register`, `POST /auth/login` |
| Clientes | `POST /clientes`, `GET /clientes`, `GET /clientes/:id`, `PUT /clientes/:id`, `DELETE /clientes/:id`, `GET /clientes/:id/extrato`, `POST /clientes/:id/trocar-plano` |
| Planos | `POST /planos`, `GET /planos`, `GET /planos/:id`, `PUT /planos/:id`, `DELETE /planos/:id` |
| Produtos (implementado) | `POST /produtos`, `GET /produtos`, `GET /produtos/:id`, `PUT /produtos/:id`, `DELETE /produtos/:id` |
| Compras (implementado) | `POST /compras` |

Além delas, `GET /health` responde quando o servidor está ativo. O login já funciona para os usuários do seed; `POST /auth/register` e as rotas de clientes, planos e extrato continuam como pontos de extensão e respondem HTTP 501. Os contratos, modelo de dados, regras e fluxo de compra estão no `ARQUITETURA.md`.

## Estrutura

```text
src/          aplicação Express, rotas, controllers, services e repositories
prisma/       schema do banco e seed dos dados de demonstração
Dockerfile    imagem de desenvolvimento e produção
compose.yaml  API e MySQL em contêineres
```

## Scripts npm

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia em desenvolvimento com recarga automática. |
| `npm run build` | Compila TypeScript para `dist/`. |
| `npm start` | Inicia a versão compilada. |
| `npm run prisma:generate` | Gera Prisma Client. |
| `npm run db:migrate` | Cria/aplica migrations em desenvolvimento. |
| `npm run db:deploy` | Aplica migrations existentes. |
| `npm run db:seed` | Insere/atualiza planos, produtos, usuários e clientes; adiciona compras de demonstração se o banco ainda não tiver compras. |

## Integrantes

- Integrante 1: David Vanjao
- Integrante 2: Leonardo Cabral
- Integrante 3: Nathália Rodrigues
- Integrante 4: Pedro Lucas
