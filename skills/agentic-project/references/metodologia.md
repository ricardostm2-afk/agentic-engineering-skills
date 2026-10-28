# Metodologia de trabalho com agentes (fase 8)

Objetivo: o humano pensa nas decisões certas (produto, dinheiro, o irreversível) e só nessas; os
agentes fazem o resto, com prova. Usa este ficheiro para escrever `docs/metodologia.md` do
projeto, adaptado às decisões dele (as regras do projeto ganham a estas).

`docs/metodologia.md` descreve o **processo** (ciclo, papéis, «feito», armadilhas). Não repete
regras: para princípios aponta para a constituição, para regras duras para o `AGENTS.md`. Na
mesma fase cria `docs/licoes.md` só com o cabeçalho e uma linha a dizer o formato; é para lá que
vão as lições das retros.

`<agentic-feature>` e `<agentic-code-review>` são as pastas das skills irmãs (procura no
`SKILL.md`). No `docs/metodologia.md` do projeto escreve a cópia versionada (`.agentic/…`) quando
existe; senão o nome da skill, nunca um caminho da tua máquina.

## Ciclo

```
pedido → triagem (tamanho e risco) → agentic-feature (leitura → pesquisa do que há de mais atual → grill → … → revisão com a agentic-code-review) → integração contínua em main → entrega → retro curta
```

- **Triagem**: o esforço escala com o risco. Padrão (feature normal: spec leve); Completa (dados,
  permissões, pagamentos, saúde, integrações, áreas `risco: alto`, mais de 1 semana: spec
  completa + revisão de segurança); Grande demais (partir em fatias antes de começar). Hooks, CI
  e instaladores levam a lente de segurança e o verificador na revisão, sem subir o planeamento
  nem as rondas. Uma lição `tipo: escapou` da mesma área (`docs/licoes.md`, últimos 30 dias) sobe
  a via um nível, nunca acima da Completa; as `tipo: repetido` não sobem. A `agentic-feature`
  faz esta triagem. Corrigir o que já existe e está errado (um rótulo, um arredondamento, um
  erro) não passa por ela: vai pela `agentic-fix`.
- **Pesquisa no início de cada feature**: antes de recomendar, o agente estuda como isto se faz
  hoje de melhor (a feature nos produtos de referência, o design, a forma de construir o
  frontend e o backend na versão do lockfile), em fontes primárias e datadas, a partir de
  `docs/radar.md`. Moderno não é moda: só o estável, que cobre os alvos e tem ganho medível; o
  que mexe numa decisão do projeto vira pergunta. Método:
  `<agentic-feature>/references/pesquisa-moderna.md`.
- **Detetor na revisão**: em toda a fatia de UI, antes de pedir revisão,
  `node <detetor> --diff <base>` não tem bloqueios nas linhas que a fatia acrescentou ou mudou
  (os de linhas não tocadas são pré-existentes: ficam numa linha do relatório e não vão para o
  backlog, `ui-sem-slop.md` §7). `<detetor>` é `.agentic/detetar-slop.mjs` (cópia versionada) ou
  `<agentic-design>/scripts/detetar-slop.mjs`; `<base>` é o commit de onde a
  fatia partiu (num ramo, `git merge-base HEAD main`), nunca `main` depois de já teres
  commitado em `main` (analisa 0 ficheiros e sai 2: não é prova). A prova inclui «N ficheiro(s)
  analisado(s)», com N > 0 quando a fatia mexeu em UI. O revisor usa a checklist de
  `ui-sem-slop.md` (`.agentic/ui-sem-slop.md` ou
  `<agentic-design>/references/ui-sem-slop.md`): o detetor é o chão;
  hierarquia, listas e vazio são juízo do revisor. O pre-commit aplica a mesma regra ao staged.
- **Integração contínua**: cada fatia verde entra em `main` no próprio dia. Nada de ramos de
  feature que vivem uma semana.
