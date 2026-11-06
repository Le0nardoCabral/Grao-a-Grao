# Regras de negócio

Regras do programa de cashback Grão a Grão.

- **Versão:** 0.2
- **Data:** 2026-11-06
- **Status:** `aprovado`, `proposto` (aguarda confirmação) ou `em aberto` (depende de uma decisão).

---

## 1. Planos

| ID | Regra | Status |
|---|---|---|
| RN-01 | Todo cliente pertence a **exatamente um plano**. | aprovado |
| RN-02 | Cada plano define: nome (único), percentual de cashback, limite de saldo, mínimo de uso, bônus de aniversário (sim ou não) e validade dos lotes em dias (padrão 180). | aprovado |
| RN-03 | Os planos iniciais são os da tabela abaixo. | aprovado |
| RN-04 | Alterar um plano **não altera** compras nem lotes já gerados. | aprovado |
| RN-05 | Só um plano **ativo** recebe clientes novos ou trocas de plano. Um plano que ainda tem clientes ativos não pode ser desativado. | aprovado |

### Planos iniciais (RN-03)

| Plano | Cashback | Limite de saldo | Mínimo de uso | Bônus de aniversário | Validade |
|---|---:|---:|---:|---|---:|
| Básico | 2% | R$ 200,00 | R$ 20,00 | não | 180 dias |
| Intermediário | 5% | R$ 500,00 | R$ 20,00 | sim | 180 dias |
| Premium | 8% | R$ 1.000,00 | R$ 0,00 | sim | 180 dias |

O mínimo de R$ 20,00 do Intermediário é uma escolha do grupo, para manter a mesma regra do Básico.

## 2. Compra

| ID | Regra | Status |
|---|---|---|
| RN-06 | Só um cliente **ativo**, com plano **ativo**, pode comprar. Só produtos **ativos** podem ser vendidos. | aprovado |
| RN-07 | O **valor bruto** da compra é a soma de preço atual do produto × quantidade. O atendente não informa preço nem total. | aprovado |
| RN-08 | Cada item guarda o **preço da época**. Mudar o preço depois não altera compras antigas. | aprovado |
| RN-09 | **Valor pago** = valor bruto − cashback usado. | aprovado |
| RN-10 | Toda compra registra **quem a registrou** (usuário) e quando. | aprovado |
| RN-11 | Uma compra enviada mais de uma vez com a mesma chave de idempotência é registrada **uma única vez**. Se a mesma chave chegar com **conteúdo diferente**, a compra é **recusada** por conflito. | aprovado |
| RN-12 | A compra é **indivisível**: uso do cashback, registro da compra e geração do novo cashback acontecem juntos, ou nada acontece. | aprovado |

## 3. Geração de cashback

| ID | Regra | Status |
|---|---|---|
| RN-13 | Toda compra concluída **calcula** um cashback igual ao **percentual do plano sobre a base de cálculo**, **arredondado para baixo** ao centavo. A base é o **valor pago**, para não gerar cashback sobre cashback. O valor **creditado** segue a RN-15. | aprovado |
| RN-14 | No **mês de aniversário** do cliente, planos com bônus **dobram** o percentual. O mês é o da **data da compra**, contado no horário de **Brasília**. Cliente **sem data de nascimento não tem bônus**. | aprovado |
| RN-15 | A **geração** de cashback nunca faz o saldo ultrapassar o **limite do plano**. O limite é conferido sobre o saldo **depois de debitar o cashback usado na mesma compra**. O cashback gerado é creditado só até o espaço que sobra. Se não sobrar espaço, **não gera** cashback. | aprovado |
| RN-16 | Cada compra gera **no máximo um lote** de cashback. O lote guarda o valor original, o saldo restante, a data de geração, o vencimento e a situação. | aprovado |
| RN-17 | Quando uma compra **não gera** cashback, a resposta informa o motivo (limite do plano atingido ou valor que arredondou para zero). Quando o limite corta parte do valor, informa também o valor cortado. | aprovado |

