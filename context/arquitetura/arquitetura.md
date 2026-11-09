# Arquitetura

Como o código é dividido e onde cada coisa fica. As tecnologias estão em [stack.md](stack.md), e as convenções de escrita no Bloco 4 do `aiRules.md`.

- **Versão:** 0.4
- **Data:** 2026-11-06
- **Status:** `aprovado`.

---

## 1. Camadas

A arquitetura é **em camadas**. Cada requisição passa pelas camadas nesta ordem, e cada camada só chama a seguinte.

```text
src/
├── App.ts
├── Server.ts
├── Routes.ts
├── config/
│   └── Env.ts
├── routes/
│   ├── AuthRoutes.ts
│   ├── ClientesRoutes.ts
│   ├── PlanosRoutes.ts
│   ├── ProdutosRoutes.ts
│   ├── ComprasRoutes.ts
│   └── DocsRoutes.ts
├── controllers/
│   ├── AuthController.ts
│   ├── ClientesController.ts
│   ├── PlanosController.ts
│   ├── ProdutosController.ts
│   └── ComprasController.ts
├── services/
│   ├── AuthService.ts
│   ├── ClientesService.ts
│   ├── PlanosService.ts
│   ├── ProdutosService.ts
│   ├── RegistrarCompraService.ts
│   ├── TrocarPlanoService.ts
│   ├── ExtratoService.ts
│   └── CashbackDateService.ts
├── repositories/
│   ├── PrismaClient.ts
│   ├── UsuariosRepository.ts
│   ├── ClientesRepository.ts
│   ├── PlanosRepository.ts
│   ├── ProdutosRepository.ts
│   ├── ComprasRepository.ts
│   ├── ExtratoRepository.ts
│   └── LotesRepository.ts
├── middlewares/
│   ├── Authenticate.ts
│   ├── AuthorizeRole.ts
│   ├── Validate.ts
│   └── ErrorHandler.ts
├── validators/
│   ├── AuthSchemas.ts
│   ├── ClienteSchemas.ts
│   ├── PlanoSchemas.ts
│   ├── ProdutoSchemas.ts
│   └── CompraSchemas.ts
├── errors/
│   ├── AppError.ts
│   └── ErrorCodes.ts
├── types/
│   └── Express.d.ts
└── docs/
    └── OpenApi.ts

prisma/
├── schema.prisma
├── Seed.ts
├── InitDb.sql
└── migrations/

tests/
└── <Arquivo testado>.test.ts   (por exemplo, RegistrarCompraService.test.ts, com node:test)
```

| Camada | Pasta | Faz | Não faz |
|---|---|---|---|
| **Rota** | `routes/` | Declara método e caminho, e liga autenticação, perfil e validação ao controller. | Regra de negócio. |
| **Controller** | `controllers/` | Converte a requisição em chamada ao serviço e escolhe o status da resposta. | Regra de negócio, acesso ao banco, `try/catch`. |
| **Service** | `services/` | Aplica as regras de negócio e coordena a transação. | Conhecer HTTP (`request`, `response`). |
| **Repository** | `repositories/` | Único lugar que fala com o Prisma. | Regra de negócio. |

Peças de apoio:

| Peça | Pasta | Faz |
|---|---|---|
| **Middleware** | `middlewares/` | Autentica o token, confere o perfil, valida a entrada e trata os erros. |
| **Validador** | `validators/` | Schemas Zod de cada rota. Também alimentam o Swagger. |
| **Erros** | `errors/` | `AppError` e o catálogo de códigos (`ErrorCodes`). |
| **Configuração** | `config/` | Lê e valida as variáveis de ambiente. |

## 2. Regras de organização

| # | Regra |
|---|---|
| 1 | As dependências só descem: rota, controller, service, repository. Nunca ao contrário. |
| 2 | O service recebe os repositórios que usa (injeção simples), para ser testado sem banco. |
| 3 | A compra roda em uma transação. O service a abre por uma função do `prismaClient.ts`, e os repositórios aceitam o cliente da transação. |
| 4 | O service devolve o **objeto no formato do contrato**, e nunca o registro do banco (por exemplo, sem `senhaHash`). O controller só o repassa. |
| 5 | Erros de negócio são lançados como `AppError` e tratados em um único middleware. |
| 6 | Código novo segue o padrão de nomes `<Recurso><Papel>.ts`, em PascalCase (Bloco 4 do `aiRules.md`), que é o que o código já usa. |
| 7 | O middleware `authenticate` lê o usuário pelo `usuariosRepository`, sem falar com o Prisma. |
| 8 | Os arquivos de teste ficam em `tests/` e se chamam `<Arquivo testado>.test.ts`. |

## 3. Estrutura de pastas

A árvore de pastas está na seção 1, com os nomes reais dos arquivos.

A estrutura é a de partida: pasta ou arquivo novo entra quando uma responsabilidade nova aparecer.
