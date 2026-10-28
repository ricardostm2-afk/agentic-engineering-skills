<!-- Modelo da agentic-project: substitui cada {{...}}, apaga o que não se aplica e este
comentário. Com UI (fase 4, --com-ui): {{regras-ui}} = `.agentic/ui-sem-slop.md`, {{detetor}} =
`.agentic/detetar-slop.mjs`, {{D-ui}} = exceções de marca (fase 2). Sem UI, apaga a
linha «UI». -->
# AGENTS.md

## Missão
{{O que o produto faz, para quem, numa frase.}}
{{A restrição que mais pesa, numa frase (ex.: dados pessoais só na UE).}}
Não-objetivos: {{numa linha, ou «docs/decisoes.md, Fora de âmbito»}}.

## Comandos
```bash
{{instalar}}            # dependências
{{correr}}              # app local, dados sintéticos
{{typecheck}}           # tipos
{{lint}}                # estilo
{{testes-area}} <pasta> # testes da área tocada
{{testes-todos}}        # bateria completa: antes de integrar em main
```
Antes de push correm os hooks (`.githooks/`); se um falha, corrige a causa.

## Mapa do código
- Áreas, pastas, verificação e risco: `.agentic/areas.json` (lê antes de mexer).
- Arquitetura: `ARCHITECTURE.md`. Termos: `GLOSSARIO.md` (usa estes nomes no código e testes).
- Decisões: `docs/decisoes.md`; difíceis de reverter: `docs/adr/`. Princípios (lê antes de decidir
  o que cobrem; não os copies): `.specify/memory/constitution.md`.

## Fluxo de trabalho
- Responde em {{idioma}}.
- Features: skill `agentic-feature`; revisão: `agentic-code-review` (lê `REVIEW.md`).
  Processo e «feito»: `docs/metodologia.md`.
- Ramo `agente/<id>-<tema>` (< 24 h) num worktree só teu (nunca dois agentes na mesma árvore):
  `git worktree add ../{{repo}}-<agente> -b agente/<id>-<tema> main`.
- TDD: teste vermelho primeiro, depois verde. Só os ficheiros do teu brief.
- API de dependência: confirma nos tipos ou docs da versão instalada.
- Dúvida de âmbito: segue com a opção menor e regista-a no quadro.
- Ao humano só o que é dele (produto, dinheiro, irreversível): uma decisão por pergunta, com
  opções e recomendação.
- Tecnologia: antes de recomendar, confirma versão e estado em fonte primária datada
  (`docs/radar.md` primeiro).
- Integra em `main` só com verificações verdes; quem orquestra faz push no fim.
- UI: segue `{{regras-ui}}` (exceções: `docs/decisoes.md` {{D-ui}}). Antes da revisão,
  `node {{detetor}} --diff <commit de partida>` sem bloqueios nas linhas que mudaste (corrige ou
  `slop-ok: <motivo>`); os antigos ficam numa linha do relatório.

## Regras duras
- Segredos nunca no código, em logs nem no chat: só nomes de variáveis (`.env` fica fora do git).
- Dados pessoais reais nunca em prompts, fixtures ou logs: usa dados sintéticos.
- Sem OK explícito do humano: nada de deploy de produção, apagar dados, pagar, publicar, criar
  contas, mexer em DNS. São irreversíveis ou externos.
- Nada de `--no-verify`, `git push --force` em ramos partilhados, nem `git add -A` às cegas: o
  primeiro esconde erros, o segundo apaga trabalho alheio, o terceiro mete ficheiros de outros.
- Migrações aplicadas nunca se editam: cria uma nova.
- «Feito» só com prova: comando corrido + saída.
{{Regras específicas do projeto, cada uma com o porquê.}}

## Onde registar
- Quadro: {{URL, ou «docs/backlog.md» sem quadro publicado (`scrum.sh markdown > docs/backlog.md`
  em cada transição e no commit do fim da sessão)}}. CLI `.agentic/quadro/scrum.sh` (`ajuda`; o
  comando de cada transição e os 4 passos de «Sincronizar»: README da pasta). Em cada transição
  e, a trabalhar, de 30 em 30 min: `scrum.sh agente sinal` + «Sincronizar» (o 1.º passo lê a
  caixa `pedidos-novos`; `url` = o desta linha). Um agente Claude envia ele próprio
  (ArtifactData; diferida: ToolSearch `select:ArtifactData`); sem ela (Codex, tarefas agendadas)
  só se grava no CLI; o próximo Claude envia.
- Decisão duradoura: `docs/decisoes.md` ou ADR.
- Tecnologia usada, testada ou rejeitada: `docs/radar.md` (na entrega).
- Lição: `docs/licoes.md` (formato no cabeçalho); se é mecânica, vira hook, lint ou teste.
