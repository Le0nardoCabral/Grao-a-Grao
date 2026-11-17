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
| Clientes | Cadastro, listagem, extrato e troca de plano implementados; consulta, edição e desativação pendentes |
| Planos | Cadastro, consulta, edição, desativação e reativação implementados; receita mensal estimada pendente |
| Produtos | CRUD implementado |
| Compra e cashback | Implementados com idempotência |
| OpenAPI/Swagger | Pendente |

O extrato informa o saldo disponível, os lotes que vencem nos próximos 30 dias
e até 50 movimentos recentes de crédito, uso e expiração. Lotes vencidos são
ignorados no saldo mesmo antes de sua situação ser materializada no banco.

## Preparar o ambiente local

Crie o arquivo `.env` a partir do exemplo antes de iniciar a API ou executar os
testes. Os valores do exemplo apontam para os bancos locais do Compose; mantenha
`DATABASE_URL` em `grao_a_grao` e `DATABASE_URL_TEST` em `grao_a_grao_teste`.

```bash
cp .env.example .env
```

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

## Demonstração no Bruno ou Postman

Com o banco iniciado, migrations aplicadas e a carga inicial executada, inicie a
API. No Bruno, use **Open Collection** e selecione a pasta
[`collections/Grao-a-Grao-Bruno`](./collections/Grao-a-Grao-Bruno), depois escolha
o ambiente **Local**. No Postman, importe
[`collections/Grao-a-Grao.postman_collection.json`](./collections/Grao-a-Grao.postman_collection.json).
Ambas usam `http://localhost:3000`, fazem login com o administrador de
demonstração (`admin.demo@grao.local` / `admin`) e salvam o token e os IDs criados
durante a execução. Execute as requisições na ordem das pastas, começando por
**Login ADMIN**.

O seed também deixa dados prontos no banco local: três planos, três usuários,
seis clientes (um inativo), seis produtos (um inativo), seis compras e seus lotes
de cashback. Há um caso com uso parcial de cashback e um lote perto do vencimento
para demonstrar o extrato. Além do administrador configurado no `.env`, existe o
atendente `atendente.demo@grao.local`, com senha local `Atendente123!`, e um
administrador de demonstração chamado `admin`, com senha `admin`. A carga pode
ser executada novamente sem duplicar dados; ela não apaga nem atualiza registros
já existentes.

## Testes e compilação

Instale as dependências e inicie o MySQL do Compose. Aplique as migrations no
banco de teste antes de executar a suíte de integração:

```bash
npm install
docker compose up -d db
docker compose run --build --rm api npm run db:deploy:test
npm run test:integration
```

Os testes HTTP iniciam a API em uma porta livre e executam serialmente contra
`grao_a_grao_teste`. Os dados são preparados e limpos em cada caso, inclusive
quando uma asserção falha. Antes de iniciar, o comando confere se `DATABASE_URL`
e `DATABASE_URL_TEST` apontam para os bancos locais esperados. Se essa checagem
falhar, confira o arquivo `.env` e confirme que o MySQL está ativo.

Para rodar apenas a integração pelo Compose, use:

```bash
docker compose run --build --rm api npm run test:integration
```

Para rodar todos os testes (integração, unidade e infraestrutura) ou compilar:

```bash
npm test
npm run build
```

Os scripts executam os testes serialmente. Os testes com dados usam
`grao_a_grao_teste`; a validação de ambiente confere os destinos configurados
antes de iniciar.

## Rotas disponíveis

Todas as rotas implementadas abaixo, exceto login e health check, exigem
`Authorization: Bearer <token>`.

| Método | Rota | Perfis | Situação |
|---|---|---|---|
| GET | `/health` | Público | Implementado |
| POST | `/auth/login` | Público | Implementado |
| POST | `/auth/register` | ADMIN | Pendente |
| POST | `/clientes` | ADMIN, ATENDENTE | Implementado |
| GET | `/clientes` | ADMIN, ATENDENTE | Implementado |
| GET | `/clientes/:id/extrato` | ADMIN, ATENDENTE | Implementado |
| POST | `/clientes/:id/trocar-plano` | ADMIN | Implementado |
| GET, PUT, DELETE | `/clientes/:id` | Conforme especificação | Pendente |
| POST, PUT, DELETE | `/planos` | ADMIN | Implementado |
| GET | `/planos`, `/planos/:id` | ADMIN, ATENDENTE | Implementado |
| POST | `/planos/:id/reativar` | ADMIN | Implementado |
| GET | `/planos/receita-mensal` | ADMIN | Pendente |
| POST, PUT, DELETE | `/produtos` | ADMIN | Implementado |
| GET | `/produtos`, `/produtos/:id` | ADMIN, ATENDENTE | Implementado |
| POST | `/compras` | ADMIN, ATENDENTE | Implementado |

Para consultar o extrato de um cliente ativo:

```bash
curl http://localhost:3000/clientes/1/extrato \
  -H 'Authorization: Bearer SEU_TOKEN'
```

Somente o ADMIN pode consultar cliente desativado, usando
`?incluirInativos=true`.

## Estrutura

```text
src/                 rotas, controllers, services, repositories e middlewares
prisma/              schema, migrations e carga inicial
tests/               testes unitários e de infraestrutura
tests/integration/   testes HTTP da API com banco local de teste
tests/support/       auxiliares, servidor isolado e contexto de integração
context/             especificação vigente de negócio, API, dados e arquitetura
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia a API com recarga automática. |
| `npm test` | Valida os bancos e executa todos os testes serialmente. |
| `npm run test:integration` | Valida os bancos e executa somente os testes HTTP serialmente. |
| `npm run build` | Compila TypeScript em `dist/`. |
| `npm start` | Executa a versão compilada. |
| `npm run prisma:generate` | Gera o Prisma Client. |
| `npm run db:migrate` | Cria ou aplica migrations em desenvolvimento. |
| `npm run db:deploy` | Aplica migrations versionadas ao banco local indicado por `DATABASE_URL`. |
| `npm run db:deploy:test` | Aplica migrations versionadas somente ao banco local de teste. |
| `npm run db:seed` | Cria os planos iniciais e o primeiro admin sem sobrescrever dados. |

## Pendências prioritárias

1. Implementar cadastro de usuários.
2. Completar consulta, edição e desativação de clientes.
3. Implementar a receita mensal estimada por plano.
4. Publicar OpenAPI 3.1 e Swagger quando os contratos implementados estiverem estáveis.

## Integrantes

- David Vanjao
- Leonardo Cabral
- Nathália Rodrigues
- Pedro Lucas
