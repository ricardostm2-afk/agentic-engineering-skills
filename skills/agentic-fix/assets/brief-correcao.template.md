<!-- Brief do agente da correção (passo 2 da agentic-fix). Tira as linhas que não se aplicam.
`ordem do humano:` leva as palavras dele, só quando ele mandou fazer nesta correção o que é de quem
orquestra; senão «nenhuma». Num job Codex, a mesma ordem vai no mecanismo do lançador, se ele tiver
um que regista a ordem e a junta ao prompt. -->

# Correção: {{título curto}}

nível: {{bem-definida|complexa}} — {{porquê}}
worktree: {{caminho}} · ramo: {{ramo}} · área: {{área}}

ordem do humano: {{as palavras dele, tal como as disse, para o que é de quem orquestra (push,
deploy, produção), ou «nenhuma»}}

Carrega a `agentic-implement` e faz os passos 3 a 5 da `agentic-fix`.

## O defeito

- Sintoma: {{o que acontece, com o ecrã, a rota ou o comando}}
- Esperado: {{o que devia acontecer}}
- Report: {{as palavras do humano, ou o link}}
- Causa: {{conhecida: ficheiro:linha | por descobrir}}

## Onde mexer

- Ficheiros prováveis: {{lista}}
- Zona sensível: {{sim: qual | não}}
- Fora do âmbito: {{o que não se toca}}
- O que a linha `ordem do humano:` pede, fazes só nesta correção. Sem ordem, os commits ficam no
  ramo e o push, o deploy e a produção são de quem orquestra.

## Critério de sucesso

`{{comando}}` fica verde, depois de ter estado vermelho na base pelo sintoma acima; os testes da
área (`{{comando da área}}`) continuam verdes.

## Entrega

Handoff da `agentic-implement` (passo 8), com a causa raiz e a classe:
`N instâncias: ficheiro:linha, …` ou `só esta`.
