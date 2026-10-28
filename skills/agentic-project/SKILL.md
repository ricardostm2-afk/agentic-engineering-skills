---
name: agentic-project
description: Usa sempre que o utilizador quiser começar, arrancar, montar ou preparar um projeto ou repositório para trabalho com agentes de IA, mesmo sem dizer «agentic» — «novo projeto», «arrancar projeto», «quero começar uma app», «montar isto do zero», «preparar o repo para agentes», «cria o ambiente para os agentes», «prepara o setup de agentes», «retoma o arranque do projeto», «start a project», «bootstrap a new app», «set up this repo for agents», «set up the agent environment». Numa sessão leva um projeto novo ou existente de pré-requisitos, entrevista e arquitetura até repo com protocolo de agentes (worktrees, hooks, áreas), Spec Kit, AGENTS.md/CLAUDE.md, quadro scrum e backlog inicial. Para desenvolver uma feature num projeto já preparado, usa agentic-feature.
---

# agentic-project

Objetivo: sair desta sessão com o projeto pronto para agentes trabalharem em paralelo e com
segurança — pré-requisitos vistos, decisões registadas, arquitetura escolhida, repo com protocolo
de agentes, Spec Kit, instruções para agentes, quadro publicado e o primeiro lote de features no
backlog. Cada fase deixa um artefacto no repo, para que outra sessão (ou outro agente) consiga
retomar sem esta conversa.

Os caminhos `scripts/`, `references/` e `assets/` são relativos à pasta desta skill, aqui
chamada `<skill>` (a pasta deste `SKILL.md`: por exemplo `~/.claude/skills/agentic-project/` no
Claude Code, `~/.agents/skills/agentic-project/` no Codex, ou dentro de um plugin). Os scripts
correm-se com o repo do projeto como diretório atual, por isso chama-os pelo caminho completo
(`bash <skill>/scripts/…`).

A skill irmã `agentic-feature`, aqui `<agentic-feature>`, é a primeira destas pastas que tiver
`SKILL.md`:
1. `$AGENTIC_FEATURE_DIR`, se estiver definida;
2. a pasta ao lado desta, `<skill>/../agentic-feature` (o caso normal: as duas instalam-se
   juntas, também no plugin);
3. as pastas de skills dos agentes: `$CLAUDE_CONFIG_DIR/skills/`, `~/.claude/skills/`,
   `~/.agents/skills/`, `~/.codex/skills/`, `~/.config/agents/skills/`, `~/.cursor/skills/`,
   `~/.gemini/skills/`, `~/.copilot/skills/`, `~/.config/opencode/skills/`, e no projeto
   `.claude/skills/` e `.agents/skills/` (ou outra pasta de skills do agente);
4. o plugin `agentic-skills` do Claude Code: `<installPath>/skills/agentic-feature`, com o
   `installPath` de `agentic-skills@agentic-skills` em `~/.claude/plugins/installed_plugins.json`
   (a versão instalada; outras pastas da cache podem ser versões antigas).

A irmã `agentic-design`, aqui `<agentic-design>`, procura-se pela mesma ordem, com
`$AGENTIC_DESIGN_DIR` em primeiro; é a dona do método de UI e traz as regras (`ui-sem-slop.md`) e o
detetor de «estética de IA» que a fase 4 copia para `.agentic/`. Os scripts já fazem esta procura;
passa-lhes `AGENTIC_DESIGN_DIR` só se a encontraste noutro sítio. A irmã `agentic-code-review`,
aqui `<agentic-code-review>`, procura-se pela mesma ordem, com `$AGENTIC_CODE_REVIEW_DIR` em
primeiro; é a da revisão de código (a agentic-feature chama-a no passo 6) e tem o modelo do
`REVIEW.md`. A irmã `agentic-architecture`, aqui `<agentic-architecture>`, procura-se pela mesma
ordem, com `$AGENTIC_ARCHITECTURE_DIR` em primeiro; é a de melhorar a arquitetura de código que já
existe e tem o vocabulário de módulos e costuras. Instaladas como plugin do Claude Code, as irmãs
chamam-se `agentic-skills:agentic-feature`, `agentic-skills:agentic-design`,
`agentic-skills:agentic-code-review` e `agentic-skills:agentic-architecture` na ferramenta Skill.

## Arranque: mostra o plano e retoma se já houver trabalho

1. A 1.ª mensagem leva o plano numa linha (0 contexto → 1 pré-requisitos → 2 entrevista →
   3 arquitetura → 4 git → 5 Spec Kit → 6 AGENTS.md → 7 quadro → 8 metodologia → 9 backlog), o
   modo, e a 1.ª ação ou pergunta **no mesmo turno**: não peças licença para começar (a tabela
   abaixo mostra-se a quem a pedir). Repete a linha «Fase N/9: <nome>» ao começar cada fase, para
   o humano saber sempre onde está.
