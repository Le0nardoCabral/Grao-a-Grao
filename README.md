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

## Executar localmente

Pré-requisitos: Node.js 22+, npm e MySQL 8+.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo de ambiente a partir do exemplo:

   ```bash
   cp .env.example .env
   ```

3. Substitua `JWT_SECRET` por uma chave aleatória, configure o banco e defina as
   credenciais do primeiro administrador. Não compartilhe nem versione o `.env`.

4. Gere o Prisma Client e aplique a migration inicial:

   ```bash
   npm run prisma:generate
   npx prisma migrate dev --name inicial
   ```

   A migration inicial ainda não está versionada no repositório. Uma pessoa do
   grupo deve gerá-la e commitá-la antes da entrega.

5. Carregue os planos iniciais e o primeiro administrador:

   ```bash
   npm run db:seed
   ```

   A carga pode ser repetida: ela não duplica nem sobrescreve planos ou o
   administrador existentes. Não cria produtos, clientes ou compras fictícias.

6. Inicie a API:

   ```bash
   npm run dev
   ```

A API fica em `http://localhost:3000`. `GET /health` verifica se o processo HTTP
está respondendo.

## Testes e compilação

```bash
npm test
npm run build
```

Os testes atuais cobrem o calendário de Brasília usado nos lotes e a montagem do
extrato. A compra ainda precisa de cobertura automatizada para cálculo, limite,
FIFO, expiração, idempotência e concorrência.

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

## Docker Compose

Depois de criar o `.env`:

```bash
docker compose up --build
```

Em outro terminal, prepare o banco e execute a carga inicial:

```bash
docker compose exec api npx prisma migrate dev --name inicial
docker compose exec api npm run db:seed
```

Os dados permanecem no volume `mysql_data` quando os contêineres são parados.

## Estrutura

```text
src/          rotas, controllers, services, repositories e middlewares
prisma/       schema e carga inicial
tests/        testes automatizados
context/      especificação vigente de negócio, API, dados e arquitetura
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia a API com recarga automática. |
| `npm test` | Executa os testes automatizados. |
| `npm run build` | Compila TypeScript em `dist/`. |
| `npm start` | Executa a versão compilada. |
| `npm run prisma:generate` | Gera o Prisma Client. |
| `npm run db:migrate` | Cria ou aplica migrations em desenvolvimento. |
| `npm run db:deploy` | Aplica migrations versionadas. |
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
