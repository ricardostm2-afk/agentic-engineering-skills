---
name: agentic-implement
description: >-
  Usa-a sempre que fores o agente que escreve o código de uma tarefa com brief: subagente ou job
  lançado pela agentic-fix ou pela agentic-feature, «implementa este brief», «faz a faixa N»,
  «executa esta tarefa». Lê só o necessário, diz as suposições, escreve o teste vermelho primeiro,
  faz a mudança mínima ao jeito do código à volta, prova com verde, faz commit por causa e entrega
  com estado. O âmbito e o plano vêm do brief: decidi-los é da agentic-feature e da agentic-fix.
---

# agentic-implement

Do brief ao commit com prova. O brief já decidiu o quê: os ficheiros, o comportamento esperado e o
teste que o prova. Tu decides o como, dentro dele. Numa tarefa curta
(`references/escolher-o-agente.md` §1), quem orquestra usa esta skill sem brief: o brief é o
report ou o pedido, com o sintoma, o esperado e o critério de sucesso que já escreveu.

As regras do repo ganham a esta skill: `AGENTS.md`, o brief da área e as regras de testes e de git
do projeto.

As irmãs `<agentic-design>`, `<agentic-code-review>` e `<agentic-architecture>` são a primeira
pasta com `SKILL.md` entre: `$AGENTIC_DESIGN_DIR`, `$AGENTIC_CODE_REVIEW_DIR` ou
`$AGENTIC_ARCHITECTURE_DIR`, se definida; a pasta ao lado da desta skill (o caso normal); a pasta
de skills do agente; o plugin `agentic-skills`.

## 1. Ler só o necessário

Lê o brief inteiro, o `AGENTS.md`, o brief da área que o brief nomeia, os ficheiros que vais mudar
e quem os chama. Lê mais só quando uma pergunta concreta o pede.

Feito quando consegues nomear o ponto de entrada que o teste vai exercitar e cada ficheiro que vais
mudar.

## 2. Pensar antes de escrever

Antes de mudar código, escreve em poucas linhas:

- as **suposições** que fazes;
- o **critério de sucesso** como comando: `<comando>` fica verde;
- o **plano**, em passos, cada um com a sua verificação.

Se o brief admite duas leituras que dão comportamentos diferentes, ou pede algo que o código
desmente, devolve `bloqueado: <a pergunta exata>` com a tua recomendação: escolher em silêncio uma
das leituras é o defeito que este passo evita. Uma dúvida só de tamanho (fazer mais ou menos do
que a tarefa pede) não pára: segue a regra do brief, se a tiver; senão faz a leitura menor e
reversível e regista-a no handoff. Se vês uma solução mais simples do que a pedida, di-lo no
handoff e faz a pedida.

Feito quando o critério de sucesso é um comando que podes correr.

## 3. Teste primeiro

Escreve um teste que **falha na base**, na costura pública mais próxima do comportamento (o ponto
de entrada que um utilizador ou outro módulo usa), e não nos internos. O valor esperado vem de uma
fonte independente (o brief, um exemplo trabalhado, a spec), nunca do mesmo cálculo que o código
faz. Corre-o e vê-o vermelho pela razão certa. Costura, interface e módulo, aqui e no brief, têm o
sentido de `<agentic-architecture>/references/vocabulario.md`.

Trabalha em **cortes verticais**: um teste, a implementação mínima que o põe verde, depois o
seguinte. O que é um bom teste, os maus a evitar, os tempos limite e os processos filhos, e como
provar um vermelho forçado: `references/testes.md`. Numa tarefa de refactor (a estrutura muda, o
comportamento não), não há vermelho novo: segue «Refactor» de `references/testes.md`, que tem o seu
critério de feito.

Feito quando o teste corre vermelho e a falha mostra o comportamento em falta, e não um erro de
setup.

## 4. Mudança mínima

Escreve o mínimo que põe o teste verde, ao jeito do código à volta: os mesmos nomes, idiomas,
padrões e densidade de comentários. Cada linha mudada responde ao brief. Remove o que as tuas
mudanças deixaram sem uso; o código morto que já lá estava fica, e menciona-o no handoff.

Feito quando cada linha do diff se explica pelo brief.