2. Se o repo já tem artefactos desta skill (`docs/decisoes.md`, `ARCHITECTURE.md`,
   `.agentic/areas.json`, `docs/radar.md`, `AGENTS.md`, `.specify/`), confere cada um contra o
   «Termina quando» **atual** da sua fase (podem ter sido feitos por uma versão anterior desta
   skill: ADR da stack sem a tabela com fontes nem `Rever em`, pre-commit sem o detetor de UI,
   `AGENTS.md` sem radar nem regra de UI). Mostra a lista do que falta por fase e retoma na
   primeira fase incompleta. Não refaças o que está completo; completa o resto (uma ADR aceite
   completa-se ou substitui-se, `references/arquitetura.md` §6; um hook existente muda-se com
   diff e OK).

| Fase | Nome | Artefacto no repo |
|---|---|---|
| 0 | Contexto e modo (novo/adotar) | `docs/decisoes.md` iniciado (secção Contexto) |
| 1 | Pré-requisitos | `docs/pre-requisitos.md` |
| 2 | Entrevista do projeto | `docs/decisoes.md` + `GLOSSARIO.md` |
| 3 | Arquitetura | `ARCHITECTURE.md` + `docs/adr/` + `docs/radar.md` |
| 4 | Ambiente git para agentes | hooks, `.gitignore`, `.agentic/areas.json` |
| 5 | Spec Kit + constituição | `.specify/memory/constitution.md` |
| 6 | Instruções para agentes | `AGENTS.md` + `CLAUDE.md` + `REVIEW.md` |
| 7 | Quadro scrum | `.agentic/quadro/` + quadro publicado (ou `docs/backlog.md`) + `AGENTS.md` |
| 8 | Metodologia | `docs/metodologia.md` + `docs/licoes.md` |
| 9 | Backlog inicial | 3–8 itens `backlog` no quadro (ou `docs/backlog.md`) |

## Regras para todas as fases

**Perguntas ao humano.** O humano decide produto, dinheiro e o que é irreversível; tu descobres
os factos. Por isso:
- Antes de perguntar, procura a resposta no contexto dado, no código e nos docs. Só pergunta o
  que lá não está.
- Uma pergunta de cada vez quando uma depende da outra. Cada pergunta leva opções concretas, a
  tua **recomendação** e o porquê numa linha. Até 4 perguntas independentes entre si vão juntas:
  numa chamada de AskUserQuestion, se existir; sem ela, numeradas numa só mensagem.
- «Escolhe tu» ou «segue as recomendações» é resposta válida para todas as pendentes: aplica as
  tuas recomendações e regista cada uma como **decisão delegada** em `docs/decisoes.md` (assim o
  humano pode revê-las depois sem reler a conversa).

**Escolhas por omissão** (o humano já as fez; aplica-as salvo indicação em contrário e regista
qualquer exceção em `docs/decisoes.md`):
- Trunk-based: `main` sempre pronto para produção, ramos curtos (< 24 h), nada fica sem push.
- UI escolhe-se entre 2–3 **variantes reais** (maquetas ou protótipos), nunca entre descrições.
- UI sem «estética de IA» (pastilhas pastel, cartões dentro de cartões, gradientes roxos, emojis
  como ícones, texto pequeno…): o trabalho de UI segue a `agentic-design`
  (`<agentic-design>/references/ui-sem-slop.md`) e corre o detetor dela,
  `<agentic-design>/scripts/detetar-slop.mjs` (cópias versionadas em `.agentic/`
  num projeto com UI), também no pre-commit. Bloqueia o que a alteração acrescenta ou muda; o
  slop que já lá estava fica numa linha do relatório, sem ir para o backlog (fases 2, 4 e 6).
- Tecnologia de agora, não de memória: a fase 3 e cada feature pesquisam o que há de mais atual
  em fontes primárias e datadas, e o que se aprende fica em `docs/radar.md`.
- O esforço escala com o risco: mudar um texto não leva spec; dados, permissões e pagamentos levam.
- «Feito» só com evidência medida (comando + saída), nunca declarado.
- Nada irreversível ou externo sem OK explícito do humano: deploy de produção, apagar dados,
  pagar, publicar, criar contas, criar repositório remoto, mexer em DNS.
- Segredos nunca no código nem no chat: o humano põe-nos num `.env` local ou no gestor de
  segredos; tu só referes o nome da variável.
