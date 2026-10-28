# Ambiente git para agentes (fase 4)

Objetivo: vários agentes a trabalhar ao mesmo tempo sem se pisarem, com `main` sempre
pronto para produção e cada alteração verificada antes de sair da máquina.

## Trunk-based

- `main` é o tronco e está sempre verde e pronto para produção. Protegido por convenção: ninguém faz commit
  direto de trabalho a meio em `main`; só se integra lá trabalho verificado.
- Ramos curtos: `agente/<id>-<tema>` (ex.: `agente/a2-exportar-csv`). Vida < 24 h; nada fica sem
  push no fim da sessão. Ramos longos divergem e o merge vira trabalho de arqueologia.
- O Spec Kit cria ramos `NNN-tema` ao especificar uma feature: trata-os como ramos curtos, com a
  mesma regra das 24 h.
- Proteção real do ramo no GitHub (`gh api` ou definições do repo) é configuração da conta: só
  com OK do humano.

## Um worktree por agente

Dois agentes na mesma árvore de trabalho estragam-se um ao outro (um faz checkout ou `git add`
e leva o trabalho do outro). Cada agente tem a sua árvore:

```bash
# criar (a partir de main atualizado; o pull só se houver remoto)
git switch main && git pull --ff-only
git worktree add ../<repo>-<agente> -b agente/<id>-<tema> main

# listar
git worktree list

# depois de integrado
git worktree remove ../<repo>-<agente>
git branch -d agente/<id>-<tema>
```

Fora do repo (`../`) para não aparecer no `git status` principal; se tiver de ser dentro, usa
`.worktrees/` (já está no `.gitignore` base). Dependências (`node_modules`, builds de pacotes
partilhados) instalam-se em cada worktree: um worktree novo não as tem.

## Integração (o orquestrador faz)

1. No worktree do agente: `git fetch` + `git rebase main` (ou `origin/main`).
2. Corre as verificações da área (`.agentic/areas.json`) e as gerais.
3. Em `main`: `git merge --ff-only agente/<id>-<tema>`; volta a correr as verificações se
   integraste mais de um ramo.
4. Push de `main`. Remove o worktree e o ramo.

Nunca `git push --force` em ramos partilhados (`main` incluído) e nunca reescrever histórico que
já saiu da máquina. Se um rebase der conflitos que não percebes, para e pergunta.

## Regras de commit

- Um assunto por commit. A mensagem diz **o que** e **porquê**; o corpo leva a **prova**
  (comando corrido e resultado, ex.: `npm test: 142 passed`).
- `git add <caminhos>` explícitos. Nada de `git add -A` / `git commit -a` às cegas: apanham
  ficheiros de outros agentes, segredos e lixo.
- Nada de `--no-verify`. Se um hook falha, a correção é a causa, não o hook.
- Antes do push, confere a mensagem com o diff: `git show --stat HEAD` e relê. Mensagens que
  afirmam o que o commit não contém enganam quem audita depois.
- Migrações de base de dados já aplicadas nunca se editam: acrescenta-se uma nova.

## Hooks (`.githooks/`, ativos com `git config core.hooksPath .githooks`)

- **pre-commit**: segredos com `gitleaks` (se instalado; senão avisa em voz alta), typecheck e
  lint rápidos (scripts `typecheck`/`lint` do `package.json`, se existirem).
  Nos ficheiros de UI staged (`.css .scss .tsx .jsx .html .vue .svelte`), corre o
  `detetar-slop.mjs` da agentic-design, procurado por esta ordem: a cópia versionada em
  `.agentic/detetar-slop.mjs`, `$AGENTIC_DESIGN_DIR/scripts/`, as pastas de skills dos
  agentes (`$CLAUDE_CONFIG_DIR/skills/`, `~/.claude/skills/`, `~/.agents/skills/` e as outras do
  `SKILL.md`, e as do projeto `.claude/skills/` e `.agents/skills/`) e o plugin `agentic-skills`
  do Claude Code (a versão instalada, segundo `installed_plugins.json`). Analisa o
  conteúdo staged (copiado com `git checkout-index` para uma pasta temporária) e **só bloqueia o
  que cai nas linhas que o commit acrescenta ou muda** (`git diff --cached -U0`; apagar uma linha
  conta para as vizinhas, para que tirar um `slop-ok` não passe). Um bloqueio que já lá estava
  sai como `pré-existente`, não para o commit e não se corrige à boleia: fica numa linha do
  relatório e não vai para o backlog (a mesma regra do `ui-sem-slop.md` §7).
  Num projeto com UI as cópias versionam-se por omissão (`preparar-repo.sh --aplicar --com-ui`
  copia `detetar-slop.mjs` e `ui-sem-slop.md` para `.agentic/`): assim os agentes sem a skill
  (Codex, sessões na cloud, outra máquina) têm o detetor e as regras, e o hook **falha fechado**
  se faltar o `node` ou o detetor. Sem cópia versionada só avisa (`UI NÃO verificada`) e deixa
  passar: é a exceção assumida à armadilha «guarda que salta falha aberta» (`metodologia.md`),
  aceitável só num projeto sem UI.
- **pre-push**: testes rápidos (`test:rapido`, `test:fast` ou `test`).
- Falham fechados: verificação que existe e falha bloqueia. Uma verificação que «salta» e devolve
  0 parece verde e não verificou nada; por isso, quando não encontram o que correr, os hooks
  dizem-no em voz alta (`AVISO: nenhum stack detetado; nada verificado`). Esse aviso é aceitável
  num repo só com docs; num repo com código é um defeito a corrigir na hora.
