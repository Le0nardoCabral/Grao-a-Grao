# Endpoints

Rotas da API, quem pode usar cada uma e a qual requisito ela atende. Os corpos de entrada e saída ficam em `contratos.md`.

- **Versão:** 0.2
- **Data:** 2026-11-06
- **Status:** `aprovado`, `proposto` (aguarda confirmação) ou `em aberto` (depende de uma decisão).

---

## Regras gerais

| # | Regra | Status |
|---|---|---|
| 1 | Toda rota exige autenticação por token (`Authorization: Bearer`), **exceto** o login e a documentação (`/docs`). | aprovado |
| 2 | **Ambos** significa os perfis ADMIN e ATENDENTE. | aprovado |
| 3 | Rotas em português, no plural e em minúsculas. Ação composta com hífen. As exceções são `/auth` e `/docs`, nomes consagrados. | aprovado |
| 4 | Toda listagem aceita paginação. | aprovado |
| 5 | Listagens e consultas aceitam o filtro `incluirInativos`, que só o ADMIN pode usar com o valor `true`, para ver os desativados. Se o ATENDENTE enviar `incluirInativos=true`, a resposta é `403`. O valor `false` é o padrão e é aceito. | aprovado |
| 6 | `DELETE` desativa o registro e responde sem corpo. Nada é apagado. | aprovado |
| 7 | A reativação tem rota própria, `POST /<recurso>/:id/reativar`, e é exclusiva do ADMIN. | aprovado |
| 8 | Um registro desativado que é o alvo da rota (`:id`) responde `404`, inclusive no extrato, exceto na reativação e na consulta com `incluirInativos=true` (ADMIN). Quando o desativado é uma referência no corpo (`clienteId`, `produtoId`, `planoId`), a resposta é `409` com `CLIENT_INACTIVE`, `PRODUCT_INACTIVE` ou `PLAN_INACTIVE`. | aprovado |
| 9 | Reativar um registro que já está ativo responde `409`. | aprovado |
| 10 | Desativar de novo um registro já desativado, ou atualizá-lo, responde `404`. Trocar o cliente para o plano em que já está responde `200`, sem alterar nada. | aprovado |
| 11 | Rota com parâmetro `:id` ou com filtro na URL pode responder `400` quando o valor é inválido. | aprovado |

## Resumo

| Grupo | Rotas |
|---|---|
| Acesso | 2 |
| Clientes | 7 |
| Planos | 6 |
| Produtos | 5 |
| Reativação | 3 |
| Compras | 1 |
| Auxiliares | 1 |
| **Total** | **25** |

---

## Acesso

| Método | Rota | O que faz | Quem | Requisito | Respostas | Status |
|---|---|---|---|---|---|---|
| POST | `/auth/login` | Entra com e-mail e senha e devolve o token. | Público | RF-01 | 200, 400, 401 | aprovado |
| POST | `/auth/register` | Cadastra um usuário, sempre como ATENDENTE. | ADMIN | RF-02 | 201, 400, 401, 403, 409 | aprovado |

## Clientes

| Método | Rota | O que faz | Quem | Requisito | Respostas | Status |
|---|---|---|---|---|---|---|
| POST | `/clientes` | Cadastra um cliente. | Ambos | RF-03 | 201, 400, 401, 404, 409 | aprovado |
| GET | `/clientes` | Lista clientes, com paginação. | Ambos | RF-04 | 200, 400, 401, 403 | aprovado |
| GET | `/clientes/:id` | Consulta um cliente. | Ambos | RF-05 | 200, 400, 401, 403, 404 | aprovado |
| PUT | `/clientes/:id` | Atualiza os dados do cliente, sem alterar o plano. | Ambos | RF-06 | 200, 400, 401, 404, 409 | aprovado |
| DELETE | `/clientes/:id` | Desativa o cliente. | ADMIN | RF-07 | 204, 400, 401, 403, 404 | aprovado |
| POST | `/clientes/:id/trocar-plano` | Troca o plano do cliente. | ADMIN | RF-08 | 200, 400, 401, 403, 404, 409 | aprovado |
| GET | `/clientes/:id/extrato` | Mostra saldo disponível, lotes a vencer e histórico. | Ambos | RF-09 | 200, 400, 401, 403, 404 | aprovado |

