# Implementação por agentes (passo 5)

Tu és o orquestrador: partes o trabalho, escreves os briefs, lanças os agentes, juntas as faixas e
verificas. Os agentes (subagentes Claude ou jobs Codex, com a `agentic-implement`) implementam,
cada um no seu worktree, sem se pisarem.

## 1. Partir em faixas

1. Para cada tarefa de `tasks.md` lista os ficheiros que cria ou altera (o plano diz quais; se não
   diz, confirma no código).
2. Tarefas que partilham um ficheiro ficam na mesma faixa. Tarefas que dependem de outras ficam
   depois delas (na mesma faixa ou numa faixa em sequência).
3. **Ficheiros de encontro** (índice de rotas, esquema da BD, registo de componentes, traduções,
   configuração partilhada) são a principal fonte de conflitos. Duas saídas: atribuí-los a uma só
   faixa dona, ou fazê-los tu num commit de preparação antes de lançar as faixas («tornar a
   mudança fácil, depois fazer a mudança fácil»): ex.: criar a migração e os tipos primeiro, para
   que as faixas só os consumam.
4. Entre faixas paralelas que se tocam por uma interface (uma faz a rota, outra o ecrã que a
   chama), fixa a interface antes de lançar: assinatura, formato do pedido/resposta, erros. Vai
   para o brief das duas como «interface combinada» que nenhuma pode mudar sozinha.
5. Máximo ~3 faixas em paralelo por feature: é um teto de integração, não da máquina. Para mais
   faixas, parte a feature em fatias (`references/grande-demais.md`). A capacidade vem do §4 de
   `<agentic-implement>/references/escolher-o-agente.md`.
6. Uma faixa = um corte vertical ou parte coerente dele, que fica verde sozinha.

Regista o agrupamento num `lote.md`, por `assets/lote.template.md`: base, grupos e donos (um
dono por ficheiro), ficheiros de encontro e guardas, e ordem. Não copies regras para o lote.

Sem subagentes nem jobs: fazes tu as faixas, com a `agentic-implement`, na forma curta do §4.

## 2. Preparar os worktrees

Um agente, um worktree, um ramo. Dois agentes na mesma árvore apagam o trabalho um do outro
(um `git add` ou `git stash` de um apanha os ficheiros do outro).

```bash
BASE=$(git rev-parse HEAD)            # depois do commit de preparação, se houve
git worktree add ../<repo>-<feature>-<faixa> -b agente/<id>-<tema> "$BASE"
```

- Segue a convenção de ramos e de pastas de worktree do projeto se existir (`AGENTS.md`).
- Um worktree novo não tem dependências instaladas nem artefactos gerados: corre o arranque do
  projeto lá dentro (instalar dependências, build de pacotes partilhados, ficheiro de ambiente de
  desenvolvimento) e confirma que os testes da área correm antes de entregar o worktree ao agente.
- Se o ambiente oferece isolamento em worktree nativo dos subagentes (ex.: um parâmetro de
  isolamento do lançamento de agentes), podes usá-lo em vez de criar o worktree à mão; o resto do
  protocolo é igual.

## 3. Escrever os briefs

Copia `assets/brief-agente.template.md` para cada faixa e preenche tudo. O brief é o prompt do
agente, o mesmo num subagente e num job Codex, e o único contexto que ele tem: não viu esta
conversa, a Leitura nem o grill. Antes de lançar, relê cada brief como esse agente e responde:
consigo acabar sem perguntar nada? Sei exatamente que comando prova que acabei? Sei que ficheiros
não posso tocar? Se alguma resposta é «não», o brief não está fechado.

Quando o lançador de jobs do projeto exige um cabeçalho (o `AGENTS.md` ou o `CLAUDE.md` nomeia o
lançador e o contrato), o brief começa por ele, com os valores da faixa nesse formato.

Não incluas no brief: dados pessoais, segredos, o historial da conversa, opções em aberto.
Inclui: decisões já tomadas, caminhos exatos, comandos exatos, a interface combinada, e as linhas
da Pesquisa aprovada que tocam a faixa (para o agente não repetir a pesquisa nem usar o que se
rejeitou). Numa faixa de UI, também o caminho absoluto de `<agentic-design>` e o da variante
escolhida.

## 4. Lançar

- **Quem e como**: o nível, o modelo, o esforço e o agente escolhem-se por
  `<agentic-implement>/references/escolher-o-agente.md` §1–§3, e lança-se pelo §4 dele: um
  subagente Claude no worktree da faixa, ou um job Codex pelo lançador do projeto ou, sem ele, por
  `codex exec`. O prompt é o brief; o agente carrega a `agentic-implement` (`$agentic-implement`
  no Codex). Se o projeto tem regras do lançador que vão por cima de cada job, o prompt é essas
  regras mais o brief, por apontador: o `AGENTS.md` ou o `CLAUDE.md` do projeto diz quais são.
  Se houver script de lançamento, cada faixa e cada job passa por ele, com as verificações do
  §4 de `escolher-o-agente.md`; não o contornes com um lançamento direto.
- **Sem subagentes nem jobs, a forma curta**: executas as faixas tu, com a `agentic-implement`,
  uma de cada vez, num só ramo da feature e sem worktrees (um só executor não se pisa a si
  próprio). O brief de cada faixa encolhe para uma
  checklist de 3 linhas: interface combinada, ficheiros proibidos, comando que prova que acabou.
  Faz na mesma o teste do brief (§3): é aí que se apanham exemplos e nomes errados antes do
  código. Sem relatório formal: a prova vai para o registo e para a mensagem do commit.
  Também é a forma curta quando a sandbox do agente não deixa criar worktrees em `../` nem
  escrever em `.git` e o humano não aprovou os comandos git (Codex em `workspace-write`;
  SKILL.md, «Noutros agentes»).
