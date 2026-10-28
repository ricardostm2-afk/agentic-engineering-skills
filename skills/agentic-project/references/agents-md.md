# Instruções para agentes: `AGENTS.md` e `CLAUDE.md` (fase 6)

`AGENTS.md` é lido por qualquer agente (Codex, Claude, outros) em cada sessão, antes de fazer
seja o que for. Cada linha custa contexto em todas as sessões; uma linha inútil dilui as úteis.
Por isso é curto, operacional e escrito para agentes.

## Princípios

- **Fonte única**: `AGENTS.md` tem as regras. `CLAUDE.md` só importa `AGENTS.md` (`@AGENTS.md`) e
  acrescenta o que for específico do Claude Code. Dois ficheiros com regras divergem.
- **Orçamento ~4 KB** (`wc -c AGENTS.md`); até ~5 KB se as regras do projeto o exigirem, com
  apontadores em vez de texto. O que não cabe vai para um doc e fica um ponteiro: «antes de mexer
  em X, lê `docs/Y.md`». O ponteiro diz **quando** ler, não só onde está. O modelo deixa margem
  para as regras do projeto: o texto fixo dele (sem o comentário inicial nem os `{{…}}`) fica
  ≤ ~3 200 B, e o teste do repo das skills mede-o.
- **Para agentes, não para humanos**: o que fazer, comandos exatos, onde está cada coisa, o que é
  proibido e porquê. Sem história do projeto, sem marketing, sem prosa motivacional.
- **Nada que um `grep` descubra**: não listes ficheiros nem funções; diz onde procurar.
- **Cada regra dura com o porquê numa linha.** Um agente que percebe a razão aplica-a a casos
  que a regra não previu; uma regra sem razão é contornada no primeiro caso estranho.
- **Comandos testados**: cada comando escrito no `AGENTS.md` foi corrido nesta sessão e funciona.
- **Regra mecânica vira verificação automática** (hook, lint, teste), não frase. O `AGENTS.md`
  guarda o que precisa de julgamento.
- **Cada regra num só sítio.** Os princípios do projeto vivem na constituição; o porquê das
  decisões em `docs/decisoes.md`/ADRs; o processo em `docs/metodologia.md`. O `AGENTS.md` aponta
  para eles («antes de tocar em dados pessoais, lê a constituição, princípio II») em vez de os
  copiar. Exceção: as regras duras (o que nunca se faz) ficam escritas no `AGENTS.md`, porque são
  as que um agente tem de ver mesmo sem abrir mais nada.

## Secções fixas (modelo em `assets/AGENTS.template.md`)

1. **Missão** — 2 linhas: o que o produto faz e para quem, e uma linha de não-objetivos (ou o
   ponteiro para «Fora de âmbito» em `docs/decisoes.md`).
2. **Comandos** — instalar, correr localmente, typecheck, lint, testes (todos e por área),
   bateria completa, e o que fazer antes de push.
3. **Mapa do código** — pastas de topo → área (a fonte é `.agentic/areas.json`), e ponteiros
   para `ARCHITECTURE.md`, `GLOSSARIO.md`, ADRs, constituição.
4. **Fluxo de trabalho** — o protocolo: features entram pela skill `agentic-feature` e a revisão
   de código faz-se com a `agentic-code-review`, que lê o `REVIEW.md`; ramos
   `agente/<id>-<tema>`; um worktree por agente; verificações da área; integração em `main`;
   quadro atualizado em cada transição e, enquanto se trabalha, pelo menos de 30 em 30 min;
   se há UI, as regras (`.agentic/ui-sem-slop.md`), as exceções de marca aprovadas
   (`docs/decisoes.md`) e o detetor sem bloqueios nas linhas alteradas antes da revisão; ao
   humano só o que é dele, com recomendação; tecnologia confirmada em fonte primária datada antes
   de recomendada. Ponteiro para `docs/metodologia.md`.
5. **Regras duras** — o que nunca se faz e porquê (segredos, dados pessoais, ações
   irreversíveis, `--no-verify`, force-push, editar migrações aplicadas…).
6. **Onde registar** — quadro (como chamar o CLI), decisões (`docs/decisoes.md`), ADRs, radar
   (`docs/radar.md`, criado na fase 3), lições (`docs/licoes.md`, criado na fase 8).

Escreve-o na fase 6 já com os ponteiros para o que as fases 7–9 vão criar (quadro,
`docs/metodologia.md`, `docs/licoes.md`, `docs/backlog.md`), marcados `(fase N)`. Assim o
ficheiro nasce com a forma final e não é reescrito três vezes; as marcas saem quando a fase
correspondente cria o artefacto, e o Fecho confirma que não sobrou nenhuma.

## `REVIEW.md`

É o que a `agentic-code-review` lê antes de cada revisão: o que é falhar neste repo, os caminhos
a saltar e os achados repetidos; o processo da revisão e o modelo não são dele. Modelo em
`<agentic-code-review>/assets/REVIEW.template.md`; como o escrever, mantê-lo curto e fazê-lo
crescer: `<agentic-code-review>/references/review-md.md`; como avaliar o revisor quando ele muda
(as linhas de `docs/licoes.md` e os casos limpos): `<agentic-code-review>/references/aprendizagem.md`.

- **Quem**: o agente escreve-o a partir das decisões, das áreas `risco: alto` e das lições; o
  humano aprova «O que é falhar aqui», porque é ele o dono.
- **Orçamento** ~3 KB. Não repete o `AGENTS.md` nem as regras que um hook, lint ou teste já
  verifica.
- **Ponteiro** no `AGENTS.md` (Fluxo de trabalho): a revisão é a da skill `agentic-code-review`,
  que lê o `REVIEW.md`.

## Modo adotar

Se `AGENTS.md`, `CLAUDE.md` ou `REVIEW.md` já existem: não reescrevas. Lê-os, identifica o que
falta das secções acima e o que contradiz as decisões, e mostra ao humano um diff proposto.
Preserva as regras do projeto: elas ganham às desta skill. Se o `CLAUDE.md` existente tem regras e não
existe `AGENTS.md`, propõe mover as regras para `AGENTS.md` e deixar no `CLAUDE.md` só o import.

## Verificação antes de dar a fase por feita

- `wc -c AGENTS.md` ≤ ~4000 (até ~5 KB se as regras do projeto o exigirem, com apontadores em
  vez de texto); `wc -c REVIEW.md` ≤ ~3000, sem `{{` por preencher, e «O que é falhar
  aqui» aprovado pelo humano (ou delegado, com a decisão em `docs/decisoes.md`).
- Cada comando da secção Comandos foi corrido e passou (mostra a saída resumida). Os que dependem
  de uma decisão aprovada e ainda não instalada (projeto novo sem código, ou um typecheck que o
  modo adotar decidiu acrescentar) ficam marcados `(a criar na 1.ª feature)` ou
  `(a criar: D-NNN)`, para nenhum agente os tomar como verificados.
- Cada caminho referido existe (`ls`), exceto os marcados `(fase N)`, que se verificam no Fecho.
- Teste de leitura a frio: com uma ferramenta de subagentes, dá a um subagente só o `AGENTS.md`
  e pergunta-lhe «como corro os testes da área X?», «o que faço antes de push?», «onde registo
  uma decisão?». Sem subagentes, responde tu às três citando a linha do `AGENTS.md` que responde
  a cada uma (se tiveres de ir buscar a resposta à conversa ou a outro ficheiro sem ponteiro,
  falhou). Se falhar, o `AGENTS.md` está incompleto.