- Dados pessoais reais nunca nos prompts de agentes nem em fixtures.

**Skills de terceiros.** Algumas fases usam skills de outros autores. Antes da fase 2, lê
`references/mapa-de-skills.md`: diz como cada uma se invoca de facto (ferramenta Skill, ler o
SKILL.md, ou só o utilizador com `/nome`) e o que fazer quando não está instalada. Nunca digas
«vou invocar /grill-me» — essas só o utilizador as pode chamar; tu lês o método e aplica-lo.

**Modo adotar** (repo já existente com código): nada se destrói nem se reescreve. As fases 1, 3 e
4 viram auditoria (o que existe, o que falta, proposta); qualquer alteração a `AGENTS.md`,
`CLAUDE.md`, hooks ou configuração existente é mostrada como diff e só se aplica com OK. As
regras que o repo já tem (`AGENTS.md`, `CLAUDE.md`, CONTRIBUTING) valem desde a fase 0, também
para os teus commits; se uma colide com uma escolha por omissão, vale a do repo até o humano
decidir na fase 2.

**Escala.** O esforço escala com o projeto, como nas features. Projeto pequeno (um utilizador-tipo,
sem dados sensíveis nem pagamentos, ou um repo de poucas centenas de linhas): faz as fases 1 e 2
numa só entrevista (as perguntas da fase 1 entram na 1.ª ronda), só as dimensões que mudam
alguma coisa, e ADR só para o que cumpre as três condições de `references/arquitetura.md` §6
(pode não haver nenhum). A pesquisa da fase 3 também encurta: 2 opções, tetos da coluna «via
curta» de `references/pesquisa-arquitetura.md`, sem subagentes, e esqueleto só se a recomendada
é nova para o projeto ou para o humano. As fases e os artefactos mantêm-se, mais curtos; diz ao
humano numa linha que escolheste a via curta.

**Commits.** No fim de cada fase, commit só dos ficheiros dessa fase (`git add <caminhos>`, nunca
`git add -A` às cegas), mensagem com o porquê. Push quando houver remoto; criar o remoto
(`gh repo create`, privado por omissão) só com OK do humano.

## Noutros agentes

Esta skill nasceu no Claude Code; noutro agente (Codex, Cursor, Gemini CLI, Copilot, OpenCode…)
o método é o mesmo e muda só a ferramenta. Quando uma das de baixo não existe, usa a troca e
diz-a numa linha ao humano:
- **AskUserQuestion** → perguntas no chat: até 4 independentes, numeradas, numa só mensagem,
  cada uma com 2–4 opções concretas e a tua recomendação primeiro (com o porquê numa linha); as
  dependentes, uma de cada vez.
- **Ferramenta Skill e plugins** (`mattpocock-skills:*`) → se a skill estiver instalada neste
  agente (procura `<nome>/SKILL.md` nas pastas de skills do ponto 3 acima e em
  `~/.claude/plugins/cache`), lê o SKILL.md dela e aplica o método; senão usa o método resumido em
  `references/` (`mapa-de-skills.md`).
- **Agent, Workflow e subagentes** → os subagentes do próprio agente; sem eles, faz tu o trabalho
  em sequência.
- **Artifact e ArtifactData** → segue «Sem quadro» de `references/quadro.md`:
  o quadro vive em `docs/backlog.md`, gerado com `scrum.sh markdown > docs/backlog.md` e lido
  como página no editor ou no alojamento git (o `quadro.html` fora do Artifact abre sem dados);
  regenera-se em cada transição e entra no commit no fim de cada sessão. Se o repo já tem um
  quadro publicado, grava só no CLI: o próximo agente Claude envia.
- **WebSearch/WebFetch** → a ferramenta web do agente; sem nenhuma, escreve «não confirmado (sem
  web)» e deixa o item pendente em `docs/pre-requisitos.md`.
- **Spec Kit** (fase 5): o init corre sempre com `--integration claude` (os caminhos desta skill
  contam com `.claude/skills/speckit-*`); para os agentes que leem `.agents/skills/` (Codex,
  Cursor, Gemini, Copilot, OpenCode), junta `specify integration install codex`, como na fase 5.
- **Sandbox e git** (Codex com a sandbox `workspace-write`, a de omissão): `.git` fica só de
  leitura e `../` fora da área de escrita, por isso `git commit`, `git worktree add ../…` e
  `git config` (o `core.hooksPath` da fase 4) pedem aprovação, e falham sem ela (`codex exec`,
  aprovações desligadas). Na fase 1, na pergunta das autorizações, pede ao humano que aprove os
  comandos git para a sessão ou que a abra com permissões totais (`codex --sandbox
  danger-full-access`, só com OK dele). Sem isso, cada commit pede aprovação e as faixas correm
  em sequência num só ramo (`<agentic-feature>/references/implementacao.md` §4).
