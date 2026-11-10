# Contratos

O que cada rota recebe e devolve: campos, formatos e limites. As rotas estão em [endpoints.md](endpoints.md).

- **Versão:** 0.7
- **Data:** 2026-11-06
- **Status:** `aprovado`.

---

## 1. Convenções gerais

| # | Convenção |
|---|---|
| 1 | Entrada e saída em **JSON**, com campos em `camelCase`. |
| 2 | Identificadores são **números inteiros**. |
| 3 | **Dinheiro** em centavos inteiros, nos campos com sufixo `Centavos`. **Percentual** em pontos-base, no campo `percentualBps` (2% é 200). |
| 4 | **Datas e horas** em ISO 8601 e UTC (`2026-11-06T13:00:00.000Z`). A data de nascimento é só a data (`1990-05-17`). |
| 5 | Campo que não existe no contrato é **rejeitado** com `400`. |
| 6 | Campo opcional pode ser **omitido**. `null` só é aceito nos campos marcados "ou `null`" (e-mail, telefone, data de nascimento e descrição). Nos demais, `null` responde `VALIDATION_ERROR`. Campo com padrão (`validadeDias`, `dobroAniversario`, `cashbackSolicitadoCentavos`) usa o padrão **só no cadastro**. Em uma **atualização** (`PUT`), campo omitido **mantém o valor gravado**. |
| 7 | Cabeçalhos: `Authorization: Bearer <token>` nas rotas privadas, `Content-Type: application/json` nas que têm corpo e `Idempotency-Key` na compra. |
| 8 | `DELETE` responde `204` sem corpo. |
| 9 | Valores têm **limites** para caber no banco: preço de produto até 10.000.000 centavos, quantidade até 1.000 por item, até 100 itens por compra e **valor bruto da compra até 100.000.000 centavos** (R$ 1 milhão). Acima disso, `400`. |
| 10 | Um registro **desativado** é tratado como **inexistente** (`404`) quando é o alvo da rota (o `:id` da URL), exceto na reativação e na consulta com `incluirInativos` (ADMIN). Quando o desativado é uma **referência no corpo** (`clienteId`, `produtoId`, `planoId`), a resposta é `409` com `CLIENT_INACTIVE`, `PRODUCT_INACTIVE` ou `PLAN_INACTIVE`. |
| 11 | Desativar de novo um registro já desativado, ou atualizar um desativado, responde `404`. Trocar o cliente para o plano em que ele já está responde `200`, sem alterar nada. |

## 2. Resposta de erro

Toda falha usa o mesmo formato, sem rastro interno.

Erro de validação (`400`), com `detalhes`:

```json
{
  "erro": {
    "codigo": "VALIDATION_ERROR",
    "mensagem": "Dados da requisição inválidos.",
    "detalhes": [{ "campo": "clienteId", "mensagem": "Deve ser um inteiro positivo." }]
  }
}
```

Outro erro (`404`), sem `detalhes`:

```json
{
  "erro": {
    "codigo": "CLIENT_NOT_FOUND",
    "mensagem": "Cliente não encontrado."
  }
}
```

| Campo | Significado |
|---|---|
| `codigo` | Código fixo e em inglês, listado no catálogo abaixo. |
| `mensagem` | Texto em português para quem lê. |
| `detalhes` | Lista de `campo` e `mensagem`. Só aparece em erro de validação (`400`). |

### Catálogo de códigos

