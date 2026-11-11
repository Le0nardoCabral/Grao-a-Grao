# Tasks

Lista das tasks para construir a API, na ordem de execução, com o teste de cada uma.

- **Versão:** 2.6
- **Data:** 2026-11-06
- **Marcação:** `[ ]` pendente e `[x]` concluída. Só o usuário permite marcar.

---

## Como cada task é feita

Cada task segue o `aiRules.md`: plano aprovado antes, **teste escrito primeiro** (ele falha antes em comportamento novo e passa antes e depois quando a task preserva comportamento, como diz a regra 8 do Bloco 2), implementação, todos os testes rodados e relatório no fim. Com o relatório aprovado, a IA **pergunta se pode marcar a task como concluída** e só então troca `[ ]` por `[x]`.

## Como é o teste

| # | Regra |
|---|---|
| 1 | **Um teste simples por task**, que confere o resultado principal. A compra tem 3, por ser a regra principal. Total: **19 testes**. |
| 2 | Ferramenta: `node:test`, rodado por `npm test`, no banco de teste (`DATABASE_URL_TEST`). Antes de o `npm test` existir (task 2), o teste roda com `node --import tsx --test`. |
| 3 | A saída mostra `✔` quando passou e `✖` quando falhou, com o que veio de errado. |
| 4 | O teste fica em `tests/<arquivo testado>.test.ts`. |

Exemplo de saída:

```text
✔ login válido devolve o token (84ms)
✖ compra gera lote de cashback (95ms)
    esperado 200 centavos, veio 0
```

---

## Resumo

Cada task tem uma caixa: `[ ]` pendente e `[x]` concluída. **A IA só marca `[x]` depois de perguntar ao usuário e ele permitir.**

**Fase 1 — Ambiente e limpeza**
- [x] **Task 1 — Ambiente local** · 1 teste · depende de: —
- [x] **Task 2 — Configuração do projeto** · 1 teste · depende de: 1
- [ ] ~~Task 3 — Limpeza dos arquivos antigos~~ · **dispensada** · 0 testes · os arquivos antigos não atrapalham e ficam
- [ ] ~~Task 4 — Padronização de nomes e pastas~~ · **dispensada** · 0 testes · os nomes de `src/` já seguem a convenção

**Fase 2 — Base**
- [x] **Task 5 — Migration inicial** · 1 teste · depende de: 1
- [x] **Task 6 — Infraestrutura de testes** · 1 teste · depende de: 5
- [x] **Task 7 — Base de erros** · 1 teste · depende de: 6

**Fase 3 — Acesso**
- [x] **Task 8 — Login** · 1 teste · depende de: 7
- [x] **Task 9 — Carga inicial (seed)** · 1 teste · depende de: 5, 6
- [ ] **Task 10 — Cadastro de usuário** · 1 teste · depende de: 8, 9

**Fase 4 — Cadastros**
- [ ] **Task 11 — Produtos** · 1 teste · depende de: 8, 9
- [x] **Task 12 — Planos** · 1 teste · depende de: 8, 9
- [ ] **Task 13 — Clientes** · 2 testes · depende de: 12

**Fase 5 — Compra**
- [x] **Task 14 — Compra** · 3 testes · depende de: 11, 13
- [x] **Task 15 — Troca de plano** · 1 teste · depende de: 13, 14
- [x] **Task 16 — Extrato** · 1 teste · depende de: 14

**Fase 6 — Fechamento**
- [ ] **Task 17 — Swagger** · 1 teste · depende de: 7
- [ ] **Task 18 — Fechamento** · 1 teste · depende de: todas

**Total:** 18 tasks (a 3 e a 4 foram dispensadas) e 19 testes.

---

## Fase 1 — Ambiente e limpeza

### Task 1 — Ambiente local
- **Entrega:** Node.js 22 instalado, dependências instaladas, `.env` criado a partir do `.env.example`, MySQL no Docker Compose com **dois bancos** (desenvolvimento e teste, ambos locais) e a API subindo com `npm run dev`. O banco compartilhado, se continuar em uso, serve só ao desenvolvimento, nunca aos testes.
- **Atende:** RNF-05, RNF-14.
- **Teste:** *os dois bancos, o de desenvolvimento e o de teste, respondem a uma consulta simples*.

