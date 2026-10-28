---
name: agentic-fix
description: >-
  Usa-a para corrigir o que já existe e está errado, mesmo sem dizer «bug»: «está partido»,
  «corrige isto», «não funciona», «dá erro», um report do humano com um ecrã ou um passo, um teste
  vermelho, um incidente, «fix this», «debug this». Reproduz com um teste vermelho, encontra a
  causa raiz quando é desconhecida, procura a classe do defeito, corrige o mínimo em todas as
  instâncias, prova com vermelho e depois verde e revê com contexto novo. Funcionalidade nova, ou
  comportamento que ainda não existe, é da agentic-feature.
---

# agentic-fix

Corrigir o que existe e está errado, com prova. O comportamento já existe: o defeito é a distância
entre o que ele faz e o que devia fazer. Uma funcionalidade nova é da `agentic-feature`.

As regras do repo ganham a esta skill: lê `AGENTS.md`/`CLAUDE.md` (testes, git, áreas, zonas
sensíveis, integração).

`<skill>` é a pasta deste `SKILL.md`. As irmãs `<agentic-implement>`, `<agentic-code-review>` e
`<agentic-design>` são a primeira pasta com `SKILL.md` entre: `$AGENTIC_IMPLEMENT_DIR`,
`$AGENTIC_CODE_REVIEW_DIR` ou `$AGENTIC_DESIGN_DIR`, se definida; a pasta ao lado desta
(`<skill>/../<nome>`, o caso normal); a pasta de skills do agente; o plugin `agentic-skills`.

## Quem faz o quê

- **Orquestrador** (a sessão que recebeu o report): passos 1, 2, 6, 7 e 8.
- **Agente da correção** (subagente Claude ou job Codex, lançado no passo 2): passos 3 a 5, com a
  `agentic-implement` carregada. Se és esse agente, o brief di-lo; começa no passo 3.
- Numa correção curta (`<agentic-implement>/references/escolher-o-agente.md` §1), ou sem
  ferramenta de agentes, és tu o agente: fazes os passos todos, por ordem, sem brief.

## Passo 1: o report

Lê o report e o ecrã ou passo que ele aponta. Trata só o que o humano apontou: o que encontrares à
volta vai numa linha da mensagem final. Num report de interface, o âmbito é o ecrã apontado: os
outros ecrãs com o mesmo padrão vão nessa linha, e alargar é decisão do humano, sem pergunta tua.

Report **ambíguo** (não dá para reproduzir sem adivinhar o que está errado ou o que devia
acontecer): faz **uma** pergunta, com a tua recomendação, e espera. Report claro: avança.

Feito quando consegues escrever numa frase o **sintoma** (o que acontece) e o **esperado** (o que
devia acontecer).

## Passo 2: o brief e o agente

Escolhe primeiro o nível, pelo §1 de `<agentic-implement>/references/escolher-o-agente.md`. Numa
**curta** não há brief nem agente: dizes o nível numa linha e fazes tu os passos 3 a 5, com a
`agentic-implement`. Nas outras:

1. Preenche `assets/brief-correcao.template.md`: sintoma, esperado, onde se vê, área, ficheiros
   prováveis, zona sensível (sim ou não), a ordem do humano (ou «nenhuma») e o critério de
   sucesso.
2. Escolhe o modelo e o agente (Claude ou Codex) pelo mesmo ficheiro e escreve o nível no brief.
3. Lança o agente num worktree próprio, com o brief e a ordem «carrega a `agentic-implement` e faz
   os passos 3 a 5 da `agentic-fix`», no modelo e esforço escolhidos. Claude: subagente. Codex: job
   com `$agentic-implement` e `$agentic-fix` no pedido.

Feito quando o agente está lançado com um brief que um agente sem esta conversa cumpriria sem
perguntar nada; numa curta, quando disseste o nível e começaste o passo 3.

## Passo 3: reproduzir (agente)

Constrói um ciclo **vermelho** antes de ler código para teorizar: um comando que percorre o caminho
real do defeito e falha com o sintoma do report. Por ordem de preferência:

1. teste no ponto de entrada que chega ao defeito (unitário, integração ou ponta a ponta);
2. script HTTP contra o servidor de desenvolvimento;
3. comando com uma fixture, a comparar a saída com uma referência boa;
4. browser headless que conduz a interface e verifica o DOM, a consola ou a rede;
5. um traço real capturado (pedido, payload, log), repetido isoladamente;
6. um harness mínimo que chama o caminho do defeito.

Num defeito visual, a prova é uma captura do ecrã que mostra o defeito, mais o teste que o
apanhar quando o houver; quanto capturar, antes e depois, diz `<agentic-design>/references/prova.md`
§2.

Aperta o ciclo até ficar **apertado**: segundos e não minutos, determinístico (hora, seed e rede
fixas), com a asserção no sintoma exato e não em «não rebentou». Defeito intermitente: sobe a taxa
de reprodução (repetir, paralelizar, estreitar janelas) até ser depurável.

Sem ciclo possível: devolve `bloqueado: <o que falta>`, com o que tentaste e o que pedes (acesso
ao ambiente, um artefacto capturado sem segredos, ou instrumentação temporária).

