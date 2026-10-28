---
name: agentic-code-review
description: >-
  Usa-a sempre que alguém pedir para rever código, escrito por pessoas ou por agentes, mesmo sem
  dizer «code review»: «revê este diff», «revê este ramo», «revê este PR», «code review», «revisão
  de código», «rever antes de integrar», «revê o que o agente fez», «review this branch», «review
  this PR», «review this diff». Confere o nível pela mudança, lança um painel de lentes
  independentes num worktree fora do repo, consolida e confirma os achados (Importante, Nit,
  Pré-existente, sempre com ficheiro:linha), limita as rondas e transforma o que escapa em lições
  e casos de avaliação. Funciona sozinha, num repo qualquer, com ou sem REVIEW.md, ou chamada pela
  agentic-feature no passo 6. Modo manutenção, só a pedido explícito («audita o código para
  limpeza», «audita para manutenção», «limpa o código morto»): auditoria com provas de várias
  fontes e uma limpeza pequena por commit. Não corrige o código que revê nem escreve features
  (agentic-feature).
---

# agentic-code-review

Revisão de código para trabalho com agentes. A pergunta não é «alguém leu isto?», é «o que pode
correr mal com esta mudança, e que verificação o apanha?». Os agentes que reveem não escreveram o
código, cada achado traz prova com `ficheiro:linha`, o ruído é cortado antes de chegar ao autor e
as rondas têm limite, porque um autor-agente corrige tudo o que lhe apontam e um revisor-agente
encontra sempre mais.

Método construído a partir de dois artigos, resumidos por palavras nossas:
- camadas de verificação e revisão por agentes:
  https://claude.dev/blog/solving-code-review-at-anthropic/
- manutenção com provas e avaliação de modelos e de instruções:
  https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family