- **Piloto**: num lote com mais de 3 faixas parecidas, lança uma primeiro. Assim que acaba,
  revê-a com 1 revisor de contexto novo, pelo método da `agentic-code-review`. As classes
  encontradas entram no brief das restantes antes de as lançares. A revisão final mantém-se.
- **Lote mecânico** (a mesma transformação em muitos ficheiros: renomear, mover, trocar um padrão
  por outro, aplicar um componente do sistema de design): um script, não N faixas. Pela ordem:
  1. fazes à mão uma unidade de cada forma diferente que a transformação encontra e escreves o
     **playbook** na secção «Playbook» do `lote.md`: a transformação, as formas que o script trata
     e as que ficam à mão, os ficheiros e o comando que prova;
  2. o humano aprova o playbook antes do lote (`decisao add`, com a tua recomendação): aprova a
     regra, não cada ficheiro;
  3. o script reproduz byte a byte a unidade feita à mão (`git diff` vazio contra ela) antes de
     correr no resto;
  4. um só agente corre o script, com um commit por classe da transformação e os testes da área
     verdes depois de cada um;
  5. a revisão é por classe: `<agentic-code-review>/references/manutencao.md`, «Lote mecânico».

  Nas zonas sensíveis (as do `REVIEW.md`; sem ele, tenant, sessão, faturação e dados pessoais), o
  playbook não substitui a revisão por diff: esses ficheiros ficam fora do script, ou têm a
  revisão do nível deles.
- Faixas independentes em paralelo, numa só mensagem, depois da piloto se se aplicar; faixas
  dependentes só depois de a anterior estar junta e verde (§6).
- Regista no quadro o `início` de cada faixa.

**Enquanto correm**:

- Não edites os worktrees deles. Se precisas de mudar o brief, para o agente, corrige e relança.
- Monitores com intervalo de 10 min ou mais. Só acordam o orquestrador por um evento que pede
  ação: fim, `bloqueado` ou decisão. Junta as notícias numa só mensagem.
- Lê logs por um comando que devolva poucas linhas (até 40), filtradas pela pergunta concreta.
- Nas mudanças de fase (spec commitada, faixas lançadas, faixas juntas), prepara um resumo para
  compactação ou passagem a uma sessão nova: base e SHAs, briefs, donos, estado, decisões,
  bloqueios e próximo passo. As instruções de compactação vivem no `CLAUDE.md` do utilizador ou
  do projeto. O modelo não corre `/compact`.

**Parar as faixas** (o «para» do humano depois do aviso da Padrão, ou um brief errado): para o
subagente com a ferramenta do agente que o lançou, e o job Codex pelo comando de parar do
lançador (ou o processo do `codex exec`). Os worktrees e os ramos ficam como estão: nada entrou no
tronco, por isso não há nada a desfazer, e o que lá ficou retoma-se ou descarta-se depois.

## 5. Receber

Cada agente devolve o handoff da `agentic-implement` (passo 8), com as linhas a mais do brief
(desvios, dados novos e quem os lê, o que viu e não mexeu). Antes de juntar a faixa:

- Confirma as saídas tu próprio no worktree (corre os comandos de verificação; não confies no
  relatório). Um relatório «tudo verde» sem saída colada é tratado como não verificado.
- Lê as decisões de âmbito que o agente tomou; se alguma contradiz a spec, corrige antes de
  a juntar.
- Um agente que morreu, expirou ou devolveu vazio não «não encontrou problemas»: o trabalho dele
  não está feito. Relança ou fá-lo tu.
- `bloqueado: <pergunta>`: juntas as perguntas de todas as faixas e respondes como diz o passo 5
  do `SKILL.md` (as técnicas e reversíveis decides tu e relanças; as do humano vão-lhe numa só
  mensagem).

## 6. Juntar as faixas

As faixas juntam-se no ramo curto da feature (ou em `main`, se o projeto trabalha direto no
tronco e a política o permite); a integração na `main` é o passo 7. Faixa a faixa, pela ordem das
dependências:

```bash
git -C ../<worktree> rebase <ramo-da-feature>      # traz a faixa para cima do que já entrou
git merge --ff-only agente/<id>-<tema>             # ou o merge que a política do projeto pede
<verificação completa do projeto>                  # depois de CADA faixa, não só no fim
```

- A revisão do passo 6 vale para o SHA revisto. O que se junta depois dele (um rebase,
  um conflito resolvido, uma correção) segue `<agentic-code-review>/references/painel-e-rondas.md`
  §9: ou cabe nas exceções de lá, ou abre uma ronda desse diff, e com o limite atingido vai ao
  humano.
- Conflitos: resolve-os tu, lendo os dois lados e a spec; nunca escolhas «o meu» ou «o deles» em
  bloco. Depois de resolver, verificação completa outra vez.
- Nunca force-push num ramo partilhado. Reescrever o ramo privado de um agente antes de o juntar
  é aceitável.
- Vermelho depois de juntar: encontra a faixa que o causou (`git bisect` se não é óbvio),
  corrige com um teste que reproduz, e só depois segue para a próxima faixa.
- No fim: remove só os worktrees e ramos que criaste para esta feature (`git worktree remove`,
  `git branch -d`), depois de juntos. O ramo descartável do protótipo (passo 3) não se integra:
  fica até ao fim do passo 6 e apaga-se na entrega (passo 3).
- Regista no quadro cada `commit` que entra no ramo da feature.
