# Segurança

Como a API protege o acesso e os dados. Simples e suficiente para o projeto.

- **Versão:** 0.4
- **Data:** 2026-11-06
- **Status:** `aprovado`.

---

| # | Tema | Regra |
|---|---|---|
| 1 | **Login** | O usuário entra com e-mail e senha e recebe um **token** (JWT) que vale **1 dia**. |
| 2 | **Token** | Vai em `Authorization: Bearer <token>`. A cada requisição o usuário é conferido no banco e, se for desativado nele, perde o acesso na hora. |
| 3 | **Senha** | Guardada só como **hash bcrypt**, com custo 10 configurável. O hash nunca sai em resposta. |
| 4 | **Perfis** | `ADMIN` e `ATENDENTE`. Cada rota diz quem a usa em [endpoints.md](../api/endpoints.md). Sem permissão, a resposta é `403`. |
| 5 | **Entrada** | Todo dado é validado antes da regra de negócio, e campo desconhecido é recusado (`400`). O acesso ao banco usa consultas parametrizadas, sem montar SQL com texto. |
| 6 | **Erros** | Formato único, sem rastro interno nem detalhe do servidor. Quem faz login com e-mail inexistente e quem erra a senha recebem a **mesma** resposta. |
| 7 | **Segredos** | Chave do token, senha do banco e demais segredos ficam no `.env`, **fora do Git**. A chave do token tem no mínimo 32 caracteres e não pode ser o valor de exemplo. O servidor **não sobe** com configuração insegura. |
| 8 | **HTTP** | Cabeçalhos de segurança com Helmet, com um ajuste na política de conteúdo só da rota `/docs`, para a página do Swagger carregar. CORS só para as origens listadas em `CORS_ORIGIN`; sem lista, nenhuma origem é liberada. |
| 9 | **Corpo da requisição** | Limitado a 100 KB. |
| 10 | **Logs** | Nunca registram senha, hash nem token. |
| 11 | **Tempo do login** | Com e-mail inexistente, a senha é comparada com um hash fictício, para o tempo de resposta não revelar se a conta existe. |
| 12 | **Primeiro admin** | Criado pela carga inicial, com e-mail e senha vindos de variáveis de ambiente (ver o modelo de dados). |

## O que não faz parte

Conforme o [fora de escopo](../negocio/requisitos.md): limite de tentativas de login, gestão de usuários além do cadastro e revogação de token antes do vencimento.