### Task 2 — Configuração do projeto
- **Entrega:** `package.json` com o script `test`, o script `db:seed` (e sem o `db:seed:admin`) e as dependências `swagger-ui-express` e `@types/swagger-ui-express`; `tsconfig.json` incluindo `tests/`; `.env.example` com as 11 variáveis e valores falsos; `.gitignore`, `Dockerfile` e `compose.yaml` ajustados.
- **Atende:** `arquitetura/stack.md`, RNF-05, RNF-13, RNF-14.
- **Teste:** *o projeto compila* (`npm run build` termina sem erro).

### Task 3 — Limpeza dos arquivos antigos (dispensada)
- **Motivo:** nada importa `src/config/Security.ts` nem `src/dtos/`, então os arquivos antigos não atrapalham o build nem os testes e ficam onde estão. O `ARQUITETURA.md` e o PDF do enunciado na raiz também ficam. A task fica registrada para não renumerar as demais, e **não tem teste**.

### Task 4 — Padronização de nomes e pastas (dispensada)
- **Motivo:** o grupo decidiu manter a convenção que o código já usa (arquivos em `PascalCase`, no padrão `<Recurso><Papel>.ts`), então não há nada a renomear em `src/`. A task fica registrada para não renumerar as demais, e **não tem teste**.

---

## Fase 2 — Base

### Task 5 — Migration inicial
- **Entrega:** o `schema.prisma` ajustado ao modelo de dados (oito tabelas, índices, `chaveIdempotencia` e `cashbackCortadoCentavos` na compra), a migration `inicial` e a aplicação dela nos dois bancos por `migrate deploy`.
- **Atende:** `dados/modeloDeDados.md`, RN-11, RN-16, RN-26.
- **Teste:** *as oito tabelas existem*: cada uma responde a uma contagem sem erro.

### Task 6 — Infraestrutura de testes
- **Entrega:** um auxiliar que sobe a API em uma porta livre, limpa as tabelas entre os testes e **cria dados auxiliares direto no banco** (usuários ADMIN e ATENDENTE com o hash da senha, e planos, clientes e produtos quando o teste precisar), sem depender das rotas ainda não prontas. O teste do seed é a exceção: roda em banco limpo e espera só o que o seed cria. Quando a task 8 estiver pronta, o auxiliar passa a obter o token pela rota de login.
- **Atende:** RNF-13.
- **Teste:** *o servidor sobe e responde*.

### Task 7 — Base de erros
- **Entrega:** o catálogo `ErrorCodes` com os 25 códigos, o tratador de erros no formato do contrato, a validação do `.env` na partida, a validação de entrada que recusa campos desconhecidos, o limite de **100 KB** no corpo da requisição, o **Helmet** (com o ajuste do `/docs`) e o **CORS** restrito às origens permitidas.
- **Atende:** RNF-03, RNF-04, RNF-05.
- **Teste:** *rota inexistente devolve `404` no formato `{ erro: { codigo, mensagem } }`*, com o código `NOT_FOUND`.

---

## Fase 3 — Acesso

### Task 8 — Login
- **Entrega:** o login conforme a especificação: token com validade configurável (padrão 1 dia), hash fictício quando o e-mail não existe e `INVALID_CREDENTIALS`, e o `authenticate` que confere o usuário no banco a cada requisição.
- **Atende:** RF-01, RNF-01.
- **Teste:** *login válido devolve `token` e `usuario`, sem senha nem hash*.

### Task 9 — Carga inicial (seed)
- **Entrega:** `prisma/Seed.ts` (o arquivo já existe: ajustar ao que a RN-03 e a RN-36 pedem) e `npm run db:seed`, que criam os três planos (com as mensalidades da RN-03) e o primeiro admin a partir das variáveis de ambiente. O arquivo antigo `SeedAdmin.ts` sai aqui.
- **Atende:** RN-03, RN-36, RNF-14.
- **Teste:** *a carga cria 3 planos e 1 admin, e rodar de novo não duplica*.

### Task 10 — Cadastro de usuário
- **Entrega:** `POST /auth/register`, exclusivo do ADMIN, que cria sempre um ATENDENTE.
- **Atende:** RF-02, RN-36.
- **Teste:** *ADMIN cadastra e o usuário nasce ATENDENTE (`201`); sem token, `401`*.

