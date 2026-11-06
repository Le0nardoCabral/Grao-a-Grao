# Contratos

O que cada rota recebe e devolve: campos, formatos e limites. As rotas estão em [endpoints.md](endpoints.md).

- **Versão:** 0.4
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
| 6 | Campo opcional pode ser omitido ou vir `null`. |
| 7 | Cabeçalhos: `Authorization: Bearer <token>` nas rotas privadas, `Content-Type: application/json` nas que têm corpo e `Idempotency-Key` na compra. |
| 8 | `DELETE` responde `204` sem corpo. |
| 9 | Valores têm **limites** para caber no banco: preço de produto até 10.000.000 centavos, quantidade até 1.000 por item, até 100 itens por compra e **valor bruto da compra até 100.000.000 centavos** (R$ 1 milhão). Acima disso, `400`. |

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

| Código | Status HTTP | Quando |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Dados da requisição inválidos: JSON malformado, `Content-Type` errado, tipo errado, campo fora do limite, campo desconhecido, `produtoId` repetido, ou combinação inválida num `PUT` de plano. |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | A compra chegou sem o cabeçalho `Idempotency-Key`. |
| `INVALID_PURCHASE_AMOUNT` | 400 | O valor bruto da compra passa do teto. |
| `CASHBACK_EXCEEDS_PURCHASE` | 400 | O cashback solicitado é maior que o valor bruto da compra. |
| `CASHBACK_BELOW_PLAN_MINIMUM` | 400 | O cashback solicitado é menor que o mínimo de uso do plano. |
| `UNAUTHENTICATED` | 401 | Token ausente, inválido ou vencido, ou usuário inativo. |
| `INVALID_CREDENTIALS` | 401 | E-mail ou senha incorretos no login, ou usuário inativo. |
| `FORBIDDEN` | 403 | O perfil não tem permissão, ou o ATENDENTE enviou `incluirInativos`. |
| `NOT_FOUND` | 404 | A rota não existe. |
| `CLIENT_NOT_FOUND` | 404 | Cliente inexistente, ou desativado e consultado sem `incluirInativos`. |
| `PLAN_NOT_FOUND` | 404 | Plano inexistente, ou desativado e consultado sem `incluirInativos`. |
| `PRODUCT_NOT_FOUND` | 404 | Produto inexistente, ou desativado e consultado sem `incluirInativos`. |
| `USER_ALREADY_EXISTS` | 409 | Já existe um usuário com esse e-mail. |
| `CLIENT_ALREADY_EXISTS` | 409 | Já existe um cliente com esse e-mail. |
| `PLAN_ALREADY_EXISTS` | 409 | Já existe um plano com esse nome. |
| `PRODUCT_ALREADY_EXISTS` | 409 | Já existe um produto com esse nome. |
| `CLIENT_INACTIVE` | 409 | A compra é de um cliente desativado. |
| `PLAN_INACTIVE` | 409 | O plano está desativado e a operação exige um plano ativo: cadastro de cliente, compra, troca de plano ou reativação de cliente. |
| `PRODUCT_INACTIVE` | 409 | A compra inclui um produto desativado. |
| `PLAN_HAS_ACTIVE_CLIENTS` | 409 | Tentativa de desativar um plano que ainda tem clientes ativos. |
| `ALREADY_ACTIVE` | 409 | Tentativa de reativar um cliente, plano ou produto que já está ativo. |
| `INSUFFICIENT_CASHBACK` | 409 | O cashback solicitado é maior que o saldo disponível. |
| `IDEMPOTENCY_KEY_CONFLICT` | 409 | A mesma `Idempotency-Key` chegou com conteúdo diferente. |
| `INTERNAL_ERROR` | 500 | Falha inesperada. A resposta nunca traz detalhe interno. |

Todo código usado pelo sistema precisa constar nesta tabela. O catálogo do código (`ErrorCodes`) usa exatamente estes nomes.

## 3. Paginação

| Item | Definição |
|---|---|
| Entrada | Query `pagina` (padrão 1) e `limite` (padrão 20, máximo 100). |
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
| `lotesAVencer` | lista | Lotes que vencem nos próximos 30 dias: `id`, `saldoCentavos`, `venceEm`. |
| `movimentos` | lista | Os últimos 50, do mais novo ao mais antigo: `tipo`, `valorCentavos`, `ocorreuEm`, `compraId`, `loteId`. O `compraId` é `null` na expiração, que não vem de uma compra. |

O `tipo` do movimento é um valor de enum: `CREDITO`, `USO` ou `EXPIRACAO`.

---

## 6. Planos

### Objeto plano

| Campo | Tipo | Observação |
|---|---|---|
| `id` | inteiro | |
| `nome` | texto | Único. De 2 a 80 caracteres. |
| `percentualBps` | inteiro | De 1 a 5.000 (de 0,01% a 50%), para que o dobro do aniversário chegue no máximo a 100%. |
| `limiteCentavos` | inteiro | Maior que zero, até 100.000.000. |
| `minimoUsoCentavos` | inteiro | De zero até 100.000.000, e **não maior que o `limiteCentavos`** do mesmo plano. |
| `dobroAniversario` | booleano | |
| `validadeDias` | inteiro | De 1 a 3.650 (10 anos). Padrão 180. |
| `ativo` | booleano | |
| `criadoEm`, `atualizadoEm` | data e hora | |

### Entradas e saídas

| Rota | Entrada | Saída |
|---|---|---|
| `POST /planos` | `nome`, `percentualBps`, `limiteCentavos`, `minimoUsoCentavos` (obrigatórios); `dobroAniversario`, `validadeDias` | `201` com o plano |
| `GET /planos` | Paginação e `incluirInativos` | `200` com a página de planos |
| `GET /planos/:id` | `incluirInativos` | `200` com o plano |
| `PUT /planos/:id` | Qualquer campo do cadastro. Ao menos um. | `200` com o plano |
| `DELETE /planos/:id` | — | `204` |
| `POST /planos/:id/reativar` | — | `200` com o plano |

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

## 9. Documentação

`GET /docs` devolve a página do Swagger. Não tem contrato de dados: a descrição de todas as rotas vem gerada dos schemas de validação.