## 4. Uso do saldo

| ID | Regra | Status |
|---|---|---|
| RN-18 | O cashback usado numa compra não passa do **saldo disponível** nem do **valor bruto** da compra. Se passar, a compra é **recusada**; nada é cortado em silêncio. | aprovado |
| RN-19 | Se o cliente usa cashback, o valor usado não pode ser **menor que o mínimo do plano**. Em plano com mínimo zero, o uso pode ser parcial, a partir de R$ 0,01. Se o valor usado for menor que o mínimo, a compra é **recusada**. | aprovado |
| RN-20 | O saldo é consumido pelos lotes na ordem **FIFO**: primeiro o que vence antes. Em empate, o gerado antes. Persistindo o empate, o de menor identificador. | aprovado |
| RN-21 | Cada uso registra **quanto saiu de cada lote**, para auditar a ordem de consumo. | aprovado |
| RN-22 | O **saldo disponível** é a soma dos saldos dos lotes não vencidos que estão ativos ou parciais. | aprovado |
| RN-23 | Duas compras do mesmo cliente ao mesmo tempo **não podem gastar o mesmo saldo** nem ultrapassar o limite do plano. | aprovado |

## 5. Validade e expiração

| ID | Regra | Status |
|---|---|---|
| RN-24 | O lote vence na data de geração mais a **validade do plano vigente no momento da compra**. O vencimento é calculado e comparado no horário de **Brasília**. | aprovado |
| RN-25 | Um lote vencido **não conta** no saldo e **não pode ser usado**, mesmo antes de ser marcado como expirado. No **instante exato** do vencimento, o lote já está vencido. | aprovado |
| RN-26 | Um lote vencido passa a **expirado**, e o valor que expirou **fica registrado**, para o extrato mostrar o que se perdeu. | aprovado |
| RN-27 | Um lote ainda não usado fica **ativo**. Um lote totalmente usado fica **consumido**. Um lote parcialmente usado fica **parcial**. | aprovado |

## 6. Troca de plano

| ID | Regra | Status |
|---|---|---|
| RN-28 | Só o **ADMIN** troca o plano de um cliente, e só para um plano ativo. Atualizar os dados do cliente **não altera o plano**: o plano só muda pela troca de plano. | aprovado |
| RN-29 | A troca **mantém** o saldo e os lotes, com o mesmo valor e a mesma validade. O novo limite vale a partir das **próximas compras**. | aprovado |
| RN-30 | Se o saldo já ultrapassa o novo limite, **nada é cortado**. O cliente só deixa de gerar cashback até o saldo ficar abaixo do limite. | aprovado |

## 7. Exclusão

| ID | Regra | Status |
|---|---|---|
| RN-31 | Clientes, planos e produtos **não são apagados**: são desativados, para preservar o histórico de compras e de cashback. O desativado some das listagens e não participa de operações novas. | aprovado |
| RN-37 | O **ADMIN** pode reativar um cliente, plano ou produto desativado. Enquanto estiver desativado, o nome (ou o e-mail do cliente) continua ocupado. | aprovado |

## 8. Perfis de acesso

| ID | Regra | Status |
|---|---|---|
| RN-32 | Existem dois perfis: **ADMIN** e **ATENDENTE**. | aprovado |
| RN-33 | O **ADMIN** administra planos e produtos, troca o plano do cliente, desativa clientes e faz tudo o que o atendente faz. | aprovado |
| RN-34 | O **ATENDENTE** cadastra e atualiza clientes, consulta clientes, planos, produtos e extrato, e registra compras. | aprovado |
| RN-35 | Só usuário **ativo e autenticado** usa o sistema. | aprovado |
| RN-36 | O cadastro de novos usuários cria sempre um **ATENDENTE**, e só o **ADMIN** pode fazê-lo. O primeiro admin vem do seed. | aprovado |

---

## Pontos em aberto

Nenhum. Todas as regras (RN-01 a RN-37) estão `aprovado`.
