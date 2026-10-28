# Mapa de skills: quando → skill → como se invoca

Lê isto antes de invocar uma skill de terceiros. Há três formas de as usar e confundi-las faz o
agente prometer o que não pode fazer:

- **Skill** — o modelo invoca-a com a ferramenta Skill, pelo nome qualificado.
- **Ler** — só o utilizador a pode invocar (`disable-model-invocation: true`). O agente lê o
  SKILL.md e aplica o método, ou sugere ao humano que escreva `/nome`. Nunca digas «vou invocar
  /nome» para uma destas. Encontrar o ficheiro:
  `find ~/.claude/plugins/cache -path '*mattpocock*/<nome>/SKILL.md' | sort | tail -1` (a cache
  tem a versão instalada; `marketplaces/` é o checkout do catálogo e pode estar à frente). Sem
  resultado, procura em `~/.claude/plugins`.
- **Projeto** — skills do Spec Kit, criadas em `.claude/skills/` pelo `specify init` (e em
  `.agents/skills/` pela integração `codex`, fase 5). Invoca-as com a ferramenta Skill só se a
  sessão arrancou na raiz deste repo e elas já lá estavam. Nos outros casos lê
  `.claude/skills/<nome>/SKILL.md` **deste repo** (ou, se não existir,
  `.agents/skills/<nome>/SKILL.md`) e segue-o: se foram criadas
  depois de a sessão arrancar, não aparecem; e se a sessão arrancou noutro diretório, as
  `speckit-*` da lista são as desse outro repo (outra versão, scripts a correr na pasta errada).

Os nomes qualificados abaixo são os do plugin instalado; se a lista de skills da sessão mostrar
outro prefixo, usa o da lista. Skills e comandos do próprio projeto (ex.: `/ship`, `/deploy`,
bateria própria) ganham a estas quando fazem o mesmo.

## Tabela

| Quando | Skill | Como | Sem ela |
|---|---|---|---|
| Entrevistar o humano sobre um plano | `mattpocock-skills:grilling` | Skill | protocolo de `grill-projeto.md` |
| Glossário, termos do domínio, ADRs | `mattpocock-skills:domain-modeling` | Skill | §Glossário de `grill-projeto.md`, §6 de `arquitetura.md` |
| Desenhar módulos, interfaces, costuras | o vocabulário de `<agentic-architecture>/references/vocabulario.md` (deste conjunto), pelo §4 de `arquitetura.md` | Ler | `mattpocock-skills:codebase-design`, se instalado: a mesma fonte, em inglês |
| Escrever código com teste primeiro e mudança mínima (o agente de cada faixa, com um brief fechado) | `agentic-implement` (deste conjunto; `agentic-skills:agentic-implement` no plugin) | Skill | um teste vermelho → código mínimo verde → repetir; testar pela interface pública; cada linha do diff liga-se ao brief |
| Maquetas/variantes de UI, validar lógica | `mattpocock-skills:prototype` | Skill | maquetas HTML estáticas com os tokens reais |
| Rever código: o diff de uma feature (a `agentic-feature` chama-a no passo 6), um ramo, um PR ou o que um agente fez; inclui a lente de segurança (no Claude Code pode ser o `security-review`) | `agentic-code-review` (deste conjunto; `agentic-skills:agentic-code-review` no plugin) | Skill | ler `<agentic-code-review>/SKILL.md` e segui-lo; sem a skill, a revisão fica por fazer |
| Auto-revisão do autor antes de pedir revisão (opcional; não é lente da `agentic-code-review`) | `mattpocock-skills:code-review` | Skill | — |
| Simplificar o próprio diff antes da revisão (autor, opcional) | `simplify` (Claude Code), com o alvo `<base-da-faixa>...HEAD` (se só revê o diff atual, num worktree descartável com `git reset --soft <base-da-faixa>`) | Skill | a mudança mínima da `agentic-implement` (passo 4) |
| Factos externos (APIs, documentação) | `mattpocock-skills:research` | Skill | ler fontes primárias e citar |
| Corrigir um bug, uma regressão ou um incidente (causa raiz, classe do defeito, vermelho e verde) | `agentic-fix` (deste conjunto; `agentic-skills:agentic-fix` no plugin) | Skill | reproduzir → hipótese → medir → corrigir → teste |
| Escrever `AGENTS.md`, skills, docs para agentes | `mattpocock-skills:writing-for-agents` | Skill | `agents-md.md` |
| Texto de PR | `mattpocock-skills:pr` | Skill | o quê, porquê, prova, risco, como desfazer |
| Passos que só o humano faz (contas, segredos) | `mattpocock-skills:wizard` | Skill | lista numerada de passos com comandos |
| Partir trabalho em fatias verticais | `to-tickets` | Ler | ver fase 9 do SKILL.md |
| Trabalho grande demais para uma sessão | `wayfinder` | Ler | partir em decisões primeiro, depois em fatias |
| Retrospetiva de uma sessão | `retro` | Ler | 3–5 linhas: bem, atrasou, lição |
| Entrevista que também escreve docs | `grill-with-docs`, `grill-me` | Ler | `grilling` + `domain-modeling` |
| Spec a partir da conversa, implementar spec | `to-spec`, `implement`, `implement-spec` | Ler | Spec Kit (abaixo) |
| Passar trabalho a outra sessão | `handoff` | Ler | nota de passagem: estado, próximo passo, ficheiros |
| Triagem de issues | `triage` | Ler | — |
| Melhorar a arquitetura de código que já existe: módulos rasos onde o código mais muda, relatório, grill do candidato (substitui o `improve-codebase-architecture`, que adapta) | `agentic-architecture` (deste conjunto; `agentic-skills:agentic-architecture` no plugin) | Skill | ler `<agentic-architecture>/SKILL.md` e segui-lo |
| Princípios do projeto | `speckit-constitution` | Projeto | secção Princípios em `docs/decisoes.md` |
| Especificar → clarificar → planear → tarefas | `speckit-specify`, `speckit-clarify`, `speckit-plan`, `speckit-tasks` | Projeto | spec leve da `agentic-feature` |
| Consistência e qualidade antes de implementar | `speckit-analyze`, `speckit-checklist` | Projeto | revisão manual spec ↔ plano ↔ tarefas |
| Implementar e fechar o que falta | `speckit-implement`, `speckit-converge` | Projeto | briefs da `agentic-feature` |

Não uses `speckit-taskstoissues` (descontinuada).

## Notas

- `code-review`, `to-tickets` e `wayfinder` esperam um tracker configurado por
  `/setup-matt-pocock-skills` (só o utilizador o corre). Sem ele: ao `code-review` passa o
  caminho da spec diretamente; do `to-tickets` usa o método (fatias verticais, bloqueios,
  perguntar ao humano a granularidade) mas não o formato de publicação (um ficheiro por ticket
  em `.scratch/`): os itens vão para o quadro, ou para `docs/backlog.md` quando não há quadro.
  Se o humano quiser, sugere-lhe `/setup-matt-pocock-skills` com tracker «local markdown» ou
  GitHub.
- `domain-modeling` procura `GLOSSARY.md`; neste método o ficheiro é `GLOSSARIO.md`. Diz-lho ao
  invocar.

## Instalar

```
# no Claude Code
/plugin marketplace add mattpocock/skills
/plugin install mattpocock-skills@mattpocock

# no terminal (Spec Kit)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.2.0
```
