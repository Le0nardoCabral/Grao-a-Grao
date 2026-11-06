# Stack

Tecnologias do projeto Grão a Grão.

- **Versão:** 0.3
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
| Documentação da API | OpenAPI (Swagger) gerada a partir dos schemas Zod | — | aprovado |

As versões são as de hoje no `package.json`, no `Dockerfile` e no `compose.yaml`. Ao atualizar uma dependência, atualizar esta tabela.

## Não adotado

| Área | Situação | Status |
|---|---|---|
| Lint e formatação | Não serão usados. As convenções do `aiRules.md` (Bloco 4) são cumpridas por revisão, sem verificação automática. | aprovado |

## Regras de uso

1. Dependência nova só entra com justificativa e depois de o usuário aprovar. A IA não instala pacote por conta própria (Bloco 2, regra 11 do `aiRules.md`).
2. Toda dependência nova entra nesta tabela, com versão e status.
3. Tecnologia que não está nesta tabela não é usada no código.