- **Permissões** (`.claude/settings.local.json`, `update-config`) → o mecanismo de aprovação do
  próprio agente; regista a resposta em `docs/decisoes.md` como acima.

## Fase 0 — Contexto e modo

0. Decide **onde** fica o projeto antes de olhar para o que lá está. A pasta atual só serve se
   for claramente a deste projeto. Se é a home, uma pasta com vários projetos (`~/projetos`,
   `~/code`…), o repo de outro produto, ou o pedido é um projeto novo e a pasta já tem código
   alheio, faz UMA pergunta com recomendação: «crio em `<pasta-mãe>/<slug>`?». Com resposta,
   `mkdir -p <pasta>` (reversível) e usa-a como `<repo>` em todos os comandos (`git -C <repo>`,
   `--dir <repo>` nos scripts). Nunca faças `git init` em `$HOME` nem numa pasta que contém
   outros repos. Diz numa linha que o `CLAUDE.md` do repo novo só se carrega numa sessão aberta
   lá; esta sessão continua a funcionar com caminhos completos.
1. Lê o contexto que o humano deu (argumentos da skill, mensagem, ficheiros apontados). Se não
   deu nenhum, faz uma só pergunta aberta: «Descreve o projeto em 2–3 frases: o quê, para quem,
   e o que já existe.»
2. Inspeciona a pasta: `git status`, `git log --oneline -5`, árvore de topo, `README*`,
   `AGENTS.md`, `CLAUDE.md`, `.specify/`, `.agentic/`, manifestos de stack (`package.json`,
   `pyproject.toml`, `go.mod`, `Cargo.toml`…), `docs/`, CI existente.
3. Decide o modo: **novo** (pasta vazia ou só docs) ou **adotar** (há código). Diz qual e porquê
   numa linha. Se a pasta ainda não é um repositório git e o `git` existe, faz já
   `git init -b main`: é reversível e permite um commit por fase desde o início.
4. Cria `docs/decisoes.md` a partir de `assets/decisoes.template.md` (ou, em modo adotar, junta a
   secção Contexto ao ficheiro de decisões que já exista) com: o que é o projeto, modo, stack
   detetado, o que já existe.

Termina quando o modo está decidido e a secção Contexto está escrita.

## Fase 1 — Pré-requisitos

1. Corre `bash <skill>/scripts/verificar-ambiente.sh`. Mostra a tabela. Se faltar algo, propõe os
   comandos de instalação e só os corres com OK (instalar mexe na máquina do humano). Saída 1 =
   falta uma essencial (`git` ou `node>=20`): resolve-a antes de continuar. Recomendadas em
   falta não bloqueiam; cada fase diz o que fazer sem elas. Exceção: num projeto com UI, a
   `agentic-design` em falta é pendente com dono (sem ela não há regras nem detetor de UI).
   Na mesma pergunta, propõe as autorizações de uma vez (forma e ficheiro em
   `references/pre-requisitos.md` §6): a pesquisa web (`WebSearch` e `WebFetch`, em
   `.claude/settings.local.json`, fora do git; com a skill `update-config` se existir), porque a
   pesquisa das fases e das features faz-se sempre e sem isto cada página pede autorização; e
   descarregar dependências para o esqueleto da fase 3, que corre código de terceiros; e, num
   agente com sandbox que deixa `.git` só de leitura (Codex), os comandos git («Noutros agentes»,
   Sandbox e git). Só com OK; regista a resposta em `docs/decisoes.md`. Sem OK ou sem rede, as fases seguem com
   «não confirmado» e o item fica pendente.
2. Lê `references/pre-requisitos.md` e percorre a checklist. Responde tu ao que o contexto já
   responde; pergunta o resto ao humano, pela ordem de impacto.
3. Escreve `docs/pre-requisitos.md`: tabela item → estado (ok / pendente / n.a.) → dono → nota, e
   uma lista «Só o humano pode fazer» (contas, segredos, DNS, faturação). Cada decisão tomada
   aqui (para quem é, região, teto de custo…) entra logo em `docs/decisoes.md`, no formato do
   modelo; a fase 2 não a volta a perguntar.

Termina quando cada item tem estado e os pendentes têm dono.

## Fase 2 — Entrevista do projeto

