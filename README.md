# Grão a Grão

API REST para um programa de cashback de cafeterias. Clientes vinculados a planos acumulam saldo em lotes com validade e podem usar o cashback em compras futuras. Esta é a estrutura inicial da aplicação: os endpoints de negócio estão declarados, mas ainda respondem `501` até a implementação das regras e serviços.

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

3. Edite `DATABASE_URL` no `.env` para apontar para seu MySQL local. Crie o banco `grao_a_grao` e configure usuário e senha correspondentes.

4. Gere o Prisma Client e aplique a migration inicial:

   ```bash
   npx prisma generate
   npx prisma migrate dev --name inicial
   ```

5. Cadastre os três planos padrão:

   ```bash
   npm run db:seed
   ```

6. Inicie a API em desenvolvimento:

   ```bash
   npm run dev
   ```

A API fica em `http://localhost:3000`. A rota `GET /health` verifica o servidor.

## Rodar com Docker Compose

1. Crie as variáveis locais:

   ```bash
   cp .env.example .env
   ```

2. Construa e inicie a API e o MySQL:

   ```bash
   docker compose up --build
   ```

O Compose aguarda o MySQL ficar saudável antes de iniciar a API. Em outro terminal, crie a migration e carregue os planos padrão:

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
| Produtos | `POST /produtos`, `GET /produtos`, `GET /produtos/:id`, `PUT /produtos/:id`, `DELETE /produtos/:id` |
| Compras | `POST /compras` |

Além delas, `GET /health` responde quando o servidor está ativo. Os contratos detalhados, perfis, modelo de dados, regras e fluxo de compra estão no `ARQUITETURA.md`.

## Estrutura

```text
src/          aplicação Express, rotas, controllers, services e repositories
prisma/       schema do banco e seed dos planos
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
| `npm run db:seed` | Insere ou atualiza os três planos. |

## Integrantes

- Integrante 1: preencher nome
- Integrante 2: preencher nome
- Integrante 3: preencher nome
- Integrante 4: preencher nome