| Código | Status HTTP | Quando | Rotas |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Dados da requisição inválidos: JSON malformado, corpo acima de 100 KB, `Content-Type` errado, tipo errado, campo fora do limite, campo desconhecido, `produtoId` repetido, ou combinação inválida num `PUT` de plano. | Toda rota com corpo, parâmetro ou filtro |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | A compra chegou sem o cabeçalho `Idempotency-Key`. | `POST /compras` |
| `INVALID_PURCHASE_AMOUNT` | 400 | O valor bruto da compra passa do teto. | `POST /compras` |
| `CASHBACK_EXCEEDS_PURCHASE` | 400 | O cashback solicitado é maior que o valor bruto da compra. | `POST /compras` |
| `CASHBACK_BELOW_PLAN_MINIMUM` | 400 | O cashback solicitado é menor que o mínimo de uso do plano. | `POST /compras` |
| `UNAUTHENTICATED` | 401 | Token ausente, inválido ou vencido, ou usuário inativo. | Toda rota privada |
| `INVALID_CREDENTIALS` | 401 | E-mail ou senha incorretos no login, ou usuário inativo. | `POST /auth/login` |
| `FORBIDDEN` | 403 | O perfil não tem permissão, ou o ATENDENTE enviou `incluirInativos=true`. | Rotas exclusivas do ADMIN; listagens, consultas e extrato |
| `NOT_FOUND` | 404 | A rota não existe. | Qualquer caminho inexistente |
| `CLIENT_NOT_FOUND` | 404 | Cliente inexistente, ou desativado e consultado sem `incluirInativos`. | Rotas de cliente com `:id`, extrato, troca de plano, reativação de cliente, `POST /compras` |
| `PLAN_NOT_FOUND` | 404 | Plano inexistente, ou desativado e consultado sem `incluirInativos`. | Rotas de plano com `:id`, reativação de plano, `POST /clientes`, troca de plano |
| `PRODUCT_NOT_FOUND` | 404 | Produto inexistente, ou desativado e consultado sem `incluirInativos`. | Rotas de produto com `:id`, reativação de produto, `POST /compras` |
| `USER_ALREADY_EXISTS` | 409 | Já existe um usuário com esse e-mail. | `POST /auth/register` |
| `CLIENT_ALREADY_EXISTS` | 409 | Já existe um cliente com esse e-mail. | `POST /clientes`, `PUT /clientes/:id` |
| `PLAN_ALREADY_EXISTS` | 409 | Já existe um plano com esse nome. | `POST /planos`, `PUT /planos/:id` |
| `PRODUCT_ALREADY_EXISTS` | 409 | Já existe um produto com esse nome. | `POST /produtos`, `PUT /produtos/:id` |
| `CLIENT_INACTIVE` | 409 | A compra é de um cliente desativado. | `POST /compras` |
| `PLAN_INACTIVE` | 409 | O plano está desativado e a operação exige um plano ativo: cadastro de cliente, compra, troca de plano ou reativação de cliente. | `POST /clientes`, `POST /compras`, troca de plano, reativação de cliente |
| `PRODUCT_INACTIVE` | 409 | A compra inclui um produto desativado. | `POST /compras` |
| `PLAN_HAS_ACTIVE_CLIENTS` | 409 | Tentativa de desativar um plano que ainda tem clientes ativos. | `DELETE /planos/:id` |
| `ALREADY_ACTIVE` | 409 | Tentativa de reativar um cliente, plano ou produto que já está ativo. | As três rotas de reativação |
| `INSUFFICIENT_CASHBACK` | 409 | O cashback solicitado é maior que o saldo disponível. | `POST /compras` |
| `IDEMPOTENCY_KEY_CONFLICT` | 409 | A mesma `Idempotency-Key` chegou com conteúdo diferente. | `POST /compras` |
| `PURCHASE_CONFLICT` | 409 | Conflito temporário ao registrar a compra: a espera pelo bloqueio esgotou ou o banco abortou a transação. Repetir com a mesma chave. | `POST /compras` |
| `INTERNAL_ERROR` | 500 | Falha inesperada. A resposta nunca traz detalhe interno. | Qualquer rota |

Todo código usado pelo sistema precisa constar nesta tabela. O catálogo do código (`ErrorCodes`) usa exatamente estes nomes.

## 3. Paginação

| Item | Definição |
|---|---|
| Entrada | Query `pagina` (padrão 1, mínimo 1) e `limite` (padrão 20, de 1 a 100). Fora desses valores, `400`. |
| Ordem | Por `nome` crescente e, em empate, por `id` crescente. |
| Saída | `{ "dados": [...], "pagina": 1, "limite": 20, "total": 134 }` |
| Filtro | `incluirInativos=true`, só para o ADMIN. |

Valem para `GET /clientes`, `GET /planos` e `GET /produtos`.

---

## 4. Acesso

### `POST /auth/login`

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `email` | texto | sim | E-mail válido. |
| `senha` | texto | sim | Até 72 bytes. |

Resposta `200`: `token` (texto) e `usuario` (`id`, `nome`, `email`, `perfil`).

### `POST /auth/register`

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `nome` | texto | sim | De 2 a 120 caracteres. |
| `email` | texto | sim | E-mail válido, até 190 caracteres. A API converte para minúsculas. |
| `senha` | texto | sim | No mínimo 8 **caracteres** e no máximo 72 **bytes**. Acentos e emojis ocupam mais de um byte. |

Resposta `201`: `id`, `nome`, `email`, `perfil` (sempre `ATENDENTE`) e `ativo`. A senha e o hash nunca saem.