Lê `references/grill-projeto.md` (banco de perguntas por dimensão, ordem e critério de paragem).
Se `mattpocock-skills:grilling` estiver disponível, invoca-a com a ferramenta Skill e dá-lhe o
contexto da fase 0; mantém as regras de perguntas acima (como as duas encaixam — rondas pela
fronteira, até 4 perguntas por chamada — está na referência). Para o vocabulário do domínio, invoca
`mattpocock-skills:domain-modeling` (ou aplica o método descrito na referência).

Saída: `docs/decisoes.md` com cada decisão (quem decidiu, porquê, reversível?) e a lista «Fora de
âmbito»; `GLOSSARIO.md` com os termos do domínio (sem detalhes de implementação).

Termina quando todas as dimensões da referência estão respondidas, delegadas ou marcadas como
fora de âmbito, e nenhuma pergunta aberta muda a arquitetura.

## Fase 3 — Arquitetura

Lê `references/arquitetura.md` e `references/pesquisa-arquitetura.md`. Antes de propor, descobre
o estado atual de cada categoria e pesquisa cada opção na web, em fontes primárias e datadas
(versão estável e suporte, custo com fonte, adequação a agentes medida num esqueleto quando é
barato), dentro dos tetos desse ficheiro; versões e preços nunca de memória, e as forças já
decididas pelo humano ganham à pesquisa. Propõe 2–3 opções com custo mensal (confirmado, ou
marcado «estimativa»), esforço de operação, dependência de fornecedor e adequação a agentes, e
uma recomendação. O humano escolhe (ou delega). Em modo adotar, ou com a stack já decidida na
fase 2, não há opções do zero: audita a arquitetura existente (secção «Modo adotar» de
`references/arquitetura.md`) e pesquisa versão e suporte de cada peça (secção «Modo adotar e
stack já decidida» de `references/pesquisa-arquitetura.md`). Destaca as decisões difíceis de
reverter; escreve ADR só para as que cumprem as três condições da referência (§6), as outras
ficam em `docs/decisoes.md`.

Saída: `ARCHITECTURE.md` curto (módulos, fluxos de dados, mapa de áreas, onde correm as
verificações) + a decisão da stack com a tabela da pesquisa (`docs/adr/NNNN-*.md`, ou
`docs/decisoes.md` quando não há ADR) + `docs/radar.md` inicial a partir de
`assets/radar.template.md` (alvos; em Adotar o que esta fase decidiu, com quem decidiu;
promissoras em Avaliar; em Evitar só o que falha um critério obrigatório).

Termina quando a opção está escolhida, cada pasta prevista do código tem área e verificação, e
`docs/radar.md` tem os alvos preenchidos e cada entrada com fonte e data (ou «não confirmado (sem
rede)», com o item pendente em `docs/pre-requisitos.md`).

## Fase 4 — Ambiente git para agentes

Lê `references/ambiente-git.md` (protocolo: ramos curtos, um worktree por agente, regras de
commit, hooks, mapa de áreas).

1. `bash <skill>/scripts/preparar-repo.sh --dir <repo>` (simulação; num projeto com UI, junta
   `--com-ui`). Mostra o que faria.
2. `bash <skill>/scripts/preparar-repo.sh --aplicar --dir <repo>` (com `--com-ui` se há UI:
   versiona `.agentic/detetar-slop.mjs` e `.agentic/ui-sem-slop.md`, sem perguntar). O script
   nunca sobrescreve; cada «aviso» conta como pendente e a fase não fecha com pendentes por
   resolver. Em modo adotar, trata cada «existe, mantido» e cada «aviso» como item de auditoria:
   `--mostrar pre-commit` imprime o hook atual, para o diff que propões.
3. Preenche `.agentic/areas.json` com o mapa da fase 3 (`risco`: `normal` ou `alto`). Num repo
   com código, ajusta os hooks aos comandos rápidos reais do projeto; num projeto novo não há
   nada a ajustar: os hooks já chamam `typecheck`/`lint`/`test` quando existirem, e a 1.ª feature
   cria-os. Um `aviso` de hooks locais em `.git/hooks` espera pelo OK do humano antes de definir
   `core.hooksPath`.
4. Prova que os hooks funcionam: um commit de teste que deve falhar falha, o corrigido passa, e o
   mesmo para o pre-push (como montar a prova sem código ainda: «Prova da fase» em
   `references/ambiente-git.md`). Se o projeto tem UI, prova também o detetor de slop que o
   pre-commit corre nos ficheiros de UI staged: um `.css` com `font-size: 10px` bloqueia, um
   limpo passa, e mudar outra linha de um ficheiro que já tinha `10px` passa (sai
   `pré-existente`). Mostra as saídas.

Termina quando os hooks estão ativos e provados e o script não deixa pendentes por resolver.