## Planos

| Método | Rota | O que faz | Quem | Requisito | Respostas | Status |
|---|---|---|---|---|---|---|
| POST | `/planos` | Cadastra um plano. | ADMIN | RF-10 | 201, 400, 401, 403, 409 | aprovado |
| GET | `/planos` | Lista planos. | Ambos | RF-11 | 200, 400, 401, 403 | aprovado |
| GET | `/planos/:id` | Consulta um plano. | Ambos | RF-12 | 200, 400, 401, 403, 404 | aprovado |
| PUT | `/planos/:id` | Atualiza um plano. | ADMIN | RF-13 | 200, 400, 401, 403, 404, 409 | aprovado |
| DELETE | `/planos/:id` | Desativa um plano. Recusa se ele ainda tiver clientes ativos. | ADMIN | RF-14 | 204, 400, 401, 403, 404, 409 | aprovado |
| GET | `/planos/receita-mensal` | Mostra, por plano ativo, os clientes ativos e a receita mensal estimada. | ADMIN | RF-25 | 200, 401, 403 | aprovado |

## Produtos

| Método | Rota | O que faz | Quem | Requisito | Respostas | Status |
|---|---|---|---|---|---|---|
| POST | `/produtos` | Cadastra um produto. | ADMIN | RF-15 | 201, 400, 401, 403, 409 | aprovado |
| GET | `/produtos` | Lista produtos ativos. | Ambos | RF-16 | 200, 400, 401, 403 | aprovado |
| GET | `/produtos/:id` | Consulta um produto. | Ambos | RF-17 | 200, 400, 401, 403, 404 | aprovado |
| PUT | `/produtos/:id` | Atualiza um produto. | ADMIN | RF-18 | 200, 400, 401, 403, 404, 409 | aprovado |
| DELETE | `/produtos/:id` | Desativa um produto. | ADMIN | RF-19 | 204, 400, 401, 403, 404 | aprovado |

## Reativação

| Método | Rota | O que faz | Quem | Requisito | Respostas | Status |
|---|---|---|---|---|---|---|
| POST | `/clientes/:id/reativar` | Reativa um cliente desativado. | ADMIN | RF-20 | 200, 400, 401, 403, 404, 409 | aprovado |
| POST | `/planos/:id/reativar` | Reativa um plano desativado. | ADMIN | RF-21 | 200, 400, 401, 403, 404, 409 | aprovado |
| POST | `/produtos/:id/reativar` | Reativa um produto desativado. | ADMIN | RF-22 | 200, 400, 401, 403, 404, 409 | aprovado |

## Compras

| Método | Rota | O que faz | Quem | Requisito | Respostas | Status |
|---|---|---|---|---|---|---|
| POST | `/compras` | Registra a compra, usa o saldo e gera o cashback. Exige o cabeçalho `Idempotency-Key`. | Ambos | RF-23, RF-24 | 201, 200, 400, 401, 404, 409 | aprovado |

### Respostas da compra

| Código | Quando |
|---|---|
| 201 | Compra registrada pela primeira vez. |
| 200 | Mesma chave e mesmo conteúdo: devolve a compra original, sem registrar de novo. |
| 400 | Sem o cabeçalho, entrada inválida, uso de cashback acima do valor bruto, ou abaixo do mínimo do plano. |
| 404 | Cliente ou produto inexistente. |
| 409 | Saldo de cashback insuficiente, mesma chave com conteúdo diferente, ou cliente, plano ou produto desativado. |

## Auxiliares

| Método | Rota | O que faz | Quem | Requisito | Respostas | Status |
|---|---|---|---|---|---|---|
| GET | `/docs` | Mostra a documentação da API (Swagger), onde as rotas podem ser testadas. | Público | RNF-12 | 200 | aprovado |

O `/health` do projeto atual não faz parte da especificação.

---

## Significado dos códigos

| Código | Significado |
|---|---|
| 200 | Sucesso |
| 201 | Criado |
| 204 | Sucesso sem corpo |
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Sem permissão para o perfil |
| 404 | Não encontrado |
| 409 | Conflito com o estado atual |