---

## 5. Clientes

### Objeto cliente

| Campo | Tipo | Observação |
|---|---|---|
| `id` | inteiro | |
| `nome` | texto | De 2 a 120 caracteres. |
| `email` | texto ou `null` | Único. Até 190 caracteres. A API converte para minúsculas. |
| `telefone` | texto ou `null` | De 8 a 30 caracteres. |
| `dataNascimento` | data ou `null` | `AAAA-MM-DD`. Não pode ser futura (o "hoje" vale no horário de Brasília) nem anterior a 1900-01-01. |
| `plano` | objeto | `id` e `nome`. |
| `ativo` | booleano | |
| `criadoEm`, `atualizadoEm` | data e hora | |

### Entradas e saídas

| Rota | Entrada | Saída |
|---|---|---|
| `POST /clientes` | `nome`, `planoId` (obrigatórios); `email`, `telefone`, `dataNascimento` | `201` com o cliente |
| `GET /clientes` | Paginação e `incluirInativos` | `200` com a página de clientes |
| `GET /clientes/:id` | `incluirInativos` | `200` com o cliente |
| `PUT /clientes/:id` | `nome`, `email`, `telefone`, `dataNascimento`. Ao menos um campo. **Não aceita `planoId`.** | `200` com o cliente |
| `DELETE /clientes/:id` | — | `204` |
| `POST /clientes/:id/trocar-plano` | `planoId` (obrigatório) | `200` com o cliente |
| `POST /clientes/:id/reativar` | — | `200` com o cliente |
| `GET /clientes/:id/extrato` | `incluirInativos` | `200` com o extrato |


### Extrato

| Campo | Tipo | Observação |
|---|---|---|
| `clienteId` | inteiro | |
| `saldoDisponivelCentavos` | inteiro | Soma dos lotes não vencidos. |
| `lotesAVencer` | lista | Lotes com `agora < venceEm <= agora + 30 dias`, do que vence primeiro ao que vence depois: `id`, `saldoCentavos`, `venceEm`. |
| `movimentos` | lista | Os últimos 50, do mais novo ao mais antigo: `tipo`, `valorCentavos`, `ocorreuEm`, `compraId`, `loteId`. O `compraId` é `null` na expiração, que não vem de uma compra. |

O `tipo` do movimento é um valor de enum: `CREDITO`, `USO` ou `EXPIRACAO`.

**Critérios do extrato**, para a resposta ser sempre a mesma:

| # | Critério |
|---|---|
| 1 | Uma compra que consome três lotes gera **três movimentos de uso**, um por lote. |
| 2 | A `ocorreuEm` de uma expiração é o `venceEm` do lote. |
| 3 | A ordem é do mais novo ao mais antigo por `ocorreuEm`. Em empate, vale a ordem fixa de tipo `CREDITO`, `USO`, `EXPIRACAO` e, dentro do mesmo tipo, o maior id da origem (lote ou uso). |
| 4 | O corte nos 50 movimentos acontece **depois** dessa ordenação. |
| 5 | Como o extrato não grava nada, o lote vencido aparece como expiração mesmo antes de ser marcado no banco. A resposta é a mesma antes e depois dessa marcação. |
| 6 | Só um lote `ATIVO` ou `PARCIAL`, **com saldo positivo**, produz expiração. Um lote `CONSUMIDO` não gera movimento de perda, mesmo depois de vencido. |

---

## 6. Planos

### Objeto plano

| Campo | Tipo | Observação |
|---|---|---|
| `id` | inteiro | |
| `nome` | texto | Único. De 2 a 80 caracteres. |
| `percentualBps` | inteiro | De 1 a 5.000 (de 0,01% a 50%), para que o dobro do aniversário chegue no máximo a 100%. |
| `limiteCentavos` | inteiro | Maior que zero, até 100.000.000. |
| `mensalidadeCentavos` | inteiro | De zero até 100.000.000. Preço mensal do plano, só informativo. |
| `minimoUsoCentavos` | inteiro | De zero até 100.000.000, e **não maior que o `limiteCentavos`** do mesmo plano. |
| `dobroAniversario` | booleano | Padrão falso. |
| `validadeDias` | inteiro | De 1 a 3.650 (10 anos). Padrão 180. |
| `ativo` | booleano | |
| `criadoEm`, `atualizadoEm` | data e hora | |

### Entradas e saídas