## Fase 5 — Spec Kit + constituição

1. `git status` tem de estar limpo (o passo seguinte reescreve ficheiros; precisas de ver o diff).
2. `specify init --here --force --non-interactive --integration claude`. Cria `.specify/` e as
   skills `speckit-*` em `.claude/skills/`. Se outro agente que lê `.agents/skills/` vai
   trabalhar no repo (Codex, Cursor, Gemini, Copilot, OpenCode; esta sessão incluída, se não é o
   Claude Code), junta `specify integration install codex`: cria `.agents/skills/speckit-*` e a
   integração por omissão continua a ser a do Claude (`specify integration status` confirma).
3. `git status` e `git diff`: repõe (`git checkout -- <ficheiro>`) qualquer ficheiro que o
   projeto já tinha e que o init alterou (ex.: `.claude/settings.json`). Apaga
   `speckit-taskstoissues/` em `.claude/skills/` e, se existir, em `.agents/skills/`
   (descontinuada; evita que um agente a use); o manifesto em `.specify/integrations/` continua
   a listá-la, por isso um novo `specify init` ou upgrade recria-a e tens de a apagar outra vez.
   Faz commit de `.specify/` e das `speckit-*` de cada pasta (`.claude/skills/` e
   `.agents/skills/`): cada agente que clonar o repo encontra as suas. O init sugere pôr `.claude/` no
   `.gitignore` por causa de credenciais locais: ignora só `.claude/settings.local.json` (o
   `.gitignore` base da fase 4 já o tem; num `.gitignore` antigo, acrescenta-o); as skills
   commitam-se.
4. Aplica `speckit-constitution` com princípios **deste** projeto, tirados de `docs/decisoes.md`
   e de `ARCHITECTURE.md` (ex.: «dados de saúde nunca saem da UE», «cada rota nova tem teste de
   autorização»), nunca genéricos. Invoca-a com a ferramenta Skill só se a sessão arrancou na raiz
   deste repo e ela já existia; senão lê `.claude/skills/speckit-constitution/SKILL.md` **deste
   repo** (ou `.agents/skills/speckit-constitution/SKILL.md`) e segue-o (as `speckit-*` da lista
   da sessão podem ser as de outro repo).

Se o init sair ≠ 0 (versão do `specify` diferente da 1.2.0 que esta skill testou, flags que
mudaram): `git status`, repõe o que o init alterou (`git checkout -- <ficheiros>`), apaga só o
que ele criou (ficheiros por seguir que o `git status` mostra e não existiam antes), regista a
falha em `docs/decisoes.md` e segue o caminho «sem `specify`» abaixo; o
`verificar-ambiente.sh` mostra o comando para instalar a 1.2.0.

Sem `specify` (e o humano não quer instalar): salta o init, escreve os princípios numa secção
«Princípios» de `docs/decisoes.md` e regista que a agentic-feature usará a spec leve.

Termina quando a constituição (ou a secção Princípios) existe e não tem marcadores por preencher.

## Fase 6 — Instruções para agentes

Lê `references/agents-md.md`. Se `mattpocock-skills:writing-for-agents` existir, invoca-a. Escreve
`AGENTS.md` a partir de `assets/AGENTS.template.md` e `CLAUDE.md` a partir de
`assets/CLAUDE.template.md`, e `REVIEW.md` a partir de
`<agentic-code-review>/assets/REVIEW.template.md`, como diz
`<agentic-code-review>/references/review-md.md` (o que é falhar em cada área `risco: alto`,
etiquetas, caminhos a saltar; o humano aprova «O que é falhar aqui»). Em modo adotar, mostra o
diff contra os existentes antes de gravar; um `REVIEW.md` existente não se reescreve.

O `AGENTS.md` nasce já com os ponteiros para o que as fases 7–9 criam (quadro, metodologia,
lições, backlog), marcados `(fase N)`; cada fase retira a sua marca e o Fecho confirma que não
sobrou nenhuma. Leva também, do modelo: a regra de UI (`ui-sem-slop.md` + detetor; só se o
projeto tem UI, com o ponteiro para a decisão «Exceções de UI» da fase 2), o radar
(`docs/radar.md`) e «confirma a API de dependência nos tipos ou docs da versão instalada».

Termina quando `wc -c AGENTS.md` ≤ ~4000 (até ~5 KB se as regras do projeto o exigirem, com
apontadores para docs em vez de texto), `wc -c REVIEW.md` ≤ ~3000 sem `{{` por preencher, «O que
é falhar aqui» do `REVIEW.md` está aprovado pelo humano (ou delegado, com a decisão em
`docs/decisoes.md`), cada comando lá escrito foi corrido com sucesso e cada caminho sem marca
existe. Comandos que dependem de algo aprovado e ainda por criar (o primeiro código de um projeto
novo, um typecheck que o modo adotar decidiu acrescentar) ficam marcados `(a criar na 1.ª
feature)` ou `(a criar: D-NNN)`, para nenhum agente os tomar como verificados.

