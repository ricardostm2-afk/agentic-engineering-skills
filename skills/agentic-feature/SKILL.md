---
name: agentic-feature
description: >-
  Usa-a sempre que alguém quiser construir, planear, acrescentar ou mudar uma funcionalidade ou um
  ecrã num projeto com código, mesmo sem dizer «feature»: «quero desenvolver a feature…», «nova
  funcionalidade», «faz o planeamento/a spec desta feature», «implementa isto», «faz um ecrã
  para…», «pega na próxima feature do backlog», «continua a feature X», «build this feature»,
  «plan/spec this feature», «implement X». Num repo com Spec Kit, usa-a em vez de chamar speckit-*
  diretamente. Leva a feature do pedido à integração: triagem, leitura e pesquisa do mais atual,
  grill do que é do humano, variantes de UI sem estética de IA (pela `agentic-design`), spec,
  briefs para agentes Claude ou Codex com a `agentic-implement`, revisão independente e prova. Não
  serve para corrigir o que já existe (agentic-fix) nem para arrancar um projeto do zero
  (agentic-project).
---

# agentic-feature

Do pedido à feature integrada. Tu és o orquestrador: decides o que é técnico e reversível,
escreves a spec e os briefs, lanças os agentes, revês e integras. Os agentes (subagentes Claude ou
jobs Codex) escrevem o código com a `agentic-implement`. O humano decide o que é dele: produto,
compromissos e o irreversível.

<!-- cartao:inicio — copiado das fontes que cita; atualiza-o quando elas mudarem -->
## Cartão

Fontes: `<agentic-implement>/references/escolher-o-agente.md` (nível §1, modelo §2); `<agentic-code-review>/SKILL.md` (revisão passos 5 e 6).

Passo 0 — Feito quando disseste numa linha a via e o critério que acertou (e cada mudança de via depois).
Passo 1 — Feito quando a Leitura tem as sugestões e a abordagem fechadas, com a pesquisa citada. Mostra-a ao humano no início do momento 1.
Passo 2 — Feito quando a fronteira está vazia (não quando acaba a lista) e mostraste a tabela das decisões.
Passo 4 — Feito quando a spec está commitada e, na Completa, ele disse «avança»; na Padrão, quando o aviso saiu.
Passo 5 — Feito quando todas as faixas voltaram `concluido` e estão juntas, com a verificação completa verde.
Passo 6 — Feito quando nenhum Importante está aberto e cada verificação tem comando e saída. Uma verificação que saltou, não correu ou saiu com 0 sem testar nada conta como vermelha.
Passo 7 — Feito quando o commit de integração está onde a política do projeto manda e a mensagem final saiu no formato de «Entrega».

**Nível**

1. **Causa por descobrir?** Um defeito cuja causa ainda não se conhece, ou uma corrida a
   diagnosticar. Sim: complexa.
2. **Desenho que só aparece no código?** O contrato, o esquema ou o módulo só se decidem com uma
   experiência dentro do código. Sim: complexa.
3. **Passos por enumerar?** Um refactor tão acoplado que o brief não consegue escrever os passos.
   Sim: complexa.
4. **Já falhou?** Um agente falhou esta tarefa uma vez no nível bem-definida. Sim: complexa, e o
   brief novo leva a premissa que o agente devolveu (passo 5 da `agentic-implement`).

Passou nas quatro: **bem-definida**. Desenho novo, lógica delicada (dinheiro, concorrência, regras
de acesso) ou várias áreas não fazem a tarefa complexa quando o brief já os decidiu. Exemplos: um
rótulo; um arredondamento; uma faixa com spec e tarefas; a correção de um Importante que o
orquestrador reproduziu e cuja regra escreveu.

- Zona sensível (tenant, sessão, faturação, dados pessoais) não sobe o nível: o brief leva os
  invariantes e os testes de recusa, e a zona pesa no nível da revisão (`agentic-code-review`).

Escreve no brief a linha `nível:` com estes rótulos; a guarda do lançamento lê-a:

- `nível: bem-definida — decisões fechadas: <quais>`;
- `nível: complexa — <rótulo>: <detalhe>`, com o rótulo igual a uma das quatro perguntas, em
  minúsculas e sem «?»: `causa por descobrir`, `desenho que só aparece no código`,
  `passos por enumerar`, `já falhou`;
- o humano forçou o nível: `nível: <nível> — forçado pelo humano: <as palavras dele>`.

**Modelo** (nomes de exemplo; o projeto escolhe os seus)

