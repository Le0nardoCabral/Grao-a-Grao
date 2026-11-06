# Glossário

Termos usados na especificação, com o significado que eles têm neste projeto.

- **Versão:** 0.1
- **Data:** 2026-11-06
- **Status:** `aprovado`, `proposto` (aguarda confirmação) ou `em aberto` (depende de uma decisão).

---

## Programa de cashback

| Termo | Significado | Regras | Status |
|---|---|---|---|
| **Cashback** | Parte do valor de uma compra que volta ao cliente como crédito. | RN-13 | aprovado |
| **Plano** | Conjunto de regras do cliente: percentual, limite de saldo, mínimo de uso, bônus de aniversário e validade. | RN-02 | aprovado |
| **Percentual** | Quanto do valor pago volta como cashback. Ex.: 2% no plano Básico. | RN-13 | aprovado |
| **Pontos-base** | Forma de guardar o percentual sem decimais: 2% é 200 e 5% é 500. | — | aprovado |
| **Limite de saldo** | Valor máximo de cashback que o cliente pode acumular. | RN-15 | aprovado |
| **Mínimo de uso** | Menor valor de cashback que o cliente pode usar numa compra. | RN-19 | aprovado |
| **Bônus de aniversário** | Dobro do percentual no mês de aniversário do cliente. | RN-14 | aprovado |
| **Mês de aniversário** | Mês da data de nascimento do cliente, comparado com o mês da compra no horário de Brasília. | RN-14 | aprovado |

## Saldo

| Termo | Significado | Regras | Status |
|---|---|---|---|
| **Lote** | Cashback gerado por uma compra, com valor, saldo restante e vencimento próprios. | RN-16 | aprovado |
| **Saldo disponível** | Soma do que sobra nos lotes não vencidos. | RN-22 | aprovado |
| **FIFO** | Ordem de uso: gasta primeiro o lote que vence antes. | RN-20 | aprovado |
| **Validade** | Quantos dias um lote vale depois de gerado. Padrão: 180. | RN-24 | aprovado |
| **Extrato** | Consulta do cliente com o saldo disponível, os lotes a vencer e o histórico de créditos, usos e expirações. | RN-22, RN-26 | aprovado |
| **Vencimento** | Data e hora em que o lote deixa de valer. | RN-24, RN-25 | aprovado |
| **Ativo** (lote) | Lote ainda não usado. | RN-27 | aprovado |
| **Parcial** (lote) | Lote usado em parte. | RN-27 | aprovado |
| **Consumido** (lote) | Lote totalmente usado. | RN-27 | aprovado |
| **Vencido** (lote) | Lote cuja data e hora de vencimento já passaram. Não conta no saldo nem pode ser usado, mesmo antes de ser marcado como expirado. | RN-25 | aprovado |
| **Expirado** (lote) | Estado do lote vencido depois de marcado. O valor que expirou fica registrado. | RN-26 | aprovado |

## Compra

| Termo | Significado | Regras | Status |
|---|---|---|---|
| **Valor bruto** | Soma de preço × quantidade dos itens, antes de usar cashback. | RN-07 | aprovado |
| **Cashback usado** | Parte do valor bruto paga com o saldo. | RN-18 | aprovado |
| **Valor pago** | Valor bruto menos o cashback usado. É sobre ele que se calcula o novo cashback. | RN-09, RN-13 | aprovado |
| **Valor cortado** | Parte do cashback calculado que não foi creditada porque o saldo chegaria acima do limite do plano. | RN-15, RN-17 | aprovado |
| **Produto** | Item do cardápio que a cafeteria vende, com nome e preço. | RN-06, RN-07 | aprovado |
| **Item da compra** | Linha de uma compra: um produto, a quantidade e o preço da época. | RN-07, RN-08 | aprovado |
| **Preço da época** | Preço do produto guardado no item no dia da compra. | RN-08 | aprovado |
| **Chave de idempotência** | Identificador enviado com a compra para que o mesmo envio repetido seja registrado uma só vez. | RN-11 | aprovado |

## Pessoas e acesso

| Termo | Significado | Regras | Status |
|---|---|---|---|
| **Cliente** | Pessoa que compra na cafeteria e acumula cashback. | RN-01 | aprovado |
| **Usuário** | Quem opera o sistema, com perfil ADMIN ou ATENDENTE. Não é o cliente. | RN-10, RN-32, RN-35 | aprovado |
| **ADMIN** | Perfil que administra o programa. | RN-33 | aprovado |
| **ATENDENTE** | Perfil que atende o cliente e registra compras. | RN-34 | aprovado |
| **Token** | Prova de login que o usuário envia a cada requisição. | RN-35 | aprovado |

## Outros termos

| Termo | Significado | Regras | Status |
|---|---|---|---|
| **Troca de plano** | Mudança do plano de um cliente, feita pelo ADMIN. O saldo e os lotes são mantidos. | RN-28, RN-29, RN-30 | aprovado |
| **Desativar** | Tirar de uso sem apagar. O item some das listagens por padrão, mas o histórico fica. | RN-31 | aprovado |
| **Reativar** | Voltar a usar um item desativado. | RN-37, RN-38 | aprovado |