## Fase 7 — Quadro scrum

Lê `references/quadro.md` e segue-o: copiar o CLI, o gancho e os testes para `.agentic/quadro/`
(testes verdes), escrever a `config.json` só com o que o projeto tem, publicar a página
(`assets/quadro/quadro.html`, capabilities exatas do README), semear, enviar e ler de volta,
e escrever as instruções no `AGENTS.md`, incluindo que cada agente Claude atualiza o quadro ele
próprio em cada transição e, enquanto trabalha, pelo menos de 30 em 30 min (`agente sinal` +
os 4 passos, com a caixa `pedidos-novos` no passo 1), que os agentes sem ArtifactData só gravam
no CLI, e nunca uma tarefa agendada.
Sem quadro publicado (falta a ferramenta Artifact ou `assets/quadro/`, ou o humano não quer),
segue a secção «Sem quadro» da referência: o CLI regista e `docs/backlog.md` é a vista
(`scrum.sh markdown`).

Termina quando: com quadro, o humano tem o link e um item semeado foi lido de volta do artefacto
(`estado/itens`) antes de correr o `confirmar` do `plano-sync`; sem quadro, o `AGENTS.md` diz onde
vive o backlog e como se regista cada transição, e o CLI (se instalado) responde a `scrum.sh ver itens`.

## Fase 8 — Metodologia

Lê `references/metodologia.md` e `references/mapa-de-skills.md`. Escreve `docs/metodologia.md`
adaptado ao projeto: ciclo de trabalho (com a pesquisa do mais atual no início de cada feature, o
detetor de slop na revisão de UI e o radar na entrega, antes do commit final), papéis, limite de
WIP, definição de «feito», cadência, armadilhas, e a tabela «quando → skill → como se invoca» só com as
skills instaladas aqui. Não repete regras: aponta para a constituição e para o `AGENTS.md`. Cria
`docs/licoes.md` (só o cabeçalho e o formato de uma linha), para onde vão as lições das retros.
Formato:
`- <aaaa-mm-dd> · <área> · tipo: <escapou|repetido> · base <sha-base> · <sha-defeito>→<sha-correção> · esperado: <ficheiro:linha> · classe: <classe> · camada: <a que devia ter apanhado (escapou) ou a que apanhou (repetido)> · <o que aconteceu> → <a defesa>`
A agentic-feature escreve uma linha `tipo: escapou` quando algo escapou (revertido, incidente,
reportado pelo humano; `esperado` é o `ficheiro:linha` onde o revisor o devia ter acusado) e uma
`tipo: repetido` quando a mesma classe aparece pela 2.ª vez numa revisão (`esperado` é a linha do
achado). Só as `tipo: escapou` sobem a via na triagem. Essas linhas são o conjunto de avaliação do
revisor (`<agentic-code-review>/references/aprendizagem.md`).

Termina quando `AGENTS.md` aponta para `docs/metodologia.md` e o ficheiro não contradiz as
decisões.

## Fase 9 — Backlog inicial

1. Lê o método de fatias verticais do `to-tickets`
   (a versão instalada está na cache: `find ~/.claude/plugins/cache -path
   '*mattpocock*/to-tickets/SKILL.md' | sort | tail -1`; sem resultado, procura em
   `~/.claude/plugins`); não o invoques, só o
   utilizador o pode fazer. Usa dele o método (fatias, bloqueios, a pergunta ao humano), não o
   formato de publicação: os itens vão para o quadro ou `docs/backlog.md`, não para ficheiros em
   `.scratch/`. Sem o plugin, aplica: cada fatia atravessa todas as camadas
   (dados → lógica → interface → testes), é demonstrável sozinha e cabe numa sessão.
2. Parte o MVP em 3–8 features. Cada uma: título, o que entrega ao utilizador, bloqueada por,
   critério de aceitação verificável (comando ou passo observável). Num projeto novo a primeira
   é quase sempre o esqueleto que anda: a app mínima de ponta a ponta, a correr localmente com
   um comando, com um teste, typecheck e hooks verdes — dá aos agentes seguintes um ciclo de
   verificação real. Em modo adotar a app já anda: a primeira é o que falta ao ciclo de
   verificação (comandos marcados «a criar» na fase 6) ou o prefactor que torna as seguintes
   fáceis.