| Nível | Claude | Codex |
|---|---|---|
| bem-definida | Sonnet 5.5, esforço xhigh | gpt-6.1-sol, esforço medium |
| complexa | Opus 5.5, esforço xhigh | gpt-6.1-sol, esforço max |

**Revisão**

```bash
node <agentic-code-review>/scripts/validar-relatorio.mjs <relatorio.md>   # 0 = conforme; 1 = lista do que falha
```

- Limite de rondas pelo nível (1 na Rápida pedida, 2 na Padrão, 3 na Completa). Da 2.ª em diante:
  só o diff novo, sem repetir achados fechados, e só as lentes com Importantes abertos, juntas.

- **No limite, com um Importante aberto, pára e vai ao humano** com um resumo (achados abertos,
  respostas, rondas, diff por rever, a tua recomendação). Nunca uma ronda extra em silêncio.
<!-- cartao:fim -->

As regras do repo ganham a esta skill: lê `AGENTS.md`/`CLAUDE.md`, a constituição
(`.specify/memory/constitution.md`) e as ADRs antes de aplicar o que está aqui, e usa os comandos
do projeto (`/ship`, `/deploy`, a bateria, o lançador de jobs) em vez dos genéricos.

`<skill>` é a pasta deste `SKILL.md`; os scripts correm a partir da raiz do repo do projeto. As
irmãs `agentic-project`, `agentic-design`, `agentic-implement`, `agentic-code-review` e
`agentic-architecture`, aqui `<agentic-project>`, `<agentic-design>`, `<agentic-implement>`,
`<agentic-code-review>` e `<agentic-architecture>`, são a primeira pasta com `SKILL.md` entre:
`$AGENTIC_PROJECT_DIR`, `$AGENTIC_DESIGN_DIR`, `$AGENTIC_IMPLEMENT_DIR`, `$AGENTIC_CODE_REVIEW_DIR`
ou `$AGENTIC_ARCHITECTURE_DIR`, se definida; `<skill>/../<nome>` (o caso normal: instalam-se
juntas, também no plugin); as pastas de skills do agente (`~/.claude/skills/`, `~/.agents/skills/`,
`~/.codex/skills/`, e `.claude/skills/` ou `.agents/skills/` no projeto); por fim o plugin
`agentic-skills` (`installPath` em `~/.claude/plugins/installed_plugins.json`). No plugin chamam-se
`agentic-skills:<nome>`; no Codex, `$<nome>`; sem a ferramenta Skill, lê o `SKILL.md` e segue-o.

## O circuito e as paragens do humano

| Passo | O quê | O humano |
|---|---|---|
| 0 | Triagem: Padrão ou Completa | lê a via numa linha e pode forçar outra |
| 1 | Leitura do código e pesquisa do mais atual | — |
| 2 | Grill da feature (com as perguntas de UI, se há UI) | **para: momento 1** |
| 3 | Variantes visuais (só UI, pela `agentic-design`) | **para: momento 2** |
| 4 | Spec, plano e tarefas | Completa: **para no gate, até ao «avança»**; Padrão: recebe a spec como aviso |
| 5 | Briefs e lançamento das faixas | só num lote mecânico: **para no playbook**, antes do lote (`references/implementacao.md` §4) |
| 6 | Revisão independente e verificação | — |
| 7 | Integração e entrega | só para uma ação irreversível |

Fora destas paragens, voltas ao humano só para uma **ação irreversível ou externa** (deploy de
produção, apagar ou migrar dados reais, pagar, enviar mensagens a pessoas reais, publicar,
force-push) ou para uma decisão nova que toca o produto (o que o utilizador vê ou consegue fazer),
dinheiro ou dados pessoais: com recomendação, antes de lançares as faixas que dependem dela (na
Completa, no gate). O resto decides tu, pela leitura menor e reversível, e registas com a origem
«omissão». Cada paragem diz onde estás: «passo N/7, à espera de <o quê>».

**Arranque.** Sem descrição («a próxima do backlog»), lê `ver itens` do quadro (ou
`docs/backlog.md`) e recomenda, numa pergunta, o 1.º item `backlog` sem dependências por fechar;
com um id de item, usa esse e não crias outro. Numa feature já começada (item `em-curso`,
`specs/NNN-*`, `leitura.md` ou `pesquisa.md`, ramos `agente/*` dela), mostra numa lista curta o que
existe e retoma no primeiro passo sem artefacto. A 1.ª mensagem diz a via e os passos numa linha e
começa a Leitura no mesmo turno, sem pedir licença.

