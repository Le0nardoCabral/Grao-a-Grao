# Stack

Tecnologias do projeto Grão a Grão.

- **Versão:** 0.6
- **Data:** 2026-11-06
- **Status:** `aprovado`, `proposto` (aguarda confirmação) ou `em aberto` (depende de uma decisão).

---

## Tecnologias definidas

| Área | Tecnologia | Versão | Status |
|---|---|---|---|
| Linguagem | TypeScript, modo `strict` | 5.9 | aprovado |
| Runtime | Node.js | 22 | aprovado |
| Módulos | ESM (`"type": "module"`) | — | aprovado |
| Servidor HTTP | Express | 5 | aprovado |
| Segurança HTTP | Helmet e CORS | 8 e 2 | aprovado |
| Banco de dados | MySQL | 8.4 | aprovado |
| Acesso ao banco | Prisma ORM | 6 | aprovado |
| Validação de entrada | Zod | 4 | aprovado |
| Autenticação | JWT (`jsonwebtoken`) | 9 | aprovado |
| Senhas | `bcryptjs` | 3 | aprovado |
| Variáveis de ambiente | `dotenv`, com arquivo `.env` fora do Git | 16 | aprovado |
| Execução em desenvolvimento | `tsx` | 4 | aprovado |
| Ambiente com contêineres | Docker e Docker Compose | — | aprovado |
| Testes | `node:test`, o executor nativo do Node, rodado com `tsx` | nativo | aprovado |
| Documentação da API | OpenAPI 3.1 (Swagger) gerada a partir dos schemas Zod | — | aprovado |
| Página do Swagger | `swagger-ui-express` | a definir | aprovado |
| Tipos da página do Swagger | `@types/swagger-ui-express`, só em desenvolvimento | a definir | aprovado |

As versões são as de hoje no `package.json`, no `Dockerfile` e no `compose.yaml`. Ao atualizar uma dependência, atualizar esta tabela.

## Não adotado

| Área | Situação | Status |
|---|---|---|
| Lint e formatação | Não serão usados. As convenções do `aiRules.md` (Bloco 4) são cumpridas por revisão, sem verificação automática. | aprovado |

## Variáveis de ambiente

Ficam no arquivo `.env`, **fora do Git**. O `.env.example` traz só valores falsos.

| Variável | Obrigatória | Para quê | Padrão ou exemplo | Status |
|---|---|---|---|---|
| `DATABASE_URL` | sim | Endereço do banco da aplicação. | `mysql://usuario:senha@host:3306/grao_a_grao` | aprovado |
| `DATABASE_URL_TEST` | só nos testes | Endereço do banco de teste. | `.../grao_a_grao_teste` | aprovado |
| `JWT_SECRET` | sim | Chave que assina o token. No mínimo 32 caracteres e diferente do valor de exemplo. | — | aprovado |
| `JWT_EXPIRES_IN` | não | Validade do token. | `1d` | aprovado |
| `BCRYPT_COST` | não | Custo do hash da senha. | `10` | aprovado |
| `CORS_ORIGIN` | não | Origens liberadas no CORS, separadas por vírgula. Vazio libera nenhuma. | vazio | aprovado |
| `PORT` | não | Porta da API. | `3000` | aprovado |
| `NODE_ENV` | não | Ambiente de execução. | `development` | aprovado |
| `SEED_ADMIN_EMAIL` | só na carga inicial | E-mail do primeiro admin. | — | aprovado |
| `SEED_ADMIN_PASSWORD` | só na carga inicial | Senha do primeiro admin, com no mínimo 8 caracteres. | — | aprovado |
| `SEED_ADMIN_NAME` | não | Nome do primeiro admin. | `Administrador` | aprovado |

O servidor valida essas variáveis ao iniciar e **não sobe** se uma obrigatória faltar ou se a `JWT_SECRET` for insegura.

## Regras de uso

1. Dependência nova só entra com justificativa e depois de o usuário aprovar. A IA não instala pacote por conta própria (Bloco 2, regra 11 do `aiRules.md`).
2. Toda dependência nova entra nesta tabela, com versão e status.
3. Tecnologia que não está nesta tabela não é usada no código.
