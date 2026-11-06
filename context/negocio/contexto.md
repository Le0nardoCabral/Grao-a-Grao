# Contexto

O problema que o projeto resolve e como a solução funciona, em linguagem simples.

- **Versão:** 0.1
- **Data:** 2026-11-06
- **Status:** `aprovado`.

---

## O que é

**Grão a Grão** é uma API REST para um programa de **cashback de cafeterias**. O cliente acumula parte do valor das compras como crédito e usa esse crédito em compras futuras.

## O problema

Uma cafeteria quer fidelizar clientes devolvendo parte do que eles gastam, mas precisa de controle: o crédito não pode valer para sempre, não pode crescer sem limite e não pode ser gasto duas vezes. Fazer isso à mão, ou em uma planilha, gera erro e disputa com o cliente.

## Objetivo da API

Centralizar clientes, planos, produtos, compras e saldo de cashback, e aplicar as regras do programa sempre do mesmo jeito, sem depender de quem atende.

## Quem usa

| Perfil | Papel |
|---|---|
| **ATENDENTE** | Atende o cliente no balcão: cadastra clientes, consulta saldo e registra compras. |
| **ADMIN** | Administra o programa: planos, produtos, troca de plano, desativação e cadastro de usuários. |

A API é consumida por uma interface de atendimento e administração. Essa interface não faz parte do projeto.

## Como o programa funciona

1. O cliente pertence a um **plano** (Básico, Intermediário ou Premium), que define quanto ele ganha e quanto pode acumular.
2. A cada **compra**, o cliente ganha cashback, que vira um **lote** com data de vencimento.
3. Nas compras seguintes, o cliente pode **usar o saldo**, e o sistema gasta primeiro o lote que vence antes.
4. O saldo tem um **limite** por plano, e lotes **vencidos** deixam de valer.
5. No **mês de aniversário**, os planos Intermediário e Premium ganham o dobro.

As regras completas estão em [regrasDeNegocio.md](regrasDeNegocio.md), e o significado dos termos em [glossario.md](glossario.md).

## O que o sistema garante

| Garantia | Significado |
|---|---|
| **Compra consistente** | O uso do saldo, o registro da compra e o novo cashback acontecem juntos, ou nada acontece. |
| **Sem dupla contagem** | A mesma compra enviada duas vezes é registrada uma só vez. |
| **Saldo correto** | Duas compras ao mesmo tempo do mesmo cliente não gastam o mesmo crédito. |
| **Histórico preservado** | Nada é apagado: clientes, planos e produtos são desativados. |

