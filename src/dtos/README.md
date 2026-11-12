# DTOs

Esta pasta contém os contratos de entrada e saída da API, separados dos modelos
do Prisma. Os schemas Zod ficam em `validators/` e validam os dados em tempo de
execução; os DTOs tipam os dados que passam entre controller e service e as
respostas que os controllers enviam.

Os DTOs podem repetir os campos dos schemas. Essa duplicidade é intencional:
validação em tempo de execução e contratos entre camadas são responsabilidades
diferentes.
