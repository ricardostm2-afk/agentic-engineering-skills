# Brief do revisor: <mudança> · lente <lente> · ronda <n>/<limite>

<!-- Modelo da agentic-code-review (passo 2), também quando a agentic-feature a chama no passo 6. Um
     brief por revisor, com as lentes que o `painel-e-rondas.md` §3 lhe dá (na Padrão, todas num só);
     o verificador usa só a última secção. Preenche cada <...>, apaga o que não se aplica e
     este comentário. `<agentic-code-review>`, `<agentic-implement>` e `<agentic-design>` são os
     caminhos absolutos dessas skills (a 3.ª só com UI). Quem recebe este brief não escreveu nenhuma parte desta mudança. O
     nível já foi conferido pelo orquestrador contra o diff desta ronda: as lentes não o refazem. O
     orquestrador cria o worktree fora do repo e preenche o caminho em «Onde corres», e o de
     `<tmp-aceitacao>` na lente spec, os dois no `<tmp>` do `painel-e-rondas.md` §2. -->

## Ponto fixo

- Base: `<sha-base>` · Revisto: `<sha-revisto>` (a revisão vale só para este SHA).
- Diff: `git diff <sha-base>...<sha-revisto>`. Da ronda 2 em diante, só o diff novo:
  `git diff <sha-revisto-anterior>..<sha-revisto>`.
- Commits: `git log --oneline <sha-base>..<sha-revisto>`.
- Nível da revisão: <Rápida (pedida) | Padrão | Completa, ou o do `REVIEW.md`>, porque <critério> (<+ segurança e
  verificador: hooks, CI ou instaladores>, se for o caso). Modelo: <o de revisão do utilizador, ex.: Opus medium | gpt-6.1-sol medium>.
- Intenção: <spec, pedido, descrição do PR ou mensagens dos commits> · plano: <caminho, ou «nenhum»> ·
  pesquisa aprovada: <caminho, ou «nenhuma»> · UI: <variantes/escolha.md e capturas, ou «sem UI»>.
- Regras do projeto: `REVIEW.md` (se existe, ganha a este brief), `AGENTS.md`, a constituição. Lês
  estas, este brief e as secções para que ele aponta; o `SKILL.md` da revisão é de quem orquestra
  (`painel-e-rondas.md` §4).
- Achados fechados: <id · ficheiro:linha · resposta>, ou «nenhum». Não os repitas. Um achado fechado só
  reabre se o diff novo voltar a pôr o mesmo efeito nas mesmas linhas.

## Onde corres

No worktree `<wt-revisao>`, fora do repo e destacado no SHA revisto, que o orquestrador criou para
ti (`git worktree add --detach <wt-revisao> <sha-revisto>`); corres todos os comandos lá
(`git -C <wt-revisao> …`), nunca na árvore da sessão. Não o crias nem o removes: o orquestrador
confere `git worktree list` e `git -C <wt-revisao> status --short` no fim e remove-o. Não deixas
commits, ficheiros nem outras mutações. <Se usas um comando que só revê o que está por commitar: o
orquestrador já correu `git -C <wt-revisao> reset --soft <sha-base>`. O `/security-review` não é
desses (revê `git diff origin/HEAD...`): corre-o no SHA revisto, sem reset.>

## A tua lente: <lente>

<Ficam só as tuas (uma, ou várias quando as lentes se juntam num agente); apaga as outras.>

- **Correção**: o código faz o que diz em todos os caminhos? Lê quem chama e quem consome cada função,
  rota, tipo ou formato que mudou, também fora do diff (`git grep` dos nomes). Num fix, procura a causa:
  corrigir o sintoma e deixar a causa é Importante. Num diff que apaga código (função, rota, flag,
  ficheiro), junta três provas antes de o dar por seguro: o histórico (`git -C <wt-revisao> log -S<nome>`:
  porque existia), os usos indiretos (nome construído em runtime, string, enum, wrapper, schema, e os
  consumidores que o `REVIEW.md` lista) e a configuração viva (variável de ambiente, flag ligada num
  cliente). Uso encontrado é Importante; o que só a produção mostra vai como pergunta a quem integra.
  Killswitch, flag permanente ou caminho de incidente apagados vão ao humano com recomendação: não são
  achado nem aprovação. Corre também a pesquisa «Calar o verificador» de
  `<agentic-code-review>/references/painel-e-rondas.md` §3 sobre o diff.
- **Spec** (só com intenção escrita): o que falta, o que foi feito sem ser pedido, o que parece feito e não
  está. Além disso, o teste de aceitação que o `<agentic-code-review>/references/painel-e-rondas.md` §3 pede
  para o nível do ponto fixo, sem ler os testes do autor. Se o escreves, corre-o no `<wt-revisao>`, copia-o
  para `<tmp-aceitacao>` (a pasta fora do repo que o orquestrador preencheu) e apaga-o do worktree antes de
  acabares. Quem o integra, sem alterações, é o autor.