- **Entrega**: antes do commit final, o que a feature usou, experimentou ou rejeitou entra em
  `docs/radar.md` com fonte e data (entradas novas nunca diretamente em Adotar; passar a Adotar
  é do humano, no bloco «Precisa de ti»). Depois, segundo a política do projeto; deploy de
  produção só com OK explícito.
- **Retro curta**: 3–5 linhas por feature (o que correu bem, o que atrasou, lição) e a linha
  `radar: <entradas ou nada>`. Quando algo escapou (revertido, incidente, reportado pelo humano)
  ou a mesma classe aparece pela 2.ª vez numa revisão, uma linha em `docs/licoes.md`, no formato
  do cabeçalho (tipo `escapou` ou `repetido`, base, defeito → correção, `ficheiro:linha` esperado,
  classe, camada); se a defesa é mecânica, também uma verificação automática nova.

## Papéis

| Papel | Quem | Faz | Não faz |
|---|---|---|---|
| Humano | dono do produto | decide produto, prioridades, dinheiro, ações irreversíveis; escolhe entre variantes | descobrir factos que estão no código |
| Orquestrador | sessão principal do Claude | lê contexto, entrevista, planeia, divide em faixas, escreve briefs, integra, verifica; na revisão, conduz a `agentic-code-review` (worktrees dos revisores, nível em cada ronda, consolidação) | implementar faixas grandes ele próprio |
| Agentes | subagentes/sessões em worktrees | implementam um brief fechado com TDD; integram o teste de aceitação do revisor, na Completa | alargar âmbito, mexer fora dos ficheiros do brief |
| Revisor | as lentes da `agentic-code-review`: outros agentes, no modelo de revisão do utilizador e com contexto novo, cada um num worktree fora do repo | revê o diff do SHA revisto contra o `REVIEW.md`, com `ficheiro:linha` em cada achado; traz um teste de aceitação seu, como diz `<agentic-code-review>/references/painel-e-rondas.md` §3 | rever código que ele próprio escreveu; corrigir; commitar; deixar mutações |

## Limites e cadência

- **WIP ≤ 3 frentes por humano**: mais do que isso e as decisões pendentes acumulam e os agentes
  ficam parados à espera.
- **Sem sprints de calendário**: fluxo contínuo; revisão semanal do quadro (o que está parado, o
  que mudou de prioridade, decisões delegadas a rever, ADRs com `Rever em` vencido ou com o
  gatilho atingido, entradas do radar com mais de ~6 meses em áreas ativas → propostas no
  backlog). A pesquisa de cada feature confere também o `Rever em` das ADRs da área que toca.
- **Pedir ao humano** só em: entrevista, escolha de variantes de UI, gate antes de implementar,
  ações irreversíveis e, no fecho de cada feature, as decisões do radar (passar a Adotar, criar
  o radar se não existe) e as propostas da pesquisa para o backlog, no bloco «Precisa de ti»
  (não bloqueiam). Tudo o resto é autónomo.

## Definição de «feito»

Com evidência:
1. testes e verificações da área verdes (comando + saída no commit ou no quadro);
2. prova de ponta a ponta do comportamento pedido (ver armadilhas);
3. revisão independente (`agentic-code-review`) que cobre o SHA integrado (o que entra depois
   do SHA revisto segue as regras dela), sem Importante aberto e com resposta para cada um
   (corrigido, errado, intencional, não importa); em UI, também o detetor sem bloqueios nas
   linhas acrescentadas ou mudadas;
4. quadro atualizado (item em `integrado`/`em-producao` com o SHA, mini-retro no evento `fim`,
   `agente fim`);
5. radar atualizado quando a feature usou, experimentou ou rejeitou tecnologia (antes do commit
   final);
6. push feito (trunk-based: em `main`).

«Deve funcionar» não é feito. «Corri X e deu Y» é.

## Armadilhas de código escrito por agentes