| Rota | Entrada | Saída |
|---|---|---|
| `POST /planos` | `nome`, `percentualBps`, `limiteCentavos`, `mensalidadeCentavos`, `minimoUsoCentavos` (obrigatórios); `dobroAniversario`, `validadeDias` | `201` com o plano |
| `GET /planos` | Paginação e `incluirInativos` | `200` com a página de planos |
| `GET /planos/:id` | `incluirInativos` | `200` com o plano |
| `PUT /planos/:id` | Qualquer campo do cadastro. Ao menos um. | `200` com o plano |
| `DELETE /planos/:id` | — | `204` |
| `POST /planos/:id/reativar` | — | `200` com o plano |
| `GET /planos/receita-mensal` | — | `200` com a receita por plano (abaixo) |

### Receita mensal por plano

`GET /planos/receita-mensal` é só do ADMIN, não tem entrada e não é paginada. A rota é declarada **antes** de `/planos/:id`.

| Campo | Tipo | Observação |
|---|---|---|
| `planos[]` | lista | Só os planos **ativos**, ordenados por `id`. |
| `planos[].id`, `planos[].nome` | inteiro e texto | Identificam o plano. |
| `planos[].mensalidadeCentavos` | inteiro | A mensalidade do plano. |
| `planos[].clientesAtivos` | inteiro | Clientes **ativos** do plano. Zero quando não há nenhum. |
| `planos[].receitaMensalCentavos` | inteiro | `clientesAtivos` × `mensalidadeCentavos`. |
| `totalClientesAtivos` | inteiro | Soma de `clientesAtivos`. |
| `receitaMensalTotalCentavos` | inteiro | Soma de `receitaMensalCentavos`. |

É uma **estimativa informativa** (RN-39): não depende de pagamentos. Erros possíveis: `UNAUTHENTICATED` (401) e `FORBIDDEN` (403).

No `PUT`, a regra "mínimo de uso não maior que o limite" vale sobre os **valores resultantes**: o que foi enviado junto com o que já estava gravado. Se a combinação ficar inválida, a resposta é `VALIDATION_ERROR` (`400`).


---

## 7. Produtos

### Objeto produto

| Campo | Tipo | Observação |
|---|---|---|
| `id` | inteiro | |
| `nome` | texto | Único. De 2 a 120 caracteres. |
| `descricao` | texto ou `null` | Até 2.000 caracteres. |
| `precoCentavos` | inteiro | Maior que zero, até 10.000.000. |
| `ativo` | booleano | |
| `criadoEm`, `atualizadoEm` | data e hora | |

### Entradas e saídas

| Rota | Entrada | Saída |
|---|---|---|
| `POST /produtos` | `nome`, `precoCentavos` (obrigatórios); `descricao` | `201` com o produto |
| `GET /produtos` | Paginação e `incluirInativos` | `200` com a página de produtos |
| `GET /produtos/:id` | `incluirInativos` | `200` com o produto |
| `PUT /produtos/:id` | Qualquer campo do cadastro. Ao menos um. | `200` com o produto |
| `DELETE /produtos/:id` | — | `204` |
| `POST /produtos/:id/reativar` | — | `200` com o produto |


---

## 8. Compra

### `POST /compras`

**Cabeçalho obrigatório:** `Idempotency-Key`, texto livre de 1 a 64 caracteres. Para reenviar a mesma compra, use a mesma chave.

**Idempotência, em detalhe**

| # | Regra |
|---|---|
| 1 | A chave vale **por usuário**: o mesmo texto de dois usuários são chaves diferentes. |
| 2 | "Mesmo conteúdo" é o mesmo `clienteId`, os mesmos itens (`produtoId` e `quantidade`), **sem importar a ordem**, e o mesmo cashback solicitado (omitido vale zero). |
| 3 | Duas requisições simultâneas com a mesma chave: a primeira grava, e a segunda espera dentro dos limites da transação. A segunda recebe `200` com a compra gravada se o conteúdo for igual, ou `409` se for diferente. |
| 4 | A chave **só existe se a compra foi gravada**. Uma primeira tentativa desfeita (por falha ou conflito) **não reserva a chave**. |
| 5 | Se a espera esgotar, ou o banco abortar uma transação por conflito, a resposta é `409` com `PURCHASE_CONFLICT`. Não há nova tentativa interna: quem chama repete a compra com a **mesma chave**. |