- Projeto novo, sem código: os hooks genéricos já chamam `typecheck`, `lint` e `test:rapido`/
  `test` quando o `package.json` os tiver. Não há nada a ajustar agora; a 1.ª feature (o
  esqueleto) cria esses scripts e o aviso desaparece. Noutro stack, a 1.ª feature troca o aviso
  pelo comando do projeto.
- Limite conhecido: o gitleaks e o detetor de slop veem só o que está staged, mas typecheck, lint
  e testes correm sobre a árvore de trabalho. Um commit pode passar graças a uma correção que
  ficou fora dele; confere `git diff --cached` antes de commitar. (Não se usa `git stash` no hook
  para isolar o staged: com vários agentes, o stash é partilhado e perde trabalho alheio.)
- Outros stacks: acrescenta o comando rápido do projeto onde o hook o indica (ex.: `ruff check`,
  `pytest -q -x`, `go vet ./...`, `cargo check`). Mantém o pre-commit abaixo de ~30 s, ou os
  agentes vão querer contorná-lo.

## `scripts/preparar-repo.sh`

Idempotente, simulação por omissão, `--aplicar` para fazer, nunca sobrescreve. Linhas da saída:
- `criaria` / `criado`, `definiria` / `definido`: o que falta / o que fez.
- `existe, mantido`: já havia; não se tocou. Em modo adotar, compara com o que o script geraria
  (`preparar-repo.sh --mostrar pre-commit|pre-push|gitignore|areas` imprime-o) e propõe a junção
  ao humano (diff).
- `aviso`: o ficheiro existente não tem algo recomendado: `.gitignore` sem `.env`; um
  `pre-commit` sem o bloco do detetor de slop, ou gerado por uma versão anterior do script (sem
  a marca `agentic-project:pre-commit:3`); uma cópia em `.agentic/` diferente da agentic-design
  instalada. Propõe a alteração com diff; não edites sem OK. Cada aviso conta como pendente. Num
  projeto sem UI, a linha `# detetar-slop: n.a. (sem UI, D-NNN)` no hook fecha o aviso do detetor.
- `core.hooksPath=<outro> … NÃO ficam ativos`: o projeto já usa outro gestor de hooks (ex.:
  husky). Junta as verificações ao gestor existente em vez de o trocar.
- `aviso hooks locais em .git/hooks: …`: o repo tem hooks locais que `core.hooksPath` desligaria
  sem aviso. O script não o define. Lê esses hooks, propõe ao humano juntá-los a `.githooks/` e só
  com OK define `git config core.hooksPath .githooks`.
- `Pendente: N item(ns)`: avisos que esperam decisão do humano; a fase não fecha com eles por
  resolver (resolvido = aplicado com OK, ou recusado e registado em `docs/decisoes.md`).

## Mapa de áreas (`.agentic/areas.json`)

Esqueleto criado pelo script; preenche-o com o mapa da fase 3. Cada área: `area`, `pastas`,
`verificar` (comandos), `risco` (`normal` | `alto`), `notas`. Corre cada comando de `verificar`
uma vez e confirma que executa pelo menos um teste: um filtro que não apanha ficheiros dá «0
tests» com saída 0 (verde falso), e alguns executores não aceitam uma pasta como argumento (o
`node --test` do Node 22 dá `MODULE_NOT_FOUND`; usa um glob entre aspas, ex.
`node --test "src/agenda/**/*.test.js"`). Comandos que ainda não existem ficam marcados
`(a criar na 1.ª feature)`. Os agentes leem-no antes de tocar
no código para saber o que correr e com que cuidado; o orquestrador usa-o para formar faixas de
trabalho sem ficheiros em comum.

## Prova da fase

Faz a prova num ramo descartável (`git switch -c prova-hooks`) e mostra ao humano as saídas de:
1. um commit que tem de falhar — falha;
2. o mesmo commit corrigido — passa;
3. o pre-push com um teste que falha — falha (`bash .githooks/pre-push </dev/null; echo $?`, com
   `"test": "node -e \"process.exit(1)\""` no `package.json` temporário) — e depois passa com o
   teste corrigido. Correr o hook diretamente chega: a ligação `core.hooksPath` já ficou provada
   no passo 1. Sem `package.json` o pre-push só mostra o aviso «nenhum stack detetado»: regista-o
   como esperado num repo sem código.

Como provocar a falha:
- Com código: estraga um tipo de propósito; o pre-commit tem de parar no `typecheck`.
- Sem código ainda: um `package.json` temporário com `"typecheck": "node -e \"process.exit(1)\""`;
  ou, com gitleaks, um ficheiro com um token inventado no formato de um token real (ex.:
  `ghp_` + 36 caracteres aleatórios). Nunca uses um segredo verdadeiro.
- Detetor de slop (projeto com UI): um `.css` staged com `font-size: 10px` tem de parar o commit
  (`bloqueio letra-pequena`) e o mesmo com `14px` passa; num ficheiro que já tinha `10px`, mudar
  outra linha passa e lista a antiga como `pré-existente`. Se o hook disse `detetar-slop.mjs não
  encontrado`, corre `preparar-repo.sh --aplicar --com-ui` (ele procura a agentic-design ao lado
  da agentic-project e nas pastas de skills dos agentes; noutro sítio, passa
  `AGENTIC_DESIGN_DIR=<pasta>`) e repete.

No fim: `git switch main && git branch -D prova-hooks` e apaga os ficheiros temporários.
