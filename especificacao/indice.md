# Especificação da API Grão a Grão

Documentação nova, construída por etapas. O `ARQUITETURA.md` da raiz do repositório guarda a proposta antiga (referência, não editar).

## Por onde começar

1. Ler o [aiRules.md](aiRules.md): como a IA trabalha e como o código é escrito.
2. Ler este índice e o **índice** de [decisoes/decisoes.md](decisoes/decisoes.md).
3. Abrir só os arquivos que a task usa (tabela de leitura no Bloco 3 do `aiRules.md`).

## Estrutura

| Pasta | Conteúdo | Arquivos | Situação |
|---|---|---|---|
| (raiz) | Regras para IA e mapa da documentação | `aiRules.md`, `indice.md` | existem |
| `decisoes/` | Registro das decisões, com índice no topo | `decisoes.md` | existe |
| `negocio/` | Regras de negócio e requisitos | `regrasDeNegocio.md` e `requisitos.md` (existem); `contexto.md`, `glossario.md` | parcial |
| `api/` | Contrato HTTP | `endpoints.md`, `contratos.md`, `erros.md`, `swagger.md` | a criar |
| `api/arquitetura/` | Como o sistema é organizado | `stack.md` (existe); `camadas.md`, `estruturaDePastas.md` | parcial |
| `api/dados/` | Banco de dados | `modeloDeDados.md`, `migrations.md` | a criar |
| `api/seguranca/` | Autenticação, perfis e proteção | `autenticacao.md`, `perfis.md`, `protecaoDeDados.md` | a criar |

As convenções de código ficam no `aiRules.md` (Bloco 4), e não em `api/arquitetura/`.

## Blocos do aiRules.md

| Bloco | Assunto | Status |
|---|---|---|
| 1 | Antes de começar qualquer task | escrito |
| 2 | Implementação e ao terminar | escrito |
| 3 | Mapa de leitura | escrito |
| 4 | Convenções de código | escrito |
| 5 | Trabalho em equipe e Git | escrito |
| 6 | Como escrever a documentação | escrito |
| 7 | Honestidade e proibições | escrito |

## Etapas de construção da especificação

| Etapa | Assunto | Destino | Status |
|---|---|---|---|
| A | Planos e geração de cashback | `negocio/regrasDeNegocio.md` | escrito (aprovado) |
| B | Uso do saldo (FIFO, mínimo) | `negocio/regrasDeNegocio.md` | escrito (aprovado) |
| C | Validade e expiração | `negocio/regrasDeNegocio.md` | escrito (aprovado) |
| D | Acesso e perfis | `negocio/regrasDeNegocio.md` | escrito (aprovado) |
| E | Requisitos funcionais | `negocio/requisitos.md` | escrito (aprovado) |
| F | Requisitos não funcionais e fora de escopo | `negocio/requisitos.md` | escrito (aprovado) |
| G | Demais pastas, na ordem da tabela de estrutura | — | pendente |

As etapas A a D estão escritas, e as 38 regras de negócio (RN-01 a RN-38) estão aprovadas.

## Pontos já decididos

- Regras de negócio (RN-01 a RN-38) aprovadas em `negocio/regrasDeNegocio.md`, incluindo a idempotência do `POST /compras` (RN-11).
- Requisitos funcionais (RF-01 a RF-24), não funcionais (RNF-01 a RNF-14) e fora de escopo aprovados em `negocio/requisitos.md`.
- As regras de trabalho com IA (Blocos 1 a 7 do `aiRules.md`) estão aprovadas e registradas nas decisões 7.1 a 7.26.