- **Normas**: as regras documentadas do repo; os gostos que quem escreveu aplicou no passo 6 da
  `agentic-implement` (`<agentic-implement>/references/gostos.md`, o `AGENTS.md` e, no que toca a
  interface, o design system do projeto): um gosto que o diff viola é achado, com a linha da fonte
  que o diz; padrão novo onde o projeto já tinha um; dependência ou
  capacidade fora da pesquisa aprovada (se o projeto a tem); linhas de `AGENTS.md`, `CLAUDE.md`, `REVIEW.md` ou docs que a
  mudança deixou falsas.
- **Segurança**: permissões aplicadas no servidor e testadas com um papel sem acesso; isolamento entre
  clientes; validação de entrada; segredos fora do código; logs e erros sem dados pessoais nem valores da BD.
- **UI** (só com UI; pode ir com a lente spec): o modo «rever» da `agentic-design`:
  `node <agentic-design>/scripts/detetar-slop.mjs --diff <sha-base>` e a checklist do
  `<agentic-design>/references/ui-sem-slop.md` §5 contra as capturas da variante escolhida (o que fazer
  com cada saída do detetor: a abertura do §5 e o §7).

## Regras

- Estilo, formatação e nomes não são achados, salvo quando mudam o comportamento: são do lint e dos hooks.
- **Importante**: piora o comportamento, perde ou expõe dados, parte quem chama, ou deixa uma verificação
  passar sem provar. **Nit**: no máximo 3, no fim; não abrem ronda nem commit próprio. **Pré-existente**:
  o defeito já existia na base (a linha está fora dos hunks de `git diff -U0 <sha-base>..<sha-revisto>` e o
  `git blame` aponta para antes da base); fica numa linha no fim do relatório e não vai para o backlog.
  Uma linha fora do diff que a mudança tornou falsa (um doc, um chamador, código antigo que um ficheiro
  renomeado ou movido pôs no âmbito de uma guarda) é Importante.
- Prova: `ficheiro:linha` do código que leste, o efeito e como se reproduz (teste, comando ou captura).
  Num achado de docs ou normas, o `ficheiro:linha` do doc e o `ficheiro:linha` do código ou da árvore que o
  desmente bastam (ou `ausente: <caminho>`, se o doc cita o que não existe); numa dependência fora da
  pesquisa, a linha do manifesto e `ausente em <pesquisa aprovada>`. Sem `ficheiro:linha` não é achado.
- Classe: dá nome à classe do defeito e procura as outras instâncias no diff; as de fora são Pré-existentes.
- Um achado que contesta a abordagem aprovada (spec, decisão do humano) não é defeito: vai para «Direção».
- Não corriges código nem fazes commits. O teste de aceitação (lente spec) vive fora do repo e nunca
  se commita.

## Relatório

Primeira linha:
`Revisão <sha-revisto> · <via> · lente <lente> · ronda <n>/<limite> · <i> Importantes · <n> Nits · <p> Pré-existentes`.
Sem achados, a linha seguinte é `0 Importantes — nada a corrigir`.

Depois, por gravidade, um achado por linha:
`[Importante] <ficheiro:linha> — <efeito> — reproduz: <como> — classe: <classe>`
`[Nit] <ficheiro:linha> — <o quê>`

No fim: `Pré-existentes: <ficheiro:linha · classe; …>` numa só linha (ou `Pré-existentes: nenhum`),
«Teste de aceitação» (lente spec: o que testa, e o caminho do ficheiro ou a descrição), «Direção» (só se
houver), «Nível: <ficheiro:linha> — <porquê>» (só se o que leste pede mais do que o nível recebido) e
«Não li» (o que ficou por ler e porquê). Formato completo: `<agentic-code-review>/assets/relatorio.template.md`;
com `node`, `node <agentic-code-review>/scripts/validar-relatorio.mjs <relatório>` sai 0 antes de entregares.
O orquestrador junta os relatórios das lentes antes de irem ao autor.

## Verificador (só na ronda 1, só sobre os Importantes já consolidados; modelo de revisão, contexto novo)

És o único verificador desta ronda: recebes os Importantes de todas as lentes, já sem duplicados. Para
cada um, abre `ficheiro:linha` em `<sha-revisto>` (no `<wt-revisao>`, como acima) e segue o caminho até ao
efeito. Devolve, para cada um, confirmado, refutado (com o motivo e o `ficheiro:linha`) ou sem veredicto.
Não acrescentas achados. «Sem veredicto» quer dizer não confirmado: não vai ao autor como Importante e fica
numa linha «Não confirmados»; não há 2.º verificador nesta ronda.
