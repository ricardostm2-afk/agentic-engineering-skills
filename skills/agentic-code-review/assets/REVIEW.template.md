<!--
Modelo da agentic-code-review (references/review-md.md); a agentic-project usa-o na fase 6. O agente
escreve-o a partir de docs/decisoes.md, das áreas `risco: alto` de .agentic/areas.json e das
lições (se já existem); o humano aprova «O que é falhar aqui», porque é ele o dono. O revisor
lê-o antes de cada revisão e ele ganha ao brief. Orçamento ~3 KB (wc -c REVIEW.md). Uma regra que uma
máquina verifica não fica aqui: vira hook, lint ou teste. Substitui cada {{...}} e apaga este comentário.
-->
# REVIEW.md

## O que é falhar aqui

- Docs e instruções (`AGENTS.md`, `CLAUDE.md`, `docs/`): afirmam o que a árvore não faz (um comando que não
  corre, um caminho que não existe, uma regra que a mudança desligou).
- Hooks, CI e configuração: deixam passar ou encaminham mal (saem 0 com o problema presente; um teste
  saltado conta como verde).
- Testes: não conseguem falhar (a asserção aceita o certo e o errado; a fixture faz o trabalho do código).
- {{Uma linha por área `risco: alto`: <área> → falhar = <o que o utilizador ou o dono vê>; prova = <teste>.}}
- {{Decisões que parecem defeito e não são (ex.: «o administrador vê tudo»), com o ponteiro para docs/decisoes.md.}}

## Saltar

{{Gerados, lockfiles, fixtures grandes, pastas de evidência}}: basta confirmar que vieram do gerador.
Estilo e formatação não são achados: são de {{lint, formatador, hooks}}.

## Achados repetidos

{{Classe → o que procurar → prova, vindo das lições; ao arrancar, «(nenhum ainda)».}}

## Processo

Etiquetas, prova, formato do relatório, rondas e teto: os da `agentic-code-review`. O modelo é do
utilizador.

Lições e casos de avaliação: {{`docs/licoes.md`, ou o ficheiro e o formato que o projeto usa}}.