## 5. Verde com prova

Corre o teste novo, os testes da área e o typecheck, com os comandos do brief ou do `AGENTS.md`.
Guarda cada comando e o seu resultado. Um teste saltado, uma base de dados em falta ou um setup que
devolve vazio contam como **vermelho**. Mede o código de saída do próprio comando, sem pipe. As
regras de prova do projeto, quando existem, ganham a esta lista.

**Duas falhas no mesmo gate.** Se duas tentativas falham o mesmo gate (o mesmo teste, o
typecheck, um hook) pela mesma razão, não tentes a terceira com a mesma ideia. Escreve numa frase
a premissa que as duas partilham, o que ambas davam por certo, e procura no código, no teste e no
brief o que a desmente. Se ela cai e a abordagem nova cabe no brief, segue e di-lo no handoff; se
não cabe, ou não encontras a premissa, devolve `bloqueado: premissa <a frase> — <o que viste>`,
com a tua recomendação.

**Código, spec ou teste.** Um vermelho que não sai pode ser do código, da spec ou do teste.
Antes de devolver `spec-em-conflito`, escreve as três hipóteses, cada uma com a prova que a
confirma ou desmente: o código (a linha que faz outra coisa), a spec (a frase ambígua, a que
contradiz outra, ou o código que a desmente) e o teste (a asserção que não segue a spec, ou o setup
que não chega ao caminho). O código errado corrige-se. Um teste teu que está errado corrige-se e
diz-se no handoff. A spec e os testes do projeto (um oráculo, uma guarda) não se mudam para ficar
verde: aí é `spec-em-conflito`, com as três hipóteses e as provas.

Feito quando tens, para cada comando, o output verde guardado.

## 6. Os gostos do utilizador

Aplica ao que tocaste os gostos do projeto, cada um na sua fonte:

- código e texto do produto: `references/gostos.md`;
- interface: o design system do projeto (o `AGENTS.md` diz qual) e
  `<agentic-design>/references/ui-sem-slop.md`, nas secções do modo «construir»
  (`<agentic-design>/SKILL.md` §5);
- o que é só deste projeto (vocabulário, stack): o `AGENTS.md`, que ganha aos outros dois.

Feito quando o diff cumpre cada gosto destas fontes que se aplica ao que mudaste.

## 7. Commit por causa

Um commit por causa, com `git add <caminhos>`. A mensagem diz o porquê e a prova. Corre os hooks
do repo e corrige o que reprovarem. Segue as regras de git do `AGENTS.md` (trailers, ramos,
comandos proibidos).

Os commits ficam no teu ramo; quem orquestra faz o push e integra, depois da revisão. Push, deploy
ou acesso à produção, só quando a linha `ordem do humano:` do brief o pede, e só nessa tarefa. É a
mesma regra para um subagente Claude e para um job Codex. Quando o lançador do job regista a ordem
e a junta ao prompt num bloco próprio, vale a ordem desse bloco, e só ela. Nunca `--no-verify`,
nunca reescrever o histórico (rebase, amend de um commit já partilhado, force-push).

Feito quando `git status --short` só mostra o que não é teu e `git show --stat` bate com a
mensagem.

## 8. Entregar

A última mensagem é o handoff: SHAs completos da base e do HEAD, ficheiros, comandos e
resultados, o que saltou e porquê, limitações e o que ficou por fazer; se o brief traz o formato
do relatório, segue-o. A última linha é o estado,
no formato de saídas do `AGENTS.md`; sem ele: `estado: concluido`, `estado: bloqueado: <motivo>`
ou `estado: spec-em-conflito: <o quê>` (depois de «Código, spec ou teste», passo 5).

Bloqueado a meio: commita o que está verde e entrega com o bloqueio; um teste vermelho nunca entra
num commit para marcar o que falta.

Feito quando a última linha é o estado.

## Noutros agentes

No Codex: `$agentic-implement`, ou o brief diz «carrega a agentic-implement». Quem lança o agente
(a `agentic-fix`, a `agentic-feature`) escolhe o nível, o modelo e o agente por
`references/escolher-o-agente.md`. Origem do método e licenças: `references/origem.md`.