## Quadro

O estado vive no quadro da `agentic-project`. Qual CLI correr e onde está o URL: «Fonte e cópias»
do `README.md` de `<agentic-project>/assets/quadro/`. Na primeira vez da sessão corre
`<cli> ajuda` e segue a sintaxe dele. Os comandos de cada transição estão na tabela «Quando
se atualiza» desse `README.md`; nesta skill:

- **início** (depois da triagem): o item passa a `em-curso` (pedido do chat: `pedido add` e
  `item add --estado em-curso`) e dás `agente sinal`, tu e cada faixa, de 30 em 30 min;
- **paragens** (momentos 1 e 2, gate): `decisao add … --item <id>`, fechada com `decisao set`; o
  **aviso** da Padrão é `evento nota`;
- **spec**: `item set <id> spec=<NNN-slug> tarefas.total=<M>`; **revisão**: `estado=em-revisao`;
  **fim**: `estado=integrado sha=<sha>`, `evento fim "<mini-retro>"` e `agente fim`.

Com quadro publicado (o URL do mesmo sítio) e a ferramenta ArtifactData (diferida:
ToolSearch `select:ArtifactData`), envias tu para o artefacto em cada transição e de 30 em 30 min,
pelos 4 passos de «Sincronizar» do mesmo `README.md`; sem ArtifactData, grava-se só no CLI e o
próximo orquestrador com essa ferramenta envia. Sem quadro (nem CLI, nem `node`), avisa uma vez e segue.

## Passo 0: triagem

Classifica com o pedido e uma olhadela ao código; a primeira regra que acertar ganha. A Leitura
(passo 1) confirma ou muda a via.

- **Correção** (o comportamento já existe e está errado), em qualquer zona: vai para a
  `agentic-fix`. Se corrigir pede comportamento que ainda não existe, é feature.
- **Grande demais** (qualquer um): destino vago («melhorar a agenda»); várias decisões de produto
  independentes; mais de ~20 tarefas ou de 3 faixas; não cabe numa sessão. Parte-se em fatias
  verticais, e cada fatia é uma feature nova: `references/grande-demais.md`.
- **Completa** (qualquer um): esquema da BD ou migração de dados existentes; permissões,
  autenticação, sessões ou isolamento entre clientes; dinheiro (pagamentos, faturação, preços);
  dados de saúde ou pessoais novos, ou partilhados de forma nova; integração externa (API de
  terceiros, webhooks, e-mail/SMS); ação irreversível para o utilizador final (o efeito sai do
  sistema ou não tem volta); contrato público usado por outros; ficheiros numa área `risco: alto`
  de `.agentic/areas.json`; mais de ~1 semana. → pesquisa com um subagente por eixo, Spec Kit
  completo, **gate** no passo 4 e revisão de segurança.
- **Padrão**: tudo o resto (um filtro, exportar o que o utilizador já vê, um ecrã de leitura,
  cancelar um registo seu com as regras de acesso que já existem). → pesquisa focada, Spec Kit
  leve, **aviso** no passo 4.

Na dúvida que envolve dados, dinheiro ou permissões (mudar quem pode fazer o quê; reutilizar a regra
de acesso que existe não conta), a via mais pesada; nas outras, a mais leve. A via acompanha o
trabalho: sobe quando aparece um critério da Completa (uma migração), desce quando o grill o tira (a
ação passa a ter «desfazer»). Uma lição `tipo: escapou` da mesma área nos últimos 30 dias (onde
fica: `<agentic-code-review>/references/aprendizagem.md`) sobe a via um nível, nunca acima da Completa.

Feito quando disseste numa linha a via e o critério que acertou (e cada mudança de via depois).

## Passo 1: leitura e pesquisa

**1a. Leitura.** Antes de qualquer pergunta ou plano, investiga pelo
`references/leitura-de-contexto.md` e escreve a Leitura com `assets/leitura.template.md`: factos
com `caminho:linha`, 3–6 sugestões com porquê e a abordagem recomendada. Os factos escrevem-se
já; as sugestões e a abordagem fecham-se depois da pesquisa, para ela as poder mudar.

