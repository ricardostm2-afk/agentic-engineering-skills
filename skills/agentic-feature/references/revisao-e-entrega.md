# Verificação e entrega (passos 6 e 7)

A revisão independente do passo 6 é da skill irmã `agentic-code-review`
(`<agentic-code-review>/SKILL.md`, procurada como no `SKILL.md`): o nível e as lentes, os
modelos e o teto, a consolidação e a confirmação, as etiquetas e a prova, as respostas e as
rondas, os commits depois do SHA revisto e o rebase, o «como desfazer» e a linha `Revisão:`
(`<agentic-code-review>/references/painel-e-rondas.md`). Aqui fica só o que é da feature: o que
entregas à revisão e o que fazes com o que volta, a verificação, as armadilhas e a entrega.

## Revisão: o que entregas e o que fazes com o que volta

1. **O pedido** (o ponto fixo dela, `painel-e-rondas.md` §1):
   - a via da feature e porquê: é o nível de partida, que ela confere contra o diff de cada
     ronda e pode subir (nunca acima da Completa; o planeamento já feito não se refaz);
   - a base (o SHA antes do commit de preparação) e o SHA revisto (o HEAD que vais integrar);
   - os caminhos da spec, do plano e da Pesquisa aprovada (a linha «Pesquisa» do resumo da
     spec e o `pesquisa.md`, ou, numa alteração trivial, a linha da Leitura: a lente normas
     confere contra ela as dependências e os padrões novos);
   - com UI, `variantes/escolha.md`, as capturas da variante escolhida e o caminho absoluto de
     `<agentic-design>`, para a lente UI (modo «rever» da `agentic-design`);
   - da 2.ª ronda em diante, os achados fechados e a resposta de cada um.
2. **Cada Importante que volta** corrige-se pelo passo 5 (um brief novo para um agente com a
   `agentic-implement`, ou a forma curta de `implementacao.md` §4), depois de reproduzido
   (`painel-e-rondas.md` §6). Não reproduzido não se corrige: a resposta é «errado: não
   reproduzido», com a tentativa. Cada Importante fica com uma resposta (§8 de lá) antes da
   entrega; um de segurança sem resposta deixa a feature por fazer.
3. **O teste de aceitação do revisor** (lente spec), que só tem ficheiro na Completa
   (`<agentic-code-review>/references/painel-e-rondas.md` §3), integra-o o autor, sem alterações,
   antes da ronda seguinte ou antes de integrar em `main`. Se falha, é um Importante.
4. **Direção** (um achado que contesta a abordagem do resumo da spec): não se corrige na
   revisão. Vai ao humano em «Precisa de ti» se toca o produto, ou para o backlog se é técnico.
5. **Pré-existentes**: a linha do relatório passa à retro; não vão para o backlog nem se
   corrigem de passagem.
6. **No limite de rondas** com um Importante aberto, a revisão pára e vai ao humano com o resumo
   dela: a feature não está feita até ele decidir (repensar a abordagem, partir a tarefa,
   aceitar com motivo).

## Verificação

Depois da revisão e das correções, no ramo integrado:

1. **`speckit-converge`** (com Spec Kit): compara o código com spec/plano/tarefas e acrescenta o
   que ficou por construir. Tarefas novas → voltam ao passo 5. Sem Spec Kit, faz a mesma
   comparação à mão contra a spec leve.
2. **Bateria**: os testes, o typecheck, o lint e a bateria/CI local do projeto, com os comandos do
   `AGENTS.md`. Testes saltados contam: «120 passaram, 14 saltados por falta de BD» não é verde.
3. **Ponta a ponta**: o caminho do utilizador do princípio ao fim, contra a aplicação a correr
   (pedido HTTP real, ou o browser no ecrã real), não só os serviços em separado.
