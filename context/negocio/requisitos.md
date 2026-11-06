# Requisitos

O que o sistema deve fazer (requisitos funcionais) e como deve se comportar (requisitos não funcionais), mais o que fica de fora.

- **Versão:** 0.3
- **Data:** 2026-11-06
- **Status:** `aprovado`, `proposto` (aguarda confirmação) ou `em aberto` (depende de uma decisão).
- **Regras:** a coluna "Regras" aponta para as regras de [regrasDeNegocio.md](regrasDeNegocio.md).

---

## 1. Requisitos funcionais

Perfis: **ADMIN** e **ATENDENTE**. "Ambos" significa os dois perfis.

### Acesso

| ID | Requisito | Quem | Regras | Status |
|---|---|---|---|---|
| RF-01 | Entrar no sistema com e-mail e senha e receber um token de acesso. | Público | RN-35 | aprovado |
| RF-02 | Cadastrar um usuário. O usuário criado é sempre ATENDENTE. | ADMIN | RN-36 | aprovado |

### Clientes

| ID | Requisito | Quem | Regras | Status |
|---|---|---|---|---|
| RF-03 | Cadastrar um cliente com nome e plano ativo. E-mail, telefone e data de nascimento são opcionais. | Ambos | RN-01, RN-05 | aprovado |
| RF-04 | Listar clientes, com paginação. O ADMIN pode incluir os desativados. | Ambos | RN-31 | aprovado |
| RF-05 | Consultar um cliente pelo identificador. O ADMIN pode consultar também os desativados. | Ambos | RN-31 | aprovado |
| RF-06 | Atualizar os dados de um cliente, sem alterar o plano. | Ambos | RN-28 | aprovado |
| RF-07 | Desativar um cliente. | ADMIN | RN-31 | aprovado |
| RF-08 | Trocar o plano de um cliente. | ADMIN | RN-28, RN-29, RN-30 | aprovado |
| RF-09 | Consultar o extrato de um cliente: saldo disponível, lotes a vencer e histórico de créditos, usos e expirações. | Ambos | RN-22, RN-25, RN-26 | aprovado |

### Planos

| ID | Requisito | Quem | Regras | Status |
|---|---|---|---|---|
| RF-10 | Cadastrar um plano com percentual, limite de saldo, mínimo de uso, bônus de aniversário e validade. | ADMIN | RN-02, RN-03 | aprovado |
| RF-11 | Listar planos. O ADMIN pode incluir os desativados. | Ambos | RN-31 | aprovado |
| RF-12 | Consultar um plano pelo identificador. O ADMIN pode consultar também os desativados. | Ambos | RN-31 | aprovado |
| RF-13 | Atualizar um plano. | ADMIN | RN-04 | aprovado |
| RF-14 | Desativar um plano. | ADMIN | RN-05, RN-31 | aprovado |

### Produtos

| ID | Requisito | Quem | Regras | Status |
|---|---|---|---|---|
| RF-15 | Cadastrar um produto com nome, descrição opcional e preço. | ADMIN | RN-07 | aprovado |
| RF-16 | Listar produtos ativos. O ADMIN pode incluir os desativados. | Ambos | RN-31 | aprovado |
| RF-17 | Consultar um produto pelo identificador. O ADMIN pode consultar também os desativados. | Ambos | RN-31 | aprovado |
| RF-18 | Atualizar um produto. | ADMIN | RN-08 | aprovado |
| RF-19 | Desativar um produto. | ADMIN | RN-31 | aprovado |

### Reativação

| ID | Requisito | Quem | Regras | Status |
|---|---|---|---|---|
| RF-20 | Reativar um cliente desativado. A reativação é recusada se o plano dele estiver desativado. | ADMIN | RN-37, RN-38 | aprovado |
| RF-21 | Reativar um plano desativado. | ADMIN | RN-37 | aprovado |
| RF-22 | Reativar um produto desativado. | ADMIN | RN-37 | aprovado |

### Compras

| ID | Requisito | Quem | Regras | Status |
|---|---|---|---|---|
| RF-23 | Registrar a compra de um cliente com os itens (produto e quantidade), o cashback a usar (opcional) e a chave de idempotência. | Ambos | RN-06 a RN-27 | aprovado |
| RF-24 | Na resposta da compra, informar valor bruto, cashback usado, valor pago, cashback gerado e, quando nada for gerado, o motivo. Quando o limite cortar parte do valor, informar também o valor cortado. | Ambos | RN-17 | aprovado |

---

## 2. Requisitos não funcionais

| ID | Requisito | Status |
|---|---|---|
| RNF-01 | **Autenticação por token** com prazo de validade. Senhas são guardadas só como hash, e o hash nunca sai em resposta. | aprovado |
| RNF-02 | **Controle de acesso por perfil** em toda rota privada. Rota sem permissão responde como proibida. | aprovado |
| RNF-03 | **Toda entrada é validada** antes de chegar à regra de negócio. Campos inesperados são rejeitados. | aprovado |
| RNF-04 | **Erros padronizados.** Toda falha usa o mesmo formato de resposta e não revela detalhe interno nem rastro de execução. | aprovado |
| RNF-05 | **Segredos fora do código e do Git.** Senhas, chave do token e endereço do banco ficam em variáveis de ambiente. | aprovado |
| RNF-06 | **Cabeçalhos HTTP seguros e CORS** restrito a uma lista de origens permitidas. | aprovado |
| RNF-07 | **Integridade da compra**, conforme RN-12 e RN-23. | aprovado |
| RNF-08 | **Precisão do dinheiro:** sem decimais. O formato está no Bloco 4 do `aiRules.md`. | aprovado |
| RNF-09 | **Datas padronizadas:** UTC e ISO 8601. As regras que dependem do calendário usam o horário de Brasília (RN-14, RN-24). | aprovado |
| RNF-10 | **Histórico preservado**, conforme RN-31. | aprovado |
| RNF-11 | **Listagens paginadas**, com tamanho de página padrão e máximo. | aprovado |
| RNF-12 | **Documentação da API** em OpenAPI (Swagger), cobrindo todas as rotas e gerada a partir dos schemas de validação. | aprovado |
| RNF-13 | **Testes automatizados** das regras de negócio, escritos antes da implementação. | aprovado |
| RNF-14 | **Ambiente reproduzível.** O projeto sobe com Docker Compose, e o README explica a instalação e a execução. A instalação carrega, por seed, os planos iniciais e o primeiro admin. | aprovado |

---

## 3. Fora de escopo

Para manter a API simples, **não** serão feitos:

| Item | Status |
|---|---|
| Estorno ou cancelamento de compra | aprovado |
| Limite de tentativas de login | aprovado |
| Gestão de usuários além do cadastro (listar, desativar, trocar senha). O campo `ativo` do usuário existe, mas não há operação para alterá-lo. | aprovado |
| Tabela própria de movimentações de cashback | aprovado |
| Metas de desempenho (tempo de resposta, volume) | aprovado |
| Interface gráfica (a API é consumida por outra aplicação) | aprovado |