**1b. Pesquisa.** Antes de recomendar, estuda como isto se faz hoje de melhor, pelo
`references/pesquisa-moderna.md`: os 3 eixos (a feature, o design e a técnica **na versão do
lockfile**), em fontes primárias e datadas, a partir do radar do projeto (`docs/radar.md`), com a
profundidade e o teto da via. A saída é o `pesquisa.md` ao lado da `leitura.md`, com um resumo de
≤ 4 linhas na Leitura; numa alteração trivial, só uma linha na Leitura, sem `pesquisa.md`. Nada se adota em silêncio: o que mexe numa decisão do projeto vira pergunta
do grill, e o que se adota aparece na linha «Pesquisa» do resumo da spec.

Feito quando a Leitura tem as sugestões e a abordagem fechadas, com a pesquisa citada. Mostra-a ao
humano no início do momento 1.

## Passo 2: grill da feature (momento 1)

É o único grill do circuito: os agentes das faixas não perguntam ao humano (passo 5).
Lê `references/perguntas.md` (banco de perguntas por dimensão, cada uma com o tipo de
recomendação a trazer) e, se a feature toca UI, `<agentic-design>/references/perguntas-de-ui.md`
(bloco obrigatório; as respostas são o que passas à `agentic-design` no passo 3).
Se a Leitura viu que não há `.specify/`, junta a pergunta «inicializo o Spec Kit?» (passo 4).

Feito quando a fronteira está vazia (não quando acaba a lista) e mostraste a tabela das decisões.

## Passo 3: variantes visuais (momento 2, só UI)

O método de UI é da skill irmã `agentic-design`, no modo «variantes»: invoca-a com a ferramenta
Skill (no plugin, `agentic-skills:agentic-design`) ou, sem ela, lê `<agentic-design>/SKILL.md` e
segue-o. As regras dela (bloqueios, procedimento, capturas e detetor) não se repetem aqui.

- **O que lhe passas**: a Leitura; as respostas do bloco de UI do momento 1 (ação principal,
  estados, resoluções-alvo, temas, quantidade de dados medida); os ecrãs vizinhos e as capturas
  que a Leitura tirou; o `DESIGN.md` ou a skill do design system do projeto; a via (na Padrão, as
  variantes mostram-se só na resolução e no tema principais); a base git; e a pasta onde ela
  grava, temporária da sessão e fora do repo até a spec existir.
- **O que volta**: 2–3 variantes estruturalmente diferentes, com as capturas lado a lado, a
  saída do detetor de cada uma (sai 0), a crítica independente (ou «não independente»), a
  recomendação com o porquê, o que cada uma sacrifica e o `escolha.md` por preencher.
- **O que fazes com isso**: mostras ao humano e registas `decisao add` no quadro (é o momento
  2). A escolha (dele, ou delegada com «escolhe tu») vai para o `escolha.md`. Depois do
  `speckit-specify`, moves a pasta para `specs/<NNN-slug>/variantes/`; a spec cita o
  `escolha.md` e o passo 6 compara com estas capturas. O protótipo na rota, se houve, fica até ao
  fim do passo 6 e nunca se integra.

Porquê variantes e não descrições: as pessoas reconhecem o que querem quando o veem, e uma
descrição esconde os problemas de densidade e hierarquia que uma captura mostra.

Sem a `agentic-design` (nenhuma das pastas de cima tem `SKILL.md`): di-lo numa linha, com o
comando de instalação. O momento 2 faz-se com capturas do que construíres, e a prova de UI fica
«não verificada» em «Precisa de ti», nunca «limpa».

## Passo 4: spec, plano e tarefas

Lê `references/spec-kit.md`. Com Spec Kit: `speckit-specify` → `speckit-clarify` (Completa, ou se
ficou ambiguidade) → `speckit-plan` → `speckit-tasks` → `speckit-analyze` (zero CRITICAL); na
Completa também `speckit-checklist` de segurança (e de UX se há UI). Sem `.specify/`, segue a
resposta do momento 1: inicializar, ou `assets/spec-leve.template.md`.

Escreve o **resumo da spec** no formato de `spec-kit.md` (âmbito, decisões, pesquisa, riscos,
tarefas, plano de agentes, prova) e commita a spec, o plano e as tarefas: as faixas partem desse
commit. Depois, pela via:

- **Completa: gate.** Mostra o resumo e pede «avança». Nada de código de produção antes dele;
  depois dele, não voltas a pedir licença até à entrega.
- **Padrão: aviso.** Manda-lhe o resumo, o caminho da spec e como parar as faixas, e passa logo
  ao passo 5, sem esperar resposta. As faixas correm em ramos próprios e nada entra na `main`
  antes da revisão, por isso parar é só parar os agentes (`implementacao.md` §4, «Parar as
  faixas»): os ramos ficam, sem nada a desfazer. Se ele disser «para», paras as faixas e segues o
  que ele pedir.

