<cabeçalho do lançador de jobs do projeto, se ele o exige>

<!--
Para quem orquestra (apaga este bloco ao preencher):
- Este texto é o prompt do agente, subagente ou job. Leva só valores da faixa e apontadores.
- Usa o cabeçalho e o título que o lançador exige. Campos já no cabeçalho: «os do cabeçalho».
  Sem cabeçalho, apaga a primeira linha.
- Regras do lançador: se o projeto tem regras que vão por cima de cada job, o prompt é essas
  regras mais este brief, por apontador; não copies regras comuns.
- Preenche cada campo; apaga os opcionais sem uso. Sem «<…>», «a definir» ou opções por fechar.
- Num job sem subagentes, o brief não pede faixas, painéis nem verificadores: §4 de
  escolher-o-agente.md da agentic-implement.
- O nível vem do §1 de escolher-o-agente.md da agentic-implement, com os rótulos da linha `nível:`
  tal e qual (a guarda do lançamento lê-a). A ordem leva as palavras do
  humano, ou «nenhuma»; usa o mecanismo do lançador quando ele regista a ordem.
- Sem UI, apaga o bloco «UI». Com UI, os estados e larguras vão na tabela de tarefas.
- Num refactor, a coluna «Teste vermelho na base» leva o comando que fixa o comportamento
  (testes.md da agentic-implement, «Refactor»).
-->

<título da faixa: «# Faixa <letra ou nome> · <feature>», ou o formato do lançador, como «## Tarefa <n> — <nome>»>

nível: <bem-definida — decisões fechadas: <quais> | complexa — <causa por descobrir|desenho que só aparece no código|passos por enumerar|já falhou>: <detalhe> | <nível> — forçado pelo humano: <as palavras dele>>

ordem do humano: <palavras exatas, ou «nenhuma»>

Carrega a `agentic-implement` (no Codex, `$agentic-implement`). O processo, os limites e a entrega
são os dela. Regras do projeto: `<caminho/AGENTS.md ou CLAUDE.md>` · regras do lançador:
`<caminho, ou nenhuma>` · normas da área e revisão: `<apontadores, ou nenhuma>`.

Spec `<caminho/spec.md>` · plano `<caminho/plan.md>` · tarefas `<caminho/tasks.md>` · lote
`<caminho/lote.md, grupo desta faixa>`.

## Objetivo

<Uma frase verificável: o que passa a ser verdade e o papel desta faixa no todo.>

## Base e worktree

Worktree `<caminho absoluto>` · ramo `<ramo>` · base `<SHA completo>` · área `<id, ou sem mapa>`.
Preparado: <dependências e artefactos disponíveis> · arranque em falta: `<comando, ou nenhum>`.

## Ficheiros e caminhos

Caminhos autorizados: <caminhos ou globs>.
Interface combinada: <apontador para o contrato, ou nenhuma>.

Antes de trocar markup, faz `git grep` dos seletores e nomes que os testes leem. Confirma os
consumidores e os testes afetados antes de editar; se exigem caminhos fora destes, assinala o
bloqueio ao orquestrador.

## Comportamento e prova

| Tarefa | Costura (onde o teste entra) | Comportamento esperado | Teste vermelho na base |
|---|---|---|---|
| <id> | <rota, função, ecrã> | <resultado e dados que distinguem o certo do errado> | <ficheiro, falha e motivo> |

Classes a prevenir, aprendidas na piloto: <classes e provas aplicáveis, ou não se aplica>.

## Critério de feito

<Condições verificáveis específicas desta faixa, incluindo a ligação à dependência real quando aplica.>

| Comando | Saída esperada |
|---|---|
| <teste focado> | <n testes, 0 falhas> |
| <typecheck ou lint da área> | <saída 0> |

## Decisões da faixa

Pesquisa aprovada: <apontador e decisões aplicáveis, ou nenhuma>.
Dependências e capacidades aprovadas: <nomes e versões, ou nenhuma>.
Limites específicos: <apontadores para as secções do projeto que tocam esta faixa>.

## UI

Carrega a `agentic-design` (`<caminho absoluto>`; no Codex, `$agentic-design`), modo «construir».
Sistema de design: `<apontador>` · variante: `<escolha.md e capturas>`.
Estados e larguras: <os da tabela de tarefas, ou apontador>.
Comando do detetor: `node <agentic-design>/scripts/detetar-slop.mjs --diff <SHA da base>`.
A prova segue o modo «construir» da skill.

## Entrega

Handoff da `agentic-implement` (passo 8), com **Desvios do brief**, **Dados novos e quem os lê** e
**Vi e não mexi**.

## Quadro

Subagentes e jobs gravam só no CLI. Só o orquestrador envia ao artefacto.

Escolhe o caso pela forma como esta faixa é lançada e apaga o outro. Com «sem quadro», apaga a
secção.

**A faixa vai por um lançador que regista cada job no quadro**: o agente não se regista; preenche
as linhas que esse lançador lê:

item: <id>

**Senão** (um subagente, ou um lançador que não regista), o agente regista-se como diz o `README.md`
ao lado do CLI: CLI `<caminho, ou sem quadro>` · item `<id>` · agente `<id desta faixa>`.
Transições: tabela «Quando se atualiza» desse README (`agente sinal`, commits e fim).
