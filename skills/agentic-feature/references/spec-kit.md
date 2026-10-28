# Spec, plano e tarefas (passo 4)

Transformar as decisões do grill e a variante escolhida em spec, plano e tarefas verificáveis, e
mostrar ao humano o resumo da spec: no gate da via Completa, onde ele dá o «avança», ou no aviso da
Padrão, com que as faixas arrancam logo.

## Com Spec Kit (`.specify/` existe no repo)

Corre as skills por esta ordem. Cada uma lê os artefactos da anterior a partir da pasta da feature
(`specs/<NNN-slug>/`, registada em `.specify/feature.json`).

**Que `speckit-*` usar.** As do repo-alvo, que são as da versão do Spec Kit dele. A ferramenta
Skill carrega as do projeto onde a sessão arrancou; se a sessão não arrancou no repo-alvo, ou a
lista de skills não mostra as que o `specify init` acabou de criar, lê
`<repo>/.claude/skills/speckit-<nome>/SKILL.md` ou, se não existir,
`<repo>/.agents/skills/speckit-<nome>/SKILL.md` (a integração `codex`, para os agentes que leem
`.agents/skills/`), e segue-a, correndo os scripts de `.specify/scripts/` que ela manda, a partir
da raiz do repo-alvo.

**Onde esta skill manda mais que as do Spec Kit** (são escritas para um humano ao lado; aqui o
humano só para no grill, nas variantes de UI e, na Completa, no gate):
- `speckit-analyze` diz para não alterar ficheiros e perguntar se se quer remediação: aqui
  corriges spec/plano/tarefas sem perguntar e voltas a correr o analyze.
- `speckit-checklist` não deixa o agente marcar `[x]` (as caixas são do revisor): não as
  marques. Avalias tu cada item no teu registo (cumprido / em falta, com o caminho) e o resumo
  vai ao gate, onde o humano é o revisor.
- `speckit-clarify` pergunta ao utilizador: aqui segue o ponto 2 abaixo.

1. **`speckit-specify`** com: a descrição da feature, a abordagem recomendada da Leitura, a tabela
   de decisões do grill (incluindo as delegadas), o que fica fora de âmbito, os estados de UI e a
   referência a `variantes/escolha.md`. Quanto mais decisões entrarem aqui, menos marcadores
   `[NEEDS CLARIFICATION]` sobram.
   - Logo a seguir, move a Leitura (`leitura.md`), a pesquisa (`pesquisa.md`) e a pasta
     `variantes/` para a pasta da feature, para que spec, plano, agentes e revisores as encontrem
     no mesmo sítio.
   - Ramo: se a extensão git do Spec Kit estiver ativa, este passo cria um ramo `NNN-slug`
     (o `specify init --integration claude` não a ativa por si). Sem extensão, segue a convenção
     de ramos do projeto; sem convenção, cria tu o ramo curto `NNN-slug` antes de escrever.
   - `.specify/feature.json` é estado local da máquina, ignorado pelo `.gitignore` do próprio
     Spec Kit: não o adiciones ao commit (o `git add` falha, e está certo).
2. **`speckit-clarify`** na via Completa, ou se a spec ficou com marcadores. Responde tu às
   perguntas que o registo do grill já responde (cita a decisão). Para as outras, aplica o
   critério do SKILL.md («O circuito e as paragens do humano»): produto, dinheiro, dados pessoais
   ou irreversível → vão ao humano com a tua recomendação (na Completa, no gate; na Padrão, antes
   de lançar as faixas que dependem delas); técnicas e reversíveis → decides tu e registas com
   origem «omissão».
3. **`speckit-plan`**: pede o desenho no vocabulário de
   `<agentic-architecture>/references/vocabulario.md` (módulos profundos: interface pequena,
   muito comportamento por trás; costuras onde os testes entram; um adaptador = costura
   hipotética, dois = real); o `mattpocock-skills:codebase-design`, se instalado, é a mesma fonte
   em inglês. Quando há uma decisão difícil de
   reverter ou um termo novo do domínio, regista uma ADR e atualiza o glossário com
   `mattpocock-skills:domain-modeling`.
   Passa-lhe o `pesquisa.md` como fase 0 já feita: cada linha adotada ou decidida no grill vira
   Decisão / Fundamento / Alternativas no `research.md`, com a fonte. O plan só pesquisa as
   incógnitas novas do Technical Context, com as regras de `pesquisa-moderna.md` (fonte e data,
   filtro de moda) e um teto próprio, contado à parte do 1b: no total, até 2 pesquisas e 3
   páginas na Padrão, até 3 pesquisas e 5 páginas na Completa.
4. **`speckit-tasks`**: pede explicitamente (o Spec Kit só gera tarefas de teste quando lhe pedem):
   - tarefas por comportamento, cada uma com o teste e a implementação juntos (o ciclo vermelho →
     verde vive dentro da tarefa); nada de «T002 todos os testes» seguido de «T003 implementar»,
     que é o anti-padrão «Fatias horizontais» da `agentic-implement`
     (`<agentic-implement>/references/testes.md`). Se o tasks.md sair assim, junta as tarefas antes
     do resumo da spec;
   - pelo menos um teste de aceitação de ponta a ponta (do gesto do utilizador ao efeito) e um
     contra a dependência real (BD real, não mock);
   - caminhos de ficheiros em cada tarefa;
   - `[P]` só quando não partilha ficheiros nem depende de tarefas por fazer;
   - critério de verificação em cada tarefa (comando ou observação);
   - uma tarefa de «porta de entrada» se há UI (o utilizador consegue lá chegar).