**Só planear** («faz o planeamento desta feature»): em qualquer via, paras aqui, com a spec
commitada e o item `pronto` no quadro. Outra sessão retoma no passo 5; na Completa, só lança as
faixas com o «avança» do gate registado (`decisao set` no quadro).

Feito quando a spec está commitada e, na Completa, ele disse «avança»; na Padrão, quando o aviso
saiu.

## Passo 5: briefs e lançamento

Lê `references/implementacao.md`: faixas, worktrees e lote pelo §1–§2. O máximo ~3 em paralelo
é um teto de integração por feature, não da máquina; as dependentes correm em sequência.

1. **Brief**: um por faixa, de `assets/brief-agente.template.md`; testa-o pelo §3 da referência.
2. **Quem a faz**: por `<agentic-implement>/references/escolher-o-agente.md` §1–§3 (nível, modelo,
   esforço, agente). Uma faixa curta (§1) fazes tu, sem brief.
3. **Lançar**, pelo §4 desse ficheiro: subagente Claude ou job Codex pelo lançador; sem ele,
   `codex exec`. Cada faixa e job passa pelo script, se há: mede a máquina e verifica donos,
   âmbito e brief fechado. Carrega a `agentic-implement`.

Mais de 3 faixas parecidas num lote: uma piloto primeiro, revista por 1 revisor, e as classes dela
nos briefs das restantes; numa mudança mecânica, um script e um playbook (`implementacao.md` §4).

Segue «Enquanto correm» (§4): monitores ≥10 min, só acordam por fim, `bloqueado` ou decisão;
notícias juntas e um comando com poucas linhas de logs. Na spec commitada, faixas lançadas e
faixas juntas: compactação ou sessão nova com resumo, pelas instruções do `CLAUDE.md` do
utilizador ou do projeto. O modelo não corre `/compact`.

Com UI, carrega também a `agentic-design`, no modo «construir», com a prova dela. O brief aponta
para `<agentic-design>` (caminho absoluto), a variante e a base; com bloqueios, não está feita.

Brief ambíguo: `bloqueado: <pergunta>`; as outras seguem. Junta as perguntas: as técnicas e
reversíveis decides tu e relanças; as do humano vão numa só mensagem, com recomendação.

Recebe e junta pelo §5–§6 de `implementacao.md`; sem agentes, executas tu na forma curta do §4.

Feito quando todas as faixas voltaram `concluido` e estão juntas, com a verificação completa verde.

## Passo 6: revisão independente e verificação

Lê `references/revisao-e-entrega.md`. A revisão é da skill irmã `agentic-code-review`: invoca-a
com a ferramenta Skill (no plugin, `agentic-skills:agentic-code-review`) ou, sem ela, lê
`<agentic-code-review>/SKILL.md` e segue-o. O nível da revisão, as lentes, o modelo, as rondas e o
teto são dela; a via da feature é o de partida. Corre com as faixas juntas e verdes no ramo da
feature, e de novo em cada ronda, depois das correções.

- **O que lhe entregas**: a via e porquê, a base e o SHA revisto, a spec, o plano, a Pesquisa
  aprovada e, com UI, a variante escolhida, as capturas e o caminho de `<agentic-design>`: a
  lente UI aplica o modo «rever» dela (detetor e checklist do `ui-sem-slop.md` §5). A lista
  completa está em `revisao-e-entrega.md`, «Revisão». Volta um relatório com Importantes, Nits e
  Pré-existentes, cada um com `ficheiro:linha`.
- **O que fazes com o que volta**: o da mesma secção. Cada Importante é reproduzido antes de
  corrigido, num brief novo pelo passo 5; no limite de rondas com um Importante aberto, vais ao
  humano: a feature não está feita.

Sem a `agentic-code-review` (nenhuma das pastas de cima tem `SKILL.md`): di-lo numa linha, com a
instalação destas skills, e a revisão fica «por fazer» em «Precisa de ti», nunca «feita».

Depois a verificação de verdade: testes, typecheck, a bateria do projeto e o caminho de ponta a
ponta. Para UI, a prova do modo «rever» da `agentic-design`: capturas reais dos estados
combinados no passo 2, nos temas do projeto, comparadas com a variante escolhida, e o detetor a
sair 0 nas linhas do diff. Confere a lista de armadilhas de `revisao-e-entrega.md`.