---

## Fase 4 — Cadastros

### Task 11 — Produtos
- **Entrega:** as cinco rotas de produto com paginação, `incluirInativos`, exclusão que desativa, e `POST /produtos/:id/reativar`.
- **Atende:** RF-15 a RF-19, RF-22.
- **Teste:** *criar, desativar (some da lista) e reativar (volta)*.

### Task 12 — Planos
- **Entrega:** as cinco rotas de plano, a reativação, e a recusa de desativar um plano com clientes ativos. Inclui a coluna `mensalidadeCentavos`: uma **migration nova** (a `inicial` não se edita) e o ajuste dos auxiliares e testes que criam plano direto no banco (decisão 7.14).
- **Atende:** RF-10 a RF-14, RF-21, RN-05.
- **Teste:** *criar, consultar, desativar e reativar; desativar um plano com cliente ativo responde `409`*.

### Task 13 — Clientes
- **Entrega:** consultar, atualizar (sem mudar o plano), desativar e reativar cliente, mais os ajustes de cadastro e listagem (plano ativo, paginação, `incluirInativos`), e a rota `GET /planos/receita-mensal` (só ADMIN, declarada antes de `/planos/:id`), que precisa dos clientes.
- **Atende:** RF-03 a RF-07, RF-20, RF-25, RN-38, RN-39.
- **Teste:** *criar, atualizar, desativar e reativar* e *a receita por plano soma os clientes ativos vezes a mensalidade, e o ATENDENTE recebe `403`*.
- **Pendência:** proteger a concorrência entre cadastro/vínculo de clientes a planos e desativação de planos, usando bloqueio da linha do plano; tratar na Task 13.

---

## Fase 5 — Compra

### Task 14 — Compra
- **Entrega:** a compra reescrita: cashback sobre o valor pago, idempotência, bloqueio do cliente, ordem das verificações, `cashbackCortadoCentavos` e o uso do saldo pelo FIFO.
- **Atende:** RF-23, RF-24, RN-06 a RN-27.
- **Testes (3):**
  1. *compra de R$ 100 usando R$ 20 de cashback gera cashback de 2% sobre os R$ 80 pagos (R$ 1,60), em um lote*;
  2. *a mesma `Idempotency-Key` devolve `200` e não duplica a compra*;
  3. *usar o saldo consome primeiro o lote que vence antes*, com dois lotes de vencimentos diferentes.

### Task 15 — Troca de plano
- **Entrega:** `POST /clientes/:id/trocar-plano`, exclusivo do ADMIN, mantendo o saldo e os lotes.
- **Atende:** RF-08, RN-28 a RN-30.
- **Teste:** *a troca de plano mantém o saldo do cliente e passa a valer o novo limite*.

### Task 16 — Extrato
- **Entrega:** `GET /clientes/:id/extrato`, que não grava nada.
- **Atende:** RF-09, RN-22, RN-25, RN-26.
- **Teste:** *depois de uma compra, o extrato mostra o saldo e o lote*.

---

## Fase 6 — Fechamento

### Task 17 — Swagger
- **Entrega:** `GET /docs`, com o OpenAPI 3.1 gerado dos schemas Zod e o botão de autenticação.
- **Atende:** RNF-12.
- **Teste:** *`GET /docs` responde `200` e o documento lista as rotas*.

### Task 18 — Fechamento
- **Entrega:** remover o `NotImplemented.ts`, atualizar o README (instalação, execução e como rodar os testes) e a revisão final, que inclui a **revisão manual da segurança**: limite do corpo, Helmet, CORS, token, senha com hash, logs sem segredos e o hash fictício do login.
- **Atende:** RNF-05, RNF-14.
- **Teste:** *o servidor não sobe quando falta uma variável obrigatória, como a `JWT_SECRET`*. Ao fim, `npm test` roda os 19 testes.

---

## O que os testes não cobrem

Com um teste simples por task, estas garantias **serão revisadas manualmente, sem cobertura automatizada prevista**: o aniversário no horário de Brasília, a expiração no instante exato do vencimento, o limite do plano depois do débito, o desfazer da compra em caso de falha (rollback) e a concorrência entre compras. Se o grupo quiser testá-las, entram como testes novos, e o total sobe.