5. **`speckit-analyze`**: verificação automática. Zero CRITICAL para avançar; corrige
   spec/plano/tarefas e volta a correr até lá. HIGH: corrige ou justifica no resumo da spec.
6. **Via Completa**: `speckit-checklist` de segurança (permissões, isolamento entre clientes,
   validação de entrada, segredos, registo sem dados pessoais) e, se há UI, de UX (estados,
   acessibilidade, responsivo, e os itens da checklist de
   `<agentic-design>/references/ui-sem-slop.md` §5). Avalias tu os
   itens (ver acima: sem marcar caixas); os que estão por cumprir viram tarefas ou riscos no gate.
7. **Commit** da spec, do plano e das tarefas (e da Leitura, da pesquisa e das variantes movidas):
   os worktrees das faixas partem deste commit, e o brief aponta para estes caminhos.

Não uses `speckit-implement` para a implementação: o passo 5 desta skill reparte as tarefas por
agentes em worktrees, o que o `speckit-implement` não faz. Os agentes marcam as tarefas como
feitas (`[X]`) no `tasks.md`. `speckit-converge` usa-se no passo 6.
Não uses `speckit-taskstoissues` (descontinuado), mesmo que o `specify init` o tenha instalado.

## Sem Spec Kit

Se `.specify/` não existe, a pergunta «inicializo o Spec Kit?» entra no momento 1 (com a
recomendação: sim, se o projeto vai ter mais features; não, para um repo pequeno ou de vida curta).

- **Sim**: com a árvore limpa (`git status` sem alterações),
  `specify init --here --force --non-interactive --integration claude`. Depois `git diff` e
  `git status`: o `--force` pode reescrever `.specify/scripts`, `.specify/templates` e mexer em
  `.claude/settings.json`; repõe o que o projeto já tinha. Se outro agente que lê
  `.agents/skills/` vai trabalhar no repo (Codex, Cursor, Gemini, Copilot, OpenCode), junta
  `specify integration install codex` (cria `.agents/skills/speckit-*`; a integração por
  omissão continua a do Claude). Apaga `speckit-taskstoissues/` nas duas pastas. Commit à parte,
  só com o Spec Kit (`.specify/` e as `speckit-*` de cada pasta).
  Sem constituição, corre `speckit-constitution` com as regras do `AGENTS.md`/`CLAUDE.md` do
  projeto (não princípios genéricos). Se o repo não tem nenhum dos dois, deriva os princípios do
  que o código já pratica (estilo, testes, dependências, estrutura), cada um com `caminho:linha`,
  e lista-os no resumo da spec como decisões tuas, para o humano os poder corrigir.
- **Não**: copia `assets/spec-leve.template.md` para a pasta de specs do projeto (ex.:
  `specs/<NNN-slug>/spec.md`, ou `docs/features/` se é essa a convenção) e preenche-a. Faz tu a
  análise que o `speckit-analyze` faria: cada requisito tem pelo menos uma tarefa; cada tarefa
  serve um requisito; nenhuma contradiz as regras do projeto.

## Resumo da spec: gate (Completa) ou aviso (Padrão)

O mesmo resumo, curto, nas duas vias.

```
Feature: <nome> — via <via>
Spec: <caminho>

Âmbito: <3–5 linhas do que fica a funcionar, do ponto de vista do utilizador>
Fora de âmbito: <lista curta>
Decisões: <n> (do humano <a>, delegadas <b>, minhas por omissão <c>) — <caminho da tabela>
Decisões novas que preciso de ti: <0 ou a lista, cada uma com a recomendação>
Pesquisa: adotado <lista curta, um achado por item>; decidido no grill <n>; rejeitado <n> — <caminho do research.md ou da spec leve>
Riscos: <só os reais, cada um com a mitigação e como se desfaz>
Tarefas: <n>, em <k> faixas (<p> em paralelo, <s> em sequência)
Plano de agentes: <faixa → o que faz → ficheiros principais → Claude ou Codex, nível>
Prova de que está feito: <comandos e capturas que vão mostrar que funciona>
Depois da entrega precisa do teu OK: <deploy de produção, migração de dados reais… ou «nada»>
Para parar (só no aviso): <«diz "para"»: paro os agentes; os ramos ficam e nada entrou na main>
```

- **Gate (Completa)**: pede a decisão, com as opções «Avança» (recomendado, se não há decisões
  novas), «Ajusta <o quê>» e «Para». Se há decisões novas, pergunta-as primeiro no mesmo momento,
  uma por pergunta, com recomendação. Não há código de produção antes do «avança»; depois dele, o
  próximo contacto com o humano é a entrega ou uma ação irreversível.
- **Aviso (Padrão)**: manda o resumo, com o caminho da spec e a linha «Para parar», e lança as
  faixas no mesmo turno, sem esperar. Uma decisão nova do humano vai numa pergunta à parte, e só
  as faixas que dependem dela esperam pela resposta. Se ele disser «para», paras as faixas como
  diz `implementacao.md` §4 («Parar as faixas»).