Feito quando nenhum Importante está aberto e cada verificação tem comando e saída. Uma verificação
que saltou, não correu ou saiu com 0 sem testar nada conta como vermelha.

## Passo 7: integração e entrega

Segue «Entrega» de `revisao-e-entrega.md`: o radar, o **commit de integração** (o que junta a
feature à `main`, com `Risco:`, `Como desfazer:` e `Revisão:` no corpo), o push e o deploy pela
política do projeto (o de produção só com OK explícito), o quadro, a mini-retro e, quando algo
escapou ou uma classe se repetiu, a linha de lição no sítio e no formato de
`<agentic-code-review>/references/aprendizagem.md`.

O que as faixas viram e não mexeram vai para o quadro como `backlog`, não para este diff.

Feito quando o commit de integração está onde a política do projeto manda e a mensagem final saiu
no formato de «Entrega».

## Noutros agentes

Os passos e as paragens são os mesmos; muda a ferramenta, e a troca diz-se numa linha:
- **Sem AskUserQuestion**: as perguntas vão no chat, como diz o ponto 4 de `perguntas.md`.
- **Sem subagentes**: a leitura, a pesquisa por eixo e as faixas fazem-se em sequência
  (`implementacao.md` §4); a revisão segue «Noutros agentes» da `agentic-code-review`.
- **Codex a orquestrar** (sandbox `workspace-write`, com o `.git` só de leitura): no momento 1,
  pede ao humano que aprove os comandos git para a sessão, ou `codex --sandbox
  danger-full-access` (só com OK dele); sem isso, as faixas correm na forma curta.

## Skills de terceiros

| Skill | Como se usa | Se não existir |
|---|---|---|
| `mattpocock-skills:grilling`, `:prototype`, `:domain-modeling`, `:research` | ferramenta Skill | método resumido nas referências desta skill |
| `to-tickets`, `wayfinder`, `retro` (mattpocock) | só o utilizador invoca: lê o SKILL.md e aplica, ou sugere `/<nome>` | `references/grande-demais.md`; `assets/retro.template.md` |
| `simplify` (Claude Code) | pelo autor, no fim da faixa, com o alvo `<base>...HEAD` (se só revê o diff atual, num worktree descartável com `git reset --soft <base>`) | a mudança mínima da `agentic-implement` (passo 4) |
| `agentic-design` (irmã) | passos 2 (perguntas de UI), 3 (variantes), 5 (faixas de UI) e 6 (lente UI e prova): ferramenta Skill, ou lê o `SKILL.md` dela | di-lo numa linha; a UI fica «não verificada» em «Precisa de ti» |
| `agentic-implement`, `agentic-fix`, `agentic-architecture` (irmãs) | `agentic-implement`: os agentes de cada faixa carregam-na; `agentic-fix`: correções; `agentic-architecture`: o vocabulário do desenho no passo 4 (`<agentic-architecture>/references/vocabulario.md`; o `mattpocock-skills:codebase-design`, se instalado, é a mesma fonte em inglês) e os pedidos de aprofundamento que ela entrega | di-lo numa linha: instalam-se juntas com esta skill |
| `speckit-*` | as do repo-alvo (`spec-kit.md`, «Que speckit-* usar») | `assets/spec-leve.template.md` |

Instalação (diz ao humano; não instales sem OK): `/plugin marketplace add mattpocock/skills` e
`/plugin install mattpocock-skills@mattpocock`; Spec Kit:
`uv tool install --force specify-cli --from git+https://github.com/github/spec-kit.git@v1.2.0`.

## Referências: quando ler cada uma

Cada referência desta skill lê-se no passo que a aponta. Além delas:
- `references/instantaneo-<aaaa-mm>.md`: passo 1b, eixo técnico (linguagem e frameworks), como
  ponto de partida a re-verificar. Usa o mais recente e não o leias depois do «Válido até». O da
  plataforma web (CSS, HTML, acessibilidade, desempenho) é da `agentic-design`:
  `<agentic-design>/references/plataforma-web-<aaaa-mm>.md`.
- `<agentic-design>`: passo 2 (`<agentic-design>/references/perguntas-de-ui.md`), passo 3 (modo
  «variantes»), passo 5 (modo «construir», nas faixas de UI) e passo 6 (modo «rever» e prova).
- `references/revisao-e-entrega.md`, «Armadilhas»: sempre que escreveres ou avaliares testes.
- `assets/`: modelos para copiar e preencher (Leitura, brief do agente, spec leve, retro). O brief
  do revisor e o relatório da revisão são da `agentic-code-review`.