4. **UI**: a prova do modo «rever» da `agentic-design` (`<agentic-design>/references/prova.md`):
   capturas reais da aplicação a correr nos estados combinados no passo 2 (com dados, vazio, a
   carregar, erro, sem permissão, muitos dados), nas resoluções-alvo e nos temas do projeto,
   comparadas com a variante escolhida; o detetor volta a correr depois das correções e sai 0
   nas linhas do diff. Diferenças não combinadas são achados. Testa também com teclado e com a
   resolução mais pequena.
5. **Lista de armadilhas** (abaixo): passa cada linha.

Formato da prova, para o quadro e para a mensagem final:

```
$ <comando>
<linhas finais da saída com o resumo>
saída=<código>
```

## Armadilhas de código escrito por agentes

Cada linha: a armadilha → como esta skill a evita. Passa-as na revisão e sempre que escreveres ou
avaliares testes.

1. **Medir antes de planear**: planos que propunham construir o que já existia → a Leitura do
   contexto vem antes de qualquer plano, com caminhos de ficheiro; as sugestões «Reutilizar» e
   «Ligação em falta» são obrigatórias de procurar.
2. **O teste do autor herda o erro do autor**: quem escreve a consulta errada escreve o teste que a
   aceita → o revisor independente confirma os testes e traz um teste de aceitação seu,
   escrito a partir da spec (`<agentic-code-review>/references/painel-e-rondas.md` §3).
3. **Provar a primitiva não prova a ligação**: o motor está testado, mas a rota não o chama, ou o
   ecrã não chega à rota → pelo menos um teste de ponta a ponta atravessa o caminho real (gesto ou
   pedido → rota → motor → efeito observado), e falha se se desligar a ligação.
4. **Construído e inalcançável**: a feature existe e nenhum utilizador lá consegue chegar → a
   porta de entrada é pergunta obrigatória no grill e tarefa explícita no plano; a verificação
   começa no sítio de onde o utilizador parte, não no URL da feature.
5. **Recolhido e ignorado**: o ecrã pede um dado, diz «guardado», e nada o lê → cada dado novo tem
   um consumidor nomeado (grill, brief, relatório do agente) e um teste que grava pelo gesto real e
   observa o efeito.
6. **A fixture ou o mock substitui a escrita**: o teste insere à mão o valor que o código devia
   calcular, e nunca pode discordar da produção → pelo menos um teste contra a dependência real
   (BD real), com os dados produzidos pelo caminho de escrita real.
7. **Guarda que salta com saída 0 falha aberta**: um teste ou script que encontra problemas (ou
   salta por falta de BD/variável) e sai com 0 → as verificações falham fechadas: skip conta como
   falha; código de saída medido sem pipe; cada guarda nova é provada a recusar (introduzir o
   defeito, ver vermelho, repor, ver verde).
8. **Commit que afirma o que não contém**: a mensagem descreve trabalho que ficou fora do commit
   ou noutro ficheiro → antes do push, confere a mensagem com `git show --stat <sha>` e com o diff;
   `git add` só dos ficheiros que mudaste.
9. **Timeouts sem folga e processos órfãos penduram a suite**: um tempo limite ajustado ao valor
   medido numa máquina rápida, ou um servidor/browser lançado por um teste que fica vivo → a regra
   é a de `<agentic-implement>/references/testes.md` («Tempos limite e processos filhos»); na
   revisão, confere-a no diff e corre a suite duas vezes seguidas sem pendurar.
10. **Default não-nulo esconde a consulta errada**: a coluna lida tem um valor por omissão, a
    consulta lê o sítio errado e devolve um número plausível em vez de erro → dados de teste que
    distinguem o certo do errado (datas, clientes e valores diferentes entre si), e cada indicador
    observado duas vezes: sem o problema e com o problema semeado.

## Entrega (passo 7)

0. **Radar** (ver «Radar do projeto» em `pesquisa-moderna.md`): atualiza-o antes do commit final,
   no mesmo commit ou num commit `docs(radar): …` à parte, antes do push. Uma linha por resultado
   (usado, experimentado, rejeitado), com fonte e data. Entradas novas nunca entram diretamente em
   Adotar. Sem radar no projeto, não o cries: propõe-o em «Precisa de ti».
