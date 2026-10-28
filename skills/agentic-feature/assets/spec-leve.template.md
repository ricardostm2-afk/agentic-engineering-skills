# <NNN> · <nome da feature>

<!--
Spec + plano + tarefas num só ficheiro, para repos sem Spec Kit.
Guarda em specs/<NNN-slug>/spec.md (ou na pasta de specs do projeto).
Cada secção curta. Se uma secção não se aplica, escreve «não se aplica» e porquê.
-->

**Via**: <Padrão | Completa> · **Estado**: rascunho | aprovado no gate (Completa) ou avisado (Padrão) | integrado | em produção
**Leitura**: `<caminho para a Leitura>` · **Variante UI**: `<variantes/escolha.md ou «sem UI»>`

## 1. Spec (o quê e porquê, sem como)

**Problema**: <quem, o que não consegue fazer hoje, quanto custa>
**Resultado**: <o que passa a conseguir fazer, numa frase verificável>
**Porta de entrada**: <como o utilizador chega lá>

### Comportamento

<!-- Cenários em linguagem do utilizador. Cada um verificável. Inclui casos-limite combinados. -->

1. Dado <situação>, quando <ação>, então <resultado observável>.
2. …

### Dados

| Dado | Quem escreve | Quem lê | Guarda-se quanto tempo | Quem vê |
|---|---|---|---|---|

### Permissões

<quem faz, quem vê, o que vê quem não pode; onde é aplicada a recusa no servidor>

### Estados de UI (se há UI)

<vazio, a carregar, erro, sem permissão, muitos dados, sucesso: o que se vê em cada um>

### Fora de âmbito

- <corte> — <porquê>

### Decisões

| # | Decisão | Escolha | Origem (humano / delegada / omissão) |
|---|---|---|---|

### Como se mede o sucesso

<observação concreta e o teste de aceitação principal>

## 2. Plano (como)

**Módulos tocados**: <módulo → mudança → interface (o que os chamadores veem), nos termos de `<agentic-architecture>/references/vocabulario.md`>
**Costuras de teste**: <onde os testes entram e o que apanham>
**Migração**: <passos, reversibilidade, n.º de registos afetados, ou «nenhuma»>
**Riscos**: <risco → mitigação>
**ADR**: <caminho, se há decisão difícil de reverter, ou «nenhuma»>
**Pesquisa**: <linhas adotadas ou decididas: decisão · fonte (URL, publicado, lido) · alternativa rejeitada>, ou «nada mais simples: <onde procurei>»

## 3. Tarefas

<!--
Ordem = dependência. Uma tarefa por comportamento, com teste e implementação juntos (o ciclo
vermelho → verde vive dentro da tarefa); nada de uma tarefa «todos os testes» antes das outras.
[P] só se não partilha ficheiros nem depende de tarefas por fazer.
Inclui: um teste de aceitação de ponta a ponta, um teste contra a dependência real,
e a tarefa da porta de entrada se há UI.
-->

- [ ] T001 <tarefa> em `<caminho>` · verifica: `<comando ou observação>`
- [ ] T002 [P] <tarefa> em `<caminho>` · verifica: `<…>`

## 4. Análise (antes do resumo da spec)

- [ ] Cada cenário do §1 tem pelo menos uma tarefa que o prova.
- [ ] Cada tarefa serve um cenário ou um requisito do §1.
- [ ] Nenhuma tarefa contradiz `AGENTS.md`/constituição/ADRs.
- [ ] Cada dado novo tem quem o lê.
- [ ] Há tarefa de porta de entrada (se UI) e teste de ponta a ponta.
- [ ] Cada dependência nova e cada capacidade Newly ou Limited está na linha «Pesquisa».

## 5. Plano de agentes

| Faixa | Tarefas | Ficheiros | Paralela / depois de | Agente (Claude ou Codex, nível) |
|---|---|---|---|---|

## 6. Entrega

**Prova**: <comandos e saídas, capturas>
**Risco, como desfazer, revisão**: no corpo do commit de integração (o commit ou merge que junta a feature à `main`; com PR, na descrição do PR); não se copiam para aqui
**Não coberto pela prova**: <o que as verificações não apanhariam, ou «nada»>
**Commits**: <SHAs>
**Retro**: <3–5 linhas ou link para o quadro>
