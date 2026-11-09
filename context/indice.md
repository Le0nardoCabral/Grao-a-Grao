# Especificação da API Grão a Grão

Documentação nova, construída por etapas. O `ARQUITETURA.md` da raiz do repositório guarda a proposta antiga (referência, não editar).

## Por onde começar

1. Ler o [aiRules.md](aiRules.md): como a IA trabalha e como o código é escrito.
2. Ler este índice e o **índice** de [decisoes/decisoes.md](decisoes/decisoes.md).
3. Abrir só os arquivos que a task usa (tabela de leitura no Bloco 3 do `aiRules.md`).

## Estrutura

| Pasta | Conteúdo | Arquivos | Situação |
|---|---|---|---|
| (raiz) | Regras para IA, mapa da documentação e lista de tasks | `aiRules.md`, `indice.md`, `tasks.md` | existem |
| `decisoes/` | Registro das decisões, com índice no topo | `decisoes.md` | existe |
| `negocio/` | Contexto, regras de negócio e requisitos | `contexto.md`, `glossario.md`, `regrasDeNegocio.md`, `requisitos.md` | existem |
| `api/` | Contrato HTTP | `endpoints.md`, `contratos.md` | existem |
| `arquitetura/` | Como o sistema é organizado | `stack.md`, `arquitetura.md`, `visaoGeralDaApi.md` | existem |
| `dados/` | Banco de dados | `modeloDeDados.md` | existe |
| `seguranca/` | Autenticação, perfis e proteção | `seguranca.md` | existe |

As convenções de código ficam no `aiRules.md` (Bloco 4), e não em `arquitetura/`.

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
| G | Demais pastas: api, dados, segurança e arquitetura | `api/`, `dados/`, `seguranca/`, `arquitetura/` | escrito (aprovado) |

As etapas A a D estão escritas, e as 38 regras de negócio (RN-01 a RN-38) estão aprovadas.

## Pontos já decididos

- Regras de negócio (RN-01 a RN-38) aprovadas em `negocio/regrasDeNegocio.md`, incluindo a idempotência do `POST /compras` (RN-11).
- Requisitos funcionais (RF-01 a RF-24), não funcionais (RNF-01 a RNF-14) e fora de escopo aprovados em `negocio/requisitos.md`.
- Contexto (`negocio/contexto.md`) e glossário (`negocio/glossario.md`) aprovados.
- Endpoints (`api/endpoints.md`): 24 rotas aprovadas.
- Contratos (`api/contratos.md`): campos, formato do erro, catálogo de 25 códigos, paginação e ordem das verificações da compra, aprovados.
- Swagger (seção 9 do `api/contratos.md`), modelo de dados (`dados/modeloDeDados.md`), segurança (`seguranca/seguranca.md`), arquitetura (`arquitetura/arquitetura.md`) e stack com as variáveis de ambiente (`arquitetura/stack.md`), aprovados.
- As regras de trabalho com IA (Blocos 1 a 7 do `aiRules.md`) estão aprovadas.
- Lista de 18 tasks (uma dispensada) e 19 testes em `tasks.md`, aprovada.