1. **Commits**: um assunto por commit; a mensagem diz o porquê (não só o quê) e a prova (comando e
   resultado). Nas vias Padrão e Completa, o corpo do commit de integração leva também `Risco:` (o
   que pode correr mal e para quem), `Como desfazer:` e `Revisão:`; os comandos do desfazer e o
   formato da linha `Revisão:` são os de `<agentic-code-review>/references/painel-e-rondas.md`
   §10. O **commit de integração** (passo 7) é o commit ou o merge que junta a feature à
   `main`: num ramo integrado com `--ff-only`, o último da feature (normalmente o de metadados
   depois do SHA revisto: radar, `Revisão:`); se o projeto integra com merge, o merge. Com PR,
   estas linhas vão na descrição do PR. É o único sítio onde vivem: a spec, a retro, o quadro e a
   mensagem final apontam para ele, não as copiam. O porquê vem do pedido, do grill ou da spec;
   se não o tens, escreve «a pedido de <quem>» em vez de inventar um motivo. Segue o formato de
   mensagens do projeto se existir.
2. **Conferir**: para cada commit novo, `git show --stat <sha>` bate com a mensagem? A árvore está
   limpa (`git status`)? Os worktrees e ramos temporários foram removidos, incluindo o ramo
   descartável do protótipo (nome em `variantes/escolha.md`)?
3. **Push** segundo a política do projeto. Trunk-based (por omissão): para `main` depois de verde,
   ramos curtos, nada fica sem push no fim da sessão. Se o projeto tem um comando próprio de
   entrega (`/ship` ou equivalente), usa-o.
4. **Deploy** só se a política do projeto o prevê para esta altura. Produção, migração de dados
   reais ou qualquer ação externa: pede OK explícito antes, com o que vai acontecer e como se
   desfaz. Usa o comando de deploy do projeto (`/deploy` ou equivalente), não um improvisado.
5. **Quadro**: `fim`, com o estado `integrado` (em `main`) ou `em-producao` (depois do deploy), os
   SHAs e a prova.
6. **Mini-retro**: preenche `assets/retro.template.md` (3–5 linhas) e grava-a no quadro (sem
   quadro, vai na mensagem final). Se a lição serve para outras features, propõe onde a guardar no
   projeto (nota de lições, `AGENTS.md`, uma verificação automática nova): uma regra que se pode
   verificar por máquina vale mais como verificação do que como texto.
   **Linha de lição**: escreve-a tu, no commit de metadados da feature que o descobre ou
   corrige, quando algo escapou (revertido, incidente, reportado pelo humano) ou quando a mesma
   classe aparece pela 2.ª vez numa revisão (procura-a com `git log --grep '<classe>'` e no sítio
   das lições). O sítio, o formato, o que quer dizer cada campo (`tipo`, `esperado`, `camada`) e
   como as linhas viram casos de avaliação do revisor:
   `<agentic-code-review>/references/aprendizagem.md`. Só `tipo: escapou` sobe a via na triagem.
   Sem sítio para elas no projeto, a linha vai para «Precisa de ti».
7. **Mensagem final ao humano**, curta:

```
Feito: <o que mudou, do ponto de vista do utilizador, 2–4 linhas>
Como verificar: <passos no ecrã ou comando>
Prova: <comandos principais e resultado, ou o link para o quadro>
Ficou de fora: <lista, com o que já está no backlog>
Risco, como desfazer e revisão: no corpo de <sha do commit de integração>, ou na descrição do PR (Padrão e Completa)
Não coberto pela prova: <o que as verificações não apanhariam: ecrã sem captura, integração real não chamada…, ou «nada»> (Padrão e Completa)
Precisa de ti: <OK de deploy, segredos, contas, entradas do radar a passar para Adotar, criar o radar… ou «nada»>
```