Feito quando há **um** comando, já corrido e com o output mostrado sem segredos, que fica
vermelho com este defeito e só com ele.

## Passo 4: causa e classe (agente)

- **Causa conhecida** (o vermelho aponta para a linha): segue para a classe.
- **Causa por descobrir**: segue `references/diagnostico.md` (minimizar, hipóteses falsificáveis,
  instrumentar uma de cada vez, e a evidência do git, dos PRs e dos logs).

Depois procura a **classe**: as outras instâncias do mesmo defeito (o mesmo padrão noutros
ficheiros) e os usos indiretos do que vais mudar (quem chama, enums, constantes, wrappers, nomes
montados em runtime, outros serviços). Cada instância entra na correção; cada uso indireto entra na
verificação. Num report de interface, a classe fica no ecrã apontado (passo 1).

Um defeito que já voltou depois de uma correção, ou cuja classe se espalha por muitos sítios, é
**estrutural**: a causa raiz é o mecanismo que o produz (o modelo de dados, o contrato, o
componente, o gerador), e mais um ajuste no sintoma (outra regra proibida, outro parâmetro, mais
texto num prompt) não conta como correção.

Feito quando escreves a causa raiz numa frase e a classe numa linha: `N instâncias: ficheiro:linha,
…`, ou `só esta`, com o comando de pesquisa que o mostra.

## Passo 5: corrigir e pôr verde (agente)

Segue os passos 3 a 8 da `agentic-implement`, com o que é próprio de uma correção:

- O teste vermelho é o do passo 3, no ponto de entrada que apanha o padrão real. Se o único teste
  possível é raso demais para o apanhar, regista-o no handoff: a arquitetura impede fixar o defeito.
- A mudança mínima corrige todas as instâncias da classe e mais nada.
- **Salvaguardas** (killswitch, flag marcada como permanente, caminho de mitigação, guarda de
  segurança): se a correção mexe numa, para antes de a mudar e pergunta. Num subagente ou job,
  devolve `estado: bloqueado: <a pergunta>` ao orquestrador, que a leva ao humano.
- Verde: o teste novo, o ciclo do passo 3 contra o cenário original (não só o minimizado) e os
  testes da área.
- Limpeza: a instrumentação temporária sai (marcada com um prefixo único, apaga-se com um grep) e
  os protótipos descartáveis também.
- O corpo do commit leva a causa raiz e `Testado:` (comandos e resultado); o risco e o desfazer
  vão no commit de integração (passo 7).

Feito quando o agente entrega `concluido` com o commit, o vermelho e depois o verde, e a classe
tratada; ou `bloqueado` ou `spec-em-conflito` com o porquê.

## Passo 6: revisão (orquestrador)

- **Zona sensível** (as do `REVIEW.md` do repo; sem ele: autenticação, permissões, dados de
  terceiros, dinheiro, migrações): painel da `agentic-code-review`.
- **Fora dela**: pede-a à `agentic-code-review` como «Rápida (pedida)»: um revisor de **contexto
  novo**, que não escreveu o código, com uma só lente, correção, e 1 ronda
  (`<agentic-code-review>/assets/brief-revisor.template.md`). Lê o diff contra o brief (sintoma,
  esperado e classe) e procura o que a correção parte. Se a `agentic-code-review` conferir pelo
  diff um nível mais alto (uma correção grande, um caminho sempre alto), vale o dela.

Os revisores contam para o teto de 8 agentes da `agentic-code-review`.

Cada Importante volta ao agente, que o reproduz antes de o corrigir; o que não reproduz não se
corrige.

Feito quando não há Importante aberto.

## Passo 7: integrar (orquestrador)

Integra pelas regras do repo (ramo, merge, bateria, deploy). A correção chega à integração com a
prova do passo 5 e a revisão do passo 6 fechada. O commit de integração leva `Risco:`,
`Como desfazer:` e `Revisão:`, como diz `<agentic-code-review>/references/painel-e-rondas.md` §10.

Feito quando o commit está onde as regras do repo mandam e o humano sabe onde.

## Passo 8: se escapou (orquestrador)

O defeito **escapou** quando chegou a produção, foi revertido ou foi reportado pelo humano depois
de entregue. Nesse caso, o teste do passo 3 fica como regressão permanente e o caso entra na
avaliação da revisão: uma linha de lição, no sítio e no formato de
`<agentic-code-review>/references/aprendizagem.md` («Onde fica»), que começa pelo `REVIEW.md` do
repo.

Feito quando a linha de lição está commitada nesse sítio (ou, sem ele, na mensagem final), ou
quando dizes numa linha porque o defeito não escapou.

## Mensagem final ao humano

Cinco linhas: **Corrigido** (sintoma e causa raiz) · **Classe** (quantas instâncias) · **Prova**
(o comando, vermelho e depois verde) · **Ficou de fora** (o que viste à volta) · **Precisa de ti**.

## Noutros agentes

No Codex: `$agentic-fix` e `$agentic-implement`. Sem ferramenta de subagentes, faz os passos em
sequência, sem worktrees; o revisor de contexto novo do passo 6 é uma sessão nova, e sem ela a
revisão declara-se «não independente», como na `agentic-code-review` («Noutros agentes»). Origem
do método e licenças: `references/origem.md`.