Erros reais e repetidos. Cada um tem a defesa que este processo usa; põe-nas em
`docs/metodologia.md` e nos briefs dos agentes.

- **Planear o que já existe** (planos que propunham construir o que o repo já tinha) →
  leitura de contexto obrigatória antes de qualquer plano: procurar código parecido, rotas,
  ecrãs e docs, e medir o estado atual em vez de o supor.
- **O teste do autor herda o erro do autor** (quem escreveu o código escreve o teste com o mesmo
  mal-entendido, e o teste passa) → o revisor independente traz um teste de aceitação
  escrito a partir da spec, não do código (`<agentic-code-review>/references/painel-e-rondas.md` §3).
- **Provar a primitiva não prova a ligação** (a função está testada, mas a rota não a chama, ou
  a UI não chega lá) → testar o caminho de ponta a ponta: o pedido entra pela rota/ecrã real e o
  efeito aparece onde o utilizador o vê.
- **Construído e inalcançável** (a feature existe, mas não há botão, menu, rota ou permissão que
  leve lá) → verificar que o utilizador consegue lá chegar a partir do ponto de entrada normal,
  com o papel certo.
- **Recolhido e ignorado** (um campo pedido ao utilizador e guardado que nada usa) → cada dado
  novo tem um consumidor identificado na spec; sem consumidor, não se recolhe (também é
  minimização de dados).
- **Fixture ou mock que substitui a escrita esconde o defeito** (o teste prepara o estado à mão
  e nunca exercita o código que o devia escrever) → pelo menos um teste contra a dependência real
  (base de dados real em contentor, sistema de ficheiros real) que passe pelo caminho de escrita.
- **Guarda que salta com saída 0 falha aberta** (uma verificação diz SKIP por falta de variável
  ou ferramenta e o pipeline fica verde) → as verificações falham fechadas: se não puderam correr,
  é vermelho, com a mensagem a dizer o que falta. Exceção assumida: o detetor de slop no
  pre-commit só avisa quando o repo não versiona a cópia (projeto sem UI); com UI versiona-se e
  falha fechado (`ambiente-git.md`, Hooks).
- **Commit que afirma o que não contém** (mensagem descreve alterações que ficaram por incluir,
  ou inclui ficheiros de outro agente) → `git add` de caminhos explícitos e conferir mensagem com
  `git show --stat HEAD` antes do push.
- **Timeouts sem folga e processos filhos órfãos penduram a suite** (passa na máquina rápida,
  pendura na carregada; um servidor de teste fica vivo e a bateria nunca termina) → timeouts com
  folga ≥ 2× o maior tempo medido; no teardown matar os processos filhos e confirmar que
  morreram.
- **Revisão sem fim** (o autor-agente corrige cada reparo, o revisor encontra sempre mais, e as
  rondas não acabam) → o limite de rondas e o teto de agentes da `agentic-code-review`: da 2.ª
  ronda em diante só o diff novo, Nits que não abrem ronda, achados fechados que não se repetem;
  no limite, ir ao humano, nunca uma ronda extra em silêncio.
- **Achado antigo corrigido de passagem** (o revisor acusa código que já estava na base e o
  autor mexe-lhe, alargando o diff) → etiqueta Pré-existente (fora do diff e com `git blame`
  anterior à base), que fica numa linha do relatório e da retro: não vai para este diff nem para
  o backlog.
- **Default não-nulo esconde a query errada** (a coluna tem valor por omissão, por isso a query
  que lê a coluna errada devolve algo plausível e o teste passa) → dados de teste que distinguem
  o certo do errado: valores diferentes do default, mais de um registo, mais de um cliente.

## Mapa de skills

Inclui em `docs/metodologia.md` a tabela «quando → skill → como se invoca» de
`references/mapa-de-skills.md`, só com as skills instaladas neste ambiente, e as skills/comandos
do próprio projeto (que ganham às genéricas quando fazem o mesmo).