3. Mostra a lista ao humano numa pergunta: «a granularidade e a ordem estão certas?» (recomenda a
   tua). Ajusta.
4. Escreve cada feature como item `backlog` com o CLI (`scrum.sh item add --id f01-<slug>
   --titulo "<título>" --criterio "<aceitação verificável>" [--depende f00-…]`), sincroniza o
   quadro e regenera `docs/backlog.md` (`scrum.sh markdown > docs/backlog.md`) se é aí que vive a
   vista. Sem CLI, escreve `docs/backlog.md` à mão.
5. Regista as fases 8 e 9 no quadro como as anteriores (`scrum.sh item add --id arranque-f8
   --titulo "Metodologia" --estado integrado`, idem `arranque-f9`).

Termina quando os itens estão no quadro (ou em `docs/backlog.md`) e `scrum.sh ver itens` os mostra.

## Fecho

1. Confere o `AGENTS.md`: nenhuma marca `(fase N)` por resolver e cada caminho referido existe
   (`ls`). Sincroniza o quadro uma última vez.
2. Commit dos últimos artefactos; push se houver remoto (segundo a política do projeto).
3. Mensagem final ao humano, no máximo 10 linhas: o que ficou pronto, link do quadro, e a lista
   «Fica para ti» (contas, segredos, DNS, faturação, decisões delegadas a rever; as mesmas que
   estão no quadro como «à espera do humano»).
4. Acaba com UMA pergunta, recomendação «sim»: «arranco já a `f01-<slug>`?». Com sim, invoca
   `agentic-feature` com a ferramenta Skill (sem ela, lê `<agentic-feature>/SKILL.md` e segue-o)
   e passa-lhe o id do item (`f01-<slug>`), para ela retomar esse item do quadro em vez de criar
   outro. Com não, deixa a linha «Próximo passo: invoca a agentic-feature com `f01-<slug>`», com
   o comando da instalação em uso: `/agentic-skills:agentic-feature f01-<slug>` no plugin do
   Claude Code, `/agentic-feature f01-<slug>` numa cópia, `$agentic-feature f01-<slug>` no Codex.

## Referências: quando ler cada uma

| Ficheiro | Lê quando |
|---|---|
| `references/pre-requisitos.md` | fase 1 |
| `references/grill-projeto.md` | fase 2 |
| `references/arquitetura.md` | fase 3 |
| `references/pesquisa-arquitetura.md` | fase 3, antes de propor as opções de stack; e ao rever uma escolha de stack |
| `references/ambiente-git.md` | fase 4, ou quando um agente pergunta como usar ramos/worktrees |
| `references/agents-md.md` | fase 6, ou ao rever um `AGENTS.md` existente |
| `references/quadro.md` | fase 7, quando o quadro não sincroniza, ou ao escrever o brief de um agente (quem sincroniza) |
| `assets/quadro/README.md` | fase 7 (comandos do CLI, configuração, capabilities, semear, os 4 passos de «Sincronizar» com `plano-sync`) |
| `references/metodologia.md` | fase 8; também tem as armadilhas de código escrito por agentes |
| `references/mapa-de-skills.md` | antes da fase 2, e sempre que fores invocar uma skill de terceiros |
| `assets/decisoes.template.md` | fase 0 |
| `assets/radar.template.md` | fim da fase 3, para criar `docs/radar.md` |
| `<agentic-design>/references/ui-sem-slop.md` (outra skill) | fase 2 (dimensão UI) e fase 6 (regra de UI do `AGENTS.md`) |
| `<agentic-architecture>/references/vocabulario.md` (outra skill) | fase 3 (§4 de `references/arquitetura.md`: módulos, interfaces e costuras) |
| `<agentic-feature>/references/pesquisa-moderna.md` (outra skill) | fase 3 (fontes, regras e filtro «moderno sim, moda não») e fase 8 |
| `assets/AGENTS.template.md`, `assets/CLAUDE.template.md`, `<agentic-code-review>/assets/REVIEW.template.md` e `<agentic-code-review>/references/review-md.md` (outra skill) | fase 6 |
| `scripts/verificar-ambiente.sh` | fase 1 (saída 0 = essenciais OK; 1 = falta essencial) |
| `scripts/preparar-repo.sh` | fase 4 (simulação por omissão; `--aplicar` para fazer; `--com-ui`; `--mostrar <ficheiro>`) |
| `scripts/preparar-repo.test.mjs` | ao mudar o `preparar-repo.sh` ou o hook que ele gera: `node --test <skill>/scripts/*.test.mjs` (sem aspas: o glob entre aspas só existe no Node ≥ 21) |