**Corpo**

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `clienteId` | inteiro | sim | Inteiro positivo. |
| `itens` | lista | sim | De 1 a 100 itens. Cada `produtoId` aparece **uma vez**; repetido, a compra é recusada com `400`. |
| `itens[].produtoId` | inteiro | sim | Inteiro positivo. |
| `itens[].quantidade` | inteiro | sim | De 1 a 1.000. |
| `cashbackSolicitadoCentavos` | inteiro | não | De zero até 100.000.000. Padrão 0. |

O atendente **não** informa preço nem total (RN-07).

**Resposta `201`** (e `200` na repetição, veja abaixo)

| Campo | Tipo | Observação |
|---|---|---|
| `compra` | objeto | `id`, `clienteId`, `usuarioId`, `valorBrutoCentavos`, `cashbackUsadoCentavos`, `valorPagoCentavos`, `cashbackGeradoCentavos`, `criadaEm` e `itens`. |
| `compra.itens[]` | lista | `produtoId`, `quantidade`, `precoUnitarioCentavos`, `subtotalCentavos`. |
| `cashbackCalculadoCentavos` | inteiro | O que a regra calculou antes do limite. |
| `cashbackCortadoCentavos` | inteiro | A parte que o limite do plano cortou. Zero quando nada foi cortado. |
| `saldoDisponivelCentavos` | inteiro | Saldo do cliente depois da compra. |
| `limiteAtingido` | booleano | `true` quando o saldo chegou ou passou do limite do plano. |
| `motivoCashbackNaoGerado` | texto ou `null` | Valor de enum: `LIMITE_DO_PLANO_ATINGIDO` ou `VALOR_ARREDONDADO_PARA_ZERO`. `null` quando gerou cashback. |

**Na repetição (`200`)**, a resposta traz a compra original como foi gravada, incluindo `cashbackCortadoCentavos`, que a compra guarda. O `cashbackCalculadoCentavos` (gerado mais cortado) e o `motivoCashbackNaoGerado` saem desses valores. O `saldoDisponivelCentavos` e o `limiteAtingido` são calculados **no momento da repetição**, e podem diferir dos da primeira resposta.


### Ordem das verificações

Quando a compra tem mais de um problema, vale o **primeiro** encontrado nesta ordem:

| # | Verificação | Resposta |
|---|---|---|
| 1 | Autenticação e perfil | `401` ou `403` |
| 2 | Validação do corpo e do cabeçalho (inclui `produtoId` repetido e chave ausente) | `400` |
| 3 | Idempotência: chave já usada com o mesmo conteúdo | `200`, devolve a compra original |
| 3 | Idempotência: chave já usada com conteúdo diferente | `409` |
| 4 | Existência do cliente e dos produtos | `404` |
| 5 | Cliente, plano ou produto desativado | `409` |
| 6 | Valor bruto acima do teto, cashback acima da compra, cashback abaixo do mínimo | `400` |
| 7 | Saldo de cashback insuficiente | `409` |

---

## 9. Documentação (Swagger)

`GET /docs` devolve a página do Swagger, onde as rotas podem ser lidas e testadas. A rota não tem contrato de dados.

| # | Regra | Status |
|---|---|---|
| 1 | A documentação segue o padrão **OpenAPI 3.1** e cobre as 24 rotas da API. | aprovado |
| 2 | A descrição é **gerada dos schemas Zod** que validam cada rota, para a documentação e a validação não divergirem. O Zod 4 já converte schema em esquema JSON, e o documento OpenAPI é montado em `docs/openApi.ts`, sem gerador extra. | aprovado |
| 3 | A página é servida por **`swagger-ui-express`**, uma dependência nova, com os tipos (`@types/swagger-ui-express`) em desenvolvimento. | aprovado |
| 4 | Cada rota informa o resumo, se é pública ou privada, os campos de entrada, o corpo de resposta e os códigos de erro possíveis, tirados do catálogo desta página. | aprovado |
| 5 | A autenticação aparece como **Bearer (JWT)**, com o botão "Authorize" para colar o token uma vez. | aprovado |
| 6 | O cabeçalho `Idempotency-Key` aparece como obrigatório na compra. | aprovado |

### Como usar a página

1. Subir a API e abrir `http://localhost:3000/docs`.
2. Em `POST /auth/login`, clicar em **Try it out**, preencher e-mail e senha e executar.
3. Copiar o `token` da resposta e colá-lo no botão **Authorize**.
4. Abrir qualquer rota, clicar em **Try it out**, preencher os campos e executar.
5. Conferir o código e o corpo da resposta, que aparecem abaixo.
