# Aprofundar

Como aprofundar com segurança um grupo de módulos rasos, dadas as dependências dele. Lê-se nos
passos 2 (a categoria de cada candidato) e 5 (a costura e os testes). Os termos são os de
`references/vocabulario.md`.

## Categorias de dependência

Ao avaliar um candidato, classifica as dependências dele. A categoria decide como se testa o
módulo aprofundado através da costura.

### 1. Em processo

Cálculo puro, estado em memória, sem entrada e saída. Aprofunda-se sempre: juntam-se os módulos e
testa-se diretamente pela interface nova. Sem adaptador.

### 2. Substituível localmente

Dependências com um substituto local para os testes (PGLite para o Postgres, um sistema de
ficheiros em memória). Aprofunda-se se o substituto existe: os testes do módulo aprofundado correm
com ele. A costura é interna; não há porta na interface externa do módulo.

### 3. Remota mas nossa (portas e adaptadores)

Serviços nossos do outro lado da rede (microsserviços, APIs internas). Define-se uma **porta** na
costura: o módulo profundo fica dono da lógica e o transporte entra como **adaptador**. Os testes
usam um adaptador em memória; a produção, um adaptador HTTP, gRPC ou de fila.

Forma da recomendação: «Define uma porta na costura, com um adaptador HTTP para produção e um em
memória para os testes, para a lógica ficar num módulo profundo, mesmo distribuída pela rede.»

### 4. Externa de verdade (mock)

Serviços de terceiros que não controlas (Stripe, Twilio, …). O módulo aprofundado recebe a
dependência externa como uma porta injetada; os testes dão-lhe um adaptador mock.

No relatório, a categoria vai por extenso ao lado da força: `em processo`, `substituível
localmente`, `portas e adaptadores` ou `mock`.

## Disciplina das costuras

- **Um adaptador é uma costura hipotética; dois são uma costura real.** Uma porta só entra com
  pelo menos dois adaptadores justificados (em geral, produção e teste). Uma costura com um só
  adaptador é só indireção.
- **Costuras internas e externas.** Um módulo profundo pode ter costuras internas (privadas da
  implementação, usadas pelos testes dele) além da costura externa, na interface. Uma costura
  interna fica fora da interface, mesmo quando os testes a usam.

## Testes: substituir, não empilhar

- Os testes unitários antigos dos módulos rasos passam a desperdício quando existem testes na
  interface do módulo aprofundado: apagam-se, mas só depois de o comportamento ficar fixado e
  provado igual pela receita de refactor da `agentic-implement`
  (`<agentic-implement>/references/testes.md`, «Refactor»).
- Os testes novos escrevem-se na interface do módulo aprofundado. A **interface é a superfície de
  teste**.
- Os testes verificam resultados observáveis pela interface, não estado interno.
- Os testes sobrevivem a refactors internos, porque descrevem comportamento e não implementação.
  Um teste que tem de mudar quando a implementação muda está a testar para lá da interface.