- outras ideias, sem texto copiado: o lote mecânico revisto por classe, do artigo da Microsoft [«Cheap code, precious trust»](https://commandline.microsoft.com/agentic-software-engineering-large-scale-code-migration-language-modernization-spec-driven-development/) (Command Line, 2026-10-26), e «Calar o verificador», do `unclebob/ub-mode` (revisão `57a8bdd28`, sem licença).

**As regras do repo ganham sempre a esta skill.** Lê primeiro `REVIEW.md` (na raiz, onde o
`AGENTS.md`/`CLAUDE.md` apontar, ou `git ls-files '*REVIEW.md'`), depois `AGENTS.md`/`CLAUDE.md`.
O `REVIEW.md` define o que é do repo: níveis com outros nomes, zonas e «o que é falhar», caminhos
sempre altos, lentes por zona, comandos e guardas; usa o que lá está. O processo (etiquetas,
formato do relatório, rondas, teto) é desta skill e o modelo é do utilizador. Quando o projeto tem
os seus próprios comandos de revisão ou de classificação, usa-os.

`<skill>` é a pasta deste `SKILL.md` (por exemplo `~/.claude/skills/agentic-code-review`,
`~/.agents/skills/agentic-code-review`, ou dentro de um plugin). As skills irmãs
`agentic-feature`, `agentic-design`, `agentic-implement` e `agentic-project`, aqui
`<agentic-feature>`, `<agentic-design>`, `<agentic-implement>` e `<agentic-project>`, são a
primeira destas pastas que tiver `SKILL.md`: `$AGENTIC_FEATURE_DIR`, `$AGENTIC_DESIGN_DIR`,
`$AGENTIC_IMPLEMENT_DIR` ou `$AGENTIC_PROJECT_DIR`, se definidas; a pasta ao lado desta,
`<skill>/../<nome>` (o caso normal: instalam-se juntas, também no plugin); as pastas de skills dos agentes
(`$CLAUDE_CONFIG_DIR/skills/`, `~/.claude/skills/`, `~/.agents/skills/`, `~/.codex/skills/`,
`~/.config/agents/skills/`, `~/.cursor/skills/`, `~/.gemini/skills/`, `~/.copilot/skills/`,
`~/.config/opencode/skills/`, e no projeto `.claude/skills/` e `.agents/skills/`); por fim o
plugin `agentic-skills` do Claude Code, em `<installPath>/skills/<nome>`, com o `installPath` de
`agentic-skills@agentic-skills` em `~/.claude/plugins/installed_plugins.json`. Esta skill não
precisa delas para rever; usa-as quando existem (o detetor e as regras de UI da agentic-design, os
gostos da agentic-implement, o ficheiro de lições que a agentic-project cria).

## Dois modos

- **Revisão** (por omissão): um diff, um ramo, um PR, um intervalo de commits ou o que um agente
  acabou de fazer. Os passos 0–7 abaixo.
- **Manutenção**: auditoria de código existente para limpeza (código morto, flags acabadas,
  testes instáveis, CI lenta). **Só com pedido explícito do humano nesta conversa**; nunca por
  iniciativa tua, nunca «já agora» a meio de uma revisão. Lê `references/manutencao.md` e usa
  `assets/brief-manutencao.template.md`.

Fora dos dois: varrer código antigo à procura de defeitos durante uma revisão. O que já estava na
base é Pré-existente, numa linha do relatório, e não vai para o backlog.

## Passos

| Passo | O quê | Referência |
|---|---|---|
| 0 | Ponto fixo: base, SHA revisto, intenção | `references/painel-e-rondas.md` §1 |
| 1 | Nível pela mudança | `references/niveis-de-risco.md` |
| 2 | Painel de lentes em paralelo, num worktree fora do repo | `references/painel-e-rondas.md` §2–§4 |
| 3 | Consolidação | `references/painel-e-rondas.md` §5 |
| 4 | Confirmação dos Importantes | `references/painel-e-rondas.md` §6 |
| 5 | Relatório | `assets/relatorio.template.md` + `scripts/validar-relatorio.mjs` |
| 6 | Respostas e rondas | `references/painel-e-rondas.md` §7–§10 |
| 7 | Aprendizagem | `references/aprendizagem.md` |

### 0. Ponto fixo

A revisão vale para um SHA. Fixa a base e o **SHA revisto** antes de lançar alguém:
- ramo ou PR: `git merge-base <alvo> <ramo>` dá a base; o SHA revisto é a ponta do ramo;
- intervalo dado pelo humano: usa-o como está;
- alterações por commitar: `git stash create` dá um SHA da árvore sem lhe mexer (só ficheiros
  seguidos: os novos por seguir, de `git status --short`, ficam de fora e vão para «Não li»).

Junta a intenção: a spec, o pedido, a descrição do PR ou as mensagens dos commits. Sem intenção
escrita, a lente spec não corre e o relatório di-lo. Chamada pela agentic-feature, tudo isto vem
no pedido (via, base, SHA revisto, spec, plano, pesquisa aprovada, capturas).

### 1. Nível pela mudança

Classifica tu (o orquestrador), pelo diff e nunca pelo relatório do autor: Rápida, Padrão ou
Completa, ou os níveis do `REVIEW.md`. Os caminhos sempre altos, as regras para hooks, CI e
instaladores (sobem as lentes, não as rondas) e a subida por lições estão em
`references/niveis-de-risco.md`. Diz o nível e o porquê numa linha. Repete a conferência em cada
ronda, sobre o diff dessa ronda. As lentes não a refazem; se o que leem pede mais, dizem-no numa
linha «Nível» do relatório e decides tu.

Na Rápida não há painel: a prova é o teste vermelho → verde do autor. Se o humano pediu a revisão
explicitamente, corre uma lente (correção) e uma ronda.

### 2. Painel

- Um worktree por revisor, criado por ti **fora do repo** e destacado no SHA revisto:
  `git worktree add --detach "<tmp>/revisao-<tema>-<lente>" <sha-revisto>`, com o `<tmp>` de
  `references/painel-e-rondas.md` §2. Passas-lhe o caminho no brief. Nunca a árvore da sessão; vale também para um revisor Codex ou de outro
  agente.
- Cada revisor é um subagente com contexto novo e o seu brief, feito a partir de
  `assets/brief-revisor.template.md`, lido depois do `REVIEW.md`, com as lentes que o
  `references/painel-e-rondas.md` §3 lhe dá pelo nível. Lança-os em paralelo.
- Lentes, modelo e teto (8 agentes de revisão por mudança, somando rondas) em
  `references/painel-e-rondas.md` §3. Em resumo: todas as lentes e o verificador correm no modelo
  de revisão do utilizador.
- O `/security-review` revê `git diff origin/HEAD...` da pasta onde corre, e não o que está por
  commitar: corre no worktree, no SHA revisto e sem reset, e só conta como lente de segurança se
  `git -C <wt> merge-base origin/HEAD <sha-revisto>` dá `<base>`; senão, a lente é um subagente
  com o brief (`references/painel-e-rondas.md` §2).
- Um diff com mais de ~1 000 linhas revê-se por fatias (cada fatia conta para o teto); diz ao
  humano que partir a mudança era melhor. O diff de um lote mecânico com playbook aprovado
  revê-se por classe (`references/manutencao.md`, «Lote mecânico»).

### 3. Consolidação

Tu juntas os relatórios das lentes num só antes de irem ao autor: deduplicas por ficheiro +
classe (fica o achado com a melhor prova), cortas os Nits a 3 no total, pões os Pré-existentes
numa linha e escreves a 1.ª linha com a contagem.

### 4. Confirmação

Nenhum Importante vai ao autor sem prova, e nenhum se corrige «na dúvida».
- Completa, e hooks, CI ou instaladores: **um verificador** na ronda 1, no modelo de revisão e com
  contexto novo, sobre os Importantes já consolidados. Confirma, refuta (com `ficheiro:linha`) ou
  fica sem veredicto (= não confirmado: linha «Não confirmados», não vai ao autor como Importante).
- Em todos os níveis e rondas: quem corrige reproduz cada Importante antes de corrigir (teste
  vermelho; num doc, a linha do doc e a que a desmente). Não reproduzido não se corrige.

### 5. Relatório

Segue `assets/relatorio.template.md`: 1.ª linha
`Revisão <sha> · <via> · [lente <lente> · ]ronda <n>/<limite> · <i> Importantes · <n> Nits · <p> Pré-existentes`;
`0 Importantes — nada a corrigir` logo a seguir quando não há; cada achado com etiqueta e
`ficheiro:linha`; Pré-existentes numa linha. Antes de o mandar ao autor ou ao humano:

```bash
node <skill>/scripts/validar-relatorio.mjs <relatorio.md>   # 0 = conforme; 1 = lista do que falha
```

O validador confere a forma, não a verdade dos achados; essa é do passo 4.

### 6. Respostas e rondas

- Cada Importante fica com uma resposta: **corrigido** (commit e prova a passar), **errado**
  (`ficheiro:linha` que o desmente, ou «não reproduzido» com a tentativa), **intencional** (onde
  está decidido) ou **não importa** (porquê).
- Corrigir não é desta skill: os Importantes vão ao autor (o agente que fez a mudança, ou uma
  sessão de correção, que é autoria). Se o humano te pede que corrijas, és o autor dessa correção
  e a ronda seguinte revê-a.
- Limite de rondas pelo nível (1 na Rápida pedida, 2 na Padrão, 3 na Completa). Da 2.ª em diante:
  só o diff novo, sem repetir achados fechados, e só as lentes com Importantes abertos, juntas.
- O que entra depois do SHA revisto sem abrir ronda (metadados, correção de um Importante com
  prova e diff conferido, teste do revisor integrado sem alterações), o tronco trazido para o
  ramo (merge ou rebase), o «como desfazer» e a linha `Revisão:` estão em `references/painel-e-rondas.md` §9–§10.
- **No limite, com um Importante aberto, pára e vai ao humano** com um resumo (achados abertos,
  respostas, rondas, diff por rever, a tua recomendação). Nunca uma ronda extra em silêncio.

No fim de cada ronda confere `git worktree list` e `git -C <wt> status --short` (vazio: o revisor
não deixou mutações) e remove cada worktree (`git worktree remove <wt>`).

### 7. Aprendizagem

- Algo escapou (revertido, incidente, reportado pelo humano) ou a mesma classe apareceu pela 2.ª
  vez: uma linha de lição, no formato de `references/aprendizagem.md`.
- Achado repetido: corrige-o na fonte. Se uma máquina o vê sem falsos positivos, vira guarda,
  lint ou teste; senão, uma linha do `REVIEW.md` (`references/review-md.md`).
- Mudou o brief, o `REVIEW.md`, os prompts, o modelo ou o esforço do revisor: corre-o contra os
  casos de avaliação (`assets/caso-de-avaliacao.template.md`) antes de ficar.
- Sem `REVIEW.md` no projeto: no fim, sugere criá-lo a partir de `assets/REVIEW.template.md`
  (não o cries sem OK; a agentic-project cria-o na fase 6).

## Mensagem final ao humano

O relatório consolidado (validado), e por baixo, curto: o nível e porquê, as lentes e modelos
usados (e quantos agentes contra o teto), o que ficou por ler, as respostas aos Importantes, e o
que a revisão não cobre (o que nenhuma lente verificou: desempenho real, comportamento em
produção, o que só a CI ou o humano veem). Se ficou um Importante aberto ou uma «Direção», é a
primeira coisa que ele lê.

## Noutros agentes

- **Codex**: as lentes e o verificador são subagentes do Codex com o mesmo brief, no modelo de
  revisão do utilizador (sem regra dele, por exemplo gpt-6.1-sol com esforço médio;
  o projeto escolhe o seu). Na sandbox por omissão o
  `.git` é só de leitura: `git worktree add` pede aprovação. Pede-a uma vez para a sessão; sem ela,
  corre as lentes em sequência num só worktree criado pelo humano. Num job lançado sem subagentes
  (o lançador desliga-os), cada revisor que o nível pede à parte (as lentes da Completa, o
  verificador) é um job seu, com o seu brief; um job que junta o que o nível separa marca o
  relatório «revisão não independente».
- **Cursor, Gemini CLI, Copilot, OpenCode**: subagentes a confirmar. Sem eles, cada lente corre
  numa sessão nova (contexto novo) com o brief; se nem isso há, faz tu as lentes em sequência,
  depois de fechares qualquer escrita, e marca o relatório «revisão não independente».
- **`/security-review`** só existe no Claude Code; noutros agentes a lente de segurança é um
  subagente com o brief. O modelo de revisão, onde o utilizador não tem regra, lê-se como o modelo
  de raciocínio do agente com esforço médio.
- Sem `node`, o relatório confere-se à mão contra `assets/relatorio.template.md` e a mensagem
  final di-lo.

## Quando ler cada ficheiro

| Ficheiro | Quando |
|---|---|
| `references/camadas.md` | ao explicar onde a revisão encaixa, ou quando o humano pergunta o que ela não apanha |
| `references/niveis-de-risco.md` | passo 1, em cada ronda |
| `references/painel-e-rondas.md` | passos 0, 2–6 |
| `references/review-md.md` | ao escrever ou rever um `REVIEW.md`, ou quando um achado se repete |
| `references/aprendizagem.md` | passo 7; ao mudar o revisor (brief, prompts, modelo, esforço) |
| `references/manutencao.md` | só no modo manutenção, a pedido explícito; e «Lote mecânico», num diff feito por script com playbook aprovado |
| `assets/brief-revisor.template.md` | passo 2, um brief por lente; o verificador usa a última secção |
| `assets/relatorio.template.md` | passos 3 e 5 |
| `assets/REVIEW.template.md` | ao criar um `REVIEW.md` (com OK do humano, ou pela agentic-project) |
| `assets/caso-de-avaliacao.template.md` | passo 7, ao registar ou correr casos de avaliação |
| `assets/brief-manutencao.template.md` | modo manutenção |
| `scripts/validar-relatorio.mjs` | passo 5 (`node --test <skill>/scripts/*.test.mjs` ao mudá-lo) |
