#!/usr/bin/env bash
# preparar-repo.sh: prepara um repositório para trabalho por agentes (skill agentic-project).
#
# Idempotente. Por omissão é uma SIMULAÇÃO: lista o que faria e não toca em nada.
# Com --aplicar cria só o que falta:
#   - repositório git (ramo main), se a pasta ainda não for um
#   - .gitignore base
#   - .githooks/pre-commit e .githooks/pre-push genéricos (detetam o stack; o pre-commit corre
#     também o detetar-slop.mjs da agentic-design nos ficheiros de UI staged e só bloqueia o
#     que cai nas linhas que o commit acrescenta ou muda)
#   - git config core.hooksPath .githooks (só se ainda não houver hooksPath nem hooks locais
#     em .git/hooks, que ficariam desligados sem aviso)
#   - .agentic/areas.json (esqueleto do mapa de áreas)
#   - com --com-ui: cópias versionadas de detetar-slop.mjs e ui-sem-slop.md da agentic-design em
#     .agentic/ (o pre-commit passa a falhar fechado; agentes sem a skill leem as regras)
# Nunca sobrescreve: um ficheiro que já existe fica como está ("existe, mantido"); um que existe
# sem algo recomendado dá "aviso" e conta como pendente.
# Não faz commit nem push.
#
# Uso: preparar-repo.sh [--aplicar] [--com-ui] [--dir CAMINHO]
#      preparar-repo.sh --mostrar pre-commit|pre-push|gitignore|areas   (imprime o que geraria)
set -euo pipefail

uso() { sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'; }

APLICAR=0
DIR="$PWD"
MOSTRAR=""
COM_UI=0
while [ $# -gt 0 ]; do
  case "$1" in
    --aplicar) APLICAR=1 ;;
    --com-ui) COM_UI=1 ;;
    --mostrar)
      shift
      [ $# -gt 0 ] || { echo "erro: --mostrar precisa de: pre-commit, pre-push, gitignore ou areas" >&2; exit 2; }
      MOSTRAR="$1"
      ;;
    --dir)
      shift
      [ $# -gt 0 ] || { echo "erro: --dir precisa de um caminho" >&2; exit 2; }
      DIR="$1"
      ;;
    -h|--help) uso; exit 0 ;;
    *) echo "erro: opção desconhecida: $1" >&2; uso >&2; exit 2 ;;
  esac
  shift
done

# Conteúdo de cada ficheiro gerado (também para --mostrar).
conteudo_gitignore() {
  cat <<'EOF'
# .gitignore base (agentic-project). Acrescenta o que o stack do projeto precisar.

# Segredos e ambiente local: nunca no git
.env
.env.*
!.env.example
*.pem
*.key
# Permissões locais do Claude Code (por máquina; as skills em .claude/skills/ commitam-se)
.claude/settings.local.json

# Dependências, builds, relatórios
node_modules/
dist/
build/
coverage/
.venv/
__pycache__/

# Sistema e editores
.DS_Store
Thumbs.db
.idea/
.vscode/*
!.vscode/extensions.json

# Estado local do quadro (sincronizado para o artefacto; não vai para o git)
.agentic/quadro/estado/

# Worktrees de agentes, se alguém os criar dentro do repo
.worktrees/
EOF
}

conteudo_pre_commit() {
  cat <<'EOF'
#!/usr/bin/env bash
# pre-commit genérico (agentic-project): segredos + typecheck/lint rápidos + UI sem slop.
# Falha fechado: se uma verificação existe e falha, o commit pára.
# Limite: o gitleaks vê só o que está staged, mas typecheck e lint correm sobre a árvore de
# trabalho; um commit pode passar graças a correções que ficaram fora dele. Confere o
# git diff --cached antes de commitar.
# Não uses --no-verify para passar à frente: corrige a causa ou fala com o humano.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

falhou=0
corre() {
  echo "pre-commit: $*"
  if ! "$@"; then
    echo "pre-commit: FALHOU: $*" >&2
    falhou=1
  fi
}

# Segredos (gitleaks, se instalado)
if command -v gitleaks >/dev/null 2>&1; then
  if gitleaks git --help 2>/dev/null | grep -q -- '--pre-commit'; then
    corre gitleaks git --pre-commit --staged --redact --no-banner .
  else
    corre gitleaks protect --staged --redact --no-banner
  fi
else
  echo "pre-commit: AVISO: gitleaks não instalado, segredos NÃO verificados" >&2
fi

# Stack JavaScript/TypeScript: corre typecheck e lint se o package.json os tiver.
# Outros stacks: acrescenta aqui o comando rápido do projeto e põe verificou=1.
verificou=0
tem_script() {
  if command -v node >/dev/null 2>&1; then
    node -e 'const p=require("./package.json");process.exit(p.scripts&&p.scripts[process.argv[1]]?0:1)' "$1"
  else
    grep -q "\"$1\"[[:space:]]*:" package.json
  fi
}
if [ -f package.json ]; then
  gestor=npm
  [ -f pnpm-lock.yaml ] && gestor=pnpm
  [ -f yarn.lock ] && gestor=yarn
  { [ -f bun.lockb ] || [ -f bun.lock ]; } && gestor=bun
  for s in typecheck lint; do
    if tem_script "$s"; then
      verificou=1
      case "$gestor" in
        npm|pnpm) corre "$gestor" run -s "$s" ;;
        *) corre "$gestor" run "$s" ;;
      esac
    fi
  done
fi

if [ "$verificou" = 0 ]; then
  echo "pre-commit: AVISO: nenhum typecheck/lint detetado; só os segredos foram verificados" >&2
fi

# UI sem «estética de IA» (marca: agentic-project:pre-commit:3): detetar-slop.mjs da skill
# agentic-design nos ficheiros de UI staged. Analisa o conteúdo staged (copiado para uma pasta
# temporária), não a árvore de trabalho. Só BLOQUEIA o que cai nas linhas que este commit
# acrescenta ou muda (git diff --cached -U0): um bloqueio que já lá estava aparece como
# «pré-existente», não pára o commit e não se corrige à boleia (uma linha no relatório; não vai
# para o backlog). Detetor, por ordem: .agentic/detetar-slop.mjs (cópia versionada),
# $AGENTIC_DESIGN_DIR/scripts/, as pastas de skills do utilizador ($CLAUDE_CONFIG_DIR/skills/,
# ~/.claude/skills/, ~/.agents/skills/, ~/.codex/skills/, ~/.config/agents/skills/,
# ~/.cursor/skills/, ~/.gemini/skills/, ~/.copilot/skills/, ~/.config/opencode/skills/) e do
# projeto (.claude/skills/, .agents/skills/), e o plugin agentic-skills do Claude Code (a versão
# instalada, segundo plugins/installed_plugins.json). Com a cópia versionada falha fechado (sem
# node ou sem detetor = commit parado); sem ela só avisa. Bloqueio: corrige, ou escapa com
# «slop-ok: <motivo>».
design_no_plugin() { # pasta agentic-design do plugin agentic-skills do Claude Code, ou nada
  # A instalada (installed_plugins.json, a atualizada mais recentemente); sem esse ficheiro ou
  # sem node, a versão mais recente da cache que não esteja marcada como órfã (.orphaned_at).
  local p="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins" c v melhor=""
  [ -d "$p" ] || return 0
  if [ -f "$p/installed_plugins.json" ] && command -v node >/dev/null 2>&1; then
    while IFS= read -r c; do
      if [ -f "$c/skills/agentic-design/scripts/detetar-slop.mjs" ]; then printf '%s' "$c/skills/agentic-design"; return 0; fi
    done < <(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const e=[];for(const [k,v] of Object.entries(j.plugins||{}))if(k.split("@")[0]==="agentic-skills")for(const x of [].concat(v))if(x&&x.installPath)e.push(x);e.sort((a,b)=>String(b.lastUpdated||"").localeCompare(String(a.lastUpdated||"")));for(const x of e)console.log(x.installPath)' "$p/installed_plugins.json" 2>/dev/null || true)
  fi
  [ -d "$p/cache" ] || return 0
  while IFS= read -r c; do
    v="${c%/skills/agentic-design/scripts/detetar-slop.mjs}"
    if [ -e "$v/.orphaned_at" ]; then continue; fi
    if [ -z "$melhor" ] || [ "$v" -nt "$melhor" ]; then melhor="$v"; fi
  done < <(find "$p/cache" -maxdepth 7 -type f -path '*/skills/agentic-design/scripts/detetar-slop.mjs' 2>/dev/null || true)
  if [ -n "$melhor" ]; then printf '%s' "$melhor/skills/agentic-design"; fi
  return 0
}
set --
while IFS= read -r -d '' f; do set -- "$@" "$f"; done < <(
  git diff --cached --name-only -z --diff-filter=ACMR -- \
    '*.css' '*.scss' '*.tsx' '*.jsx' '*.html' '*.vue' '*.svelte')
if [ "$#" -gt 0 ]; then
  versionado=0
  if git ls-files --error-unmatch .agentic/detetar-slop.mjs >/dev/null 2>&1; then versionado=1; fi
  sem_detetor() { # sem_detetor <motivo>
    if [ "$versionado" = 1 ]; then
      echo "pre-commit: FALHOU: detetar-slop: $1 (o repo versiona .agentic/detetar-slop.mjs: a UI tem de ser verificada)" >&2
      falhou=1
    else
      echo "pre-commit: AVISO: $1; UI NÃO verificada (versiona .agentic/detetar-slop.mjs para isto falhar fechado)" >&2
    fi
  }
  slop=""
  for c in "$PWD/.agentic" "${AGENTIC_DESIGN_DIR:-/nao-definido}/scripts"; do
    if [ -f "$c/detetar-slop.mjs" ]; then slop="$c/detetar-slop.mjs"; break; fi
  done
  if [ -z "$slop" ]; then
    for c in "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills" "$HOME/.claude/skills" "$HOME/.agents/skills" \
             "$HOME/.codex/skills" "$HOME/.config/agents/skills" "$HOME/.cursor/skills" \
             "$HOME/.gemini/skills" "$HOME/.copilot/skills" "$HOME/.config/opencode/skills" \
             "$PWD/.claude/skills" "$PWD/.agents/skills"; do
      if [ -f "$c/agentic-design/scripts/detetar-slop.mjs" ]; then slop="$c/agentic-design/scripts/detetar-slop.mjs"; break; fi
    done
  fi
  if [ -z "$slop" ]; then
    c="$(design_no_plugin)"
    if [ -n "$c" ]; then slop="$c/scripts/detetar-slop.mjs"; fi
  fi
  if [ -z "$slop" ]; then
    sem_detetor "detetar-slop.mjs não encontrado (.agentic/, \$AGENTIC_DESIGN_DIR, pastas de skills dos agentes, .claude/skills/, .agents/skills/, plugin agentic-skills)"
  elif ! command -v node >/dev/null 2>&1; then
    sem_detetor "node não instalado"
  elif ! tmp_slop="$(mktemp -d "${TMPDIR:-/tmp}/slop.XXXXXX")"; then
    echo "pre-commit: FALHOU: detetar-slop (mktemp falhou)" >&2
    falhou=1
  else
    trap 'rm -rf "$tmp_slop"' EXIT
    mkdir "$tmp_slop/arvore"
    printf '%s\0' "$@" | git checkout-index -z --stdin --prefix="$tmp_slop/arvore/"
    echo "pre-commit: detetar-slop ($# ficheiro(s) de UI staged; só bloqueiam as linhas alteradas)"
    rc=0
    (cd "$tmp_slop/arvore" && node "$slop" --json "$@") > "$tmp_slop/achados.json" || rc=$?
    if [ "$rc" -gt 1 ]; then
      echo "pre-commit: FALHOU: detetar-slop não conseguiu analisar (saída $rc)" >&2
      falhou=1
    elif ! node - "$tmp_slop/achados.json" <<'JS'
// Separa os bloqueios em linhas alteradas (bloqueiam) dos pré-existentes (só se listam).
const { readFileSync } = require("fs");
const { execFileSync } = require("child_process");
const { resumo, achados } = JSON.parse(readFileSync(process.argv[2], "utf8"));
const cache = new Map();
function alteradas(f) { // linhas do lado novo de git diff --cached -U0
  if (cache.has(f)) return cache.get(f);
  const s = new Set();
  const d = execFileSync("git", ["diff", "--cached", "-U0", "--no-color", "--no-ext-diff", "--", f], { encoding: "utf8" });
  for (const l of d.split("\n")) {
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(l);
    if (!m) continue;
    const ini = Number(m[1]), n = m[2] === undefined ? 1 : Number(m[2]);
    if (n === 0) { s.add(ini); s.add(ini + 1); } // linha apagada (ex.: um slop-ok): as vizinhas contam
    for (let i = ini; i < ini + n; i++) s.add(i);
  }
  cache.set(f, s);
  return s;
}
let bloqueiam = 0, antigos = 0;
for (const a of achados) {
  let tipo = a.severidade;
  if (tipo === "bloqueio") {
    if (alteradas(a.ficheiro).has(a.linha)) bloqueiam++;
    else { tipo = "pré-existente"; antigos++; }
  }
  const dica = tipo === "pré-existente" ? "linha não alterada: não bloqueia; uma linha no relatório, não vai para o backlog" : a.sugestao;
  console.log(`${a.ficheiro}:${a.linha}  ${tipo}  ${a.regra}  ${a.mensagem}\n    → ${dica}`);
}
console.log(`${resumo.ficheiros} ficheiro(s) analisado(s): ${bloqueiam} bloqueio(s) em linhas alteradas, ${antigos} pré-existente(s), ${resumo.avisos} aviso(s).`);
process.exitCode = bloqueiam > 0 ? 1 : 0;
JS
    then
      echo "pre-commit: FALHOU: detetar-slop (corrige, ou escapa com «slop-ok: <motivo>»)" >&2
      falhou=1
    fi
  fi
fi
exit "$falhou"
EOF
}

conteudo_pre_push() {
  cat <<'EOF'
#!/usr/bin/env bash
# pre-push genérico (agentic-project): testes rápidos antes de o código sair da máquina.
# Usa o script test:rapido (ou test:fast) do package.json se existir; senão test.
# Falha fechado: testes vermelhos param o push. Não uses --no-verify.
# Limite: corre sobre a árvore de trabalho, não sobre os commits enviados; empurra com a
# árvore limpa (git status) para testares o que vai sair.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
export CI="${CI:-1}"   # ferramentas em modo não interativo (sem watch)

tem_script() {
  if command -v node >/dev/null 2>&1; then
    node -e 'const p=require("./package.json");process.exit(p.scripts&&p.scripts[process.argv[1]]?0:1)' "$1"
  else
    grep -q "\"$1\"[[:space:]]*:" package.json
  fi
}

if [ -f package.json ]; then
  gestor=npm
  [ -f pnpm-lock.yaml ] && gestor=pnpm
  [ -f yarn.lock ] && gestor=yarn
  { [ -f bun.lockb ] || [ -f bun.lock ]; } && gestor=bun
  alvo=""
  for s in test:rapido test:fast test; do
    if tem_script "$s"; then alvo="$s"; break; fi
  done
  if [ -n "$alvo" ]; then
    echo "pre-push: $gestor run $alvo"
    if ! "$gestor" run "$alvo"; then
      echo "pre-push: FALHOU: testes ($alvo). Push cancelado." >&2
      exit 1
    fi
  else
    echo "pre-push: AVISO: package.json sem script de testes; nada verificado" >&2
  fi
else
  # Outros stacks: substitui este aviso pelo comando de testes rápidos do projeto.
  echo "pre-push: AVISO: nenhum stack detetado; nada verificado" >&2
fi
exit 0
EOF
}

conteudo_areas() {
  cat <<'EOF'
{
  "_leia": "Mapa de áreas: que pastas pertencem a que área, que verificação correr quando se mexe nelas e o risco. Preencher na fase de arquitetura; os agentes leem isto antes de tocar no código.",
  "areas": [
    {
      "area": "exemplo",
      "pastas": ["src/exemplo/"],
      "verificar": ["npm run -s typecheck", "<testes só desta área; confirma que correm >= 1 teste>"],
      "risco": "normal",
      "notas": "Substituir. risco: normal | alto (dados, permissões, pagamentos, migrações: via Completa e revisão de segurança; hooks, CI e instaladores têm revisão de segurança pelo caminho, sem alto)"
    }
  ]
}
EOF
}

if [ -n "$MOSTRAR" ]; then
  case "$MOSTRAR" in
    pre-commit) conteudo_pre_commit ;;
    pre-push) conteudo_pre_push ;;
    gitignore) conteudo_gitignore ;;
    areas) conteudo_areas ;;
    *) echo "erro: --mostrar aceita pre-commit, pre-push, gitignore ou areas" >&2; exit 2 ;;
  esac
  exit 0
fi

[ -d "$DIR" ] || { echo "erro: a pasta não existe: $DIR" >&2; exit 2; }
DIR="$(cd "$DIR" && pwd -P)"
HOME_REAL="$(cd "$HOME" 2>/dev/null && pwd -P || echo "$HOME")"
if [ "$DIR" = "/" ] || [ "$DIR" = "$HOME_REAL" ]; then
  echo "erro: recuso preparar $DIR (raiz ou HOME). Passa a pasta do projeto com --dir." >&2
  exit 2
fi

command -v git >/dev/null 2>&1 || { echo "erro: git não está instalado" >&2; exit 1; }

E_REPO=0
TOP="$DIR"
if git -C "$DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  E_REPO=1
  TOP="$(git -C "$DIR" rev-parse --show-toplevel)"
fi

alteracoes=0
pendentes=0   # itens que esperam decisão do humano (avisos que bloqueiam uma alteração)

diz() { printf '  %-16s %s\n' "$1" "$2"; }

# Regista uma criação: em simulação só conta; com --aplicar a função chamadora faz o trabalho.
marca_criacao() { alteracoes=$((alteracoes + 1)); }

# criar_ficheiro <caminho-relativo> <executavel:0|1>  (conteúdo pelo stdin)
criar_ficheiro() {
  local rel="$1" exe="$2" alvo conteudo
  alvo="$TOP/$1"
  conteudo="$(cat)"
  if [ -e "$alvo" ] || [ -L "$alvo" ]; then
    diz "existe, mantido" "$rel"
    return 0
  fi
  marca_criacao
  if [ "$APLICAR" = 1 ]; then
    mkdir -p "$(dirname "$alvo")"
    printf '%s\n' "$conteudo" > "$alvo"
    if [ "$exe" = 1 ]; then chmod +x "$alvo"; fi
    diz "criado" "$rel"
  else
    diz "criaria" "$rel"
  fi
}

if [ "$APLICAR" = 1 ]; then
  echo "preparar-repo: A APLICAR em $TOP"
else
  echo "preparar-repo: SIMULAÇÃO em $TOP (nada é alterado; usa --aplicar)"
fi
if [ "$TOP" != "$DIR" ]; then
  echo "  nota: $DIR está dentro do repositório $TOP; uso a raiz."
fi

# 1. Repositório git
if [ "$E_REPO" = 1 ]; then
  ramo="$(git -C "$TOP" symbolic-ref --short HEAD 2>/dev/null || echo '(HEAD solto)')"
  diz "existe, mantido" "repositório git (ramo atual: $ramo)"
else
  marca_criacao
  if [ "$APLICAR" = 1 ]; then
    git -C "$TOP" init -q -b main 2>/dev/null || {
      git -C "$TOP" init -q
      git -C "$TOP" symbolic-ref HEAD refs/heads/main
    }
    E_REPO=1
    diz "criado" "repositório git (ramo main)"
  else
    diz "criaria" "repositório git: git init -b main"
  fi
fi

# 2. .gitignore base
criar_ficheiro ".gitignore" 0 < <(conteudo_gitignore)

# Aviso sobre um .gitignore que já existia (não se edita: só se avisa). A linha do estado do
# quadro só se verifica na fase do quadro, quando ele é instalado.
if [ -f "$TOP/.gitignore" ] && ! grep -qxF ".env" "$TOP/.gitignore"; then
  diz "aviso" ".gitignore não tem a linha '.env' (propõe-a ao humano)"
  pendentes=$((pendentes + 1))
fi

# 3. Hooks
criar_ficheiro ".githooks/pre-commit" 1 < <(conteudo_pre_commit)

# Aviso sobre um pre-commit que já existia sem o detetor de UI, ou gerado por uma versão anterior
# deste script (não se edita: só se avisa). Num projeto sem UI, uma linha
# «# detetar-slop: n.a. (sem UI, D-NNN)» no hook fecha o aviso.
if [ -f "$TOP/.githooks/pre-commit" ]; then
  if ! grep -q "detetar-slop" "$TOP/.githooks/pre-commit"; then
    diz "aviso" ".githooks/pre-commit não corre o detetar-slop. Com UI: propõe o bloco ao humano"
    diz "" "(vê-o com: $0 --mostrar pre-commit). Sem UI: «# detetar-slop: n.a. (sem UI, D-NNN)»."
    pendentes=$((pendentes + 1))
  elif grep -q "pre-commit genérico (agentic-project)" "$TOP/.githooks/pre-commit" \
    && ! grep -q "agentic-project:pre-commit:3" "$TOP/.githooks/pre-commit"; then
    diz "aviso" ".githooks/pre-commit vem de uma versão anterior (procura o detetor na agentic-feature,"
    diz "" "onde já não está, ou bloqueia slop já existente em linhas não tocadas). Propõe a troca com"
    diz "" "diff: $0 --mostrar pre-commit"
    pendentes=$((pendentes + 1))
  fi
fi

criar_ficheiro ".githooks/pre-push" 1 < <(conteudo_pre_push)

# 4. core.hooksPath
if [ "$E_REPO" = 1 ]; then
  atual="$(git -C "$TOP" config --get core.hooksPath || true)"
else
  atual=""
fi
# Hooks locais (não .sample) em .git/hooks ficariam desligados ao definir core.hooksPath.
hooks_locais=""
if [ "$E_REPO" = 1 ] && [ -z "$atual" ]; then
  dir_hooks="$(git -C "$TOP" rev-parse --git-path hooks)"
  case "$dir_hooks" in /*) ;; *) dir_hooks="$TOP/$dir_hooks" ;; esac
  if [ -d "$dir_hooks" ]; then
    for h in "$dir_hooks"/*; do
      [ -f "$h" ] || continue
      case "$h" in *.sample) continue ;; esac
      hooks_locais="$hooks_locais $(basename "$h")"
    done
  fi
fi

if [ "$atual" = ".githooks" ]; then
  diz "existe, mantido" "core.hooksPath=.githooks"
elif [ -n "$atual" ]; then
  diz "existe, mantido" "core.hooksPath=$atual (os hooks de .githooks/ NÃO ficam ativos; junta-os à mão)"
elif [ -n "$hooks_locais" ]; then
  diz "aviso" "hooks locais em .git/hooks:$hooks_locais. Definir core.hooksPath desligava-os."
  diz "" "Não defini. Junta-os a .githooks/ e, com OK do humano: git config core.hooksPath .githooks"
  pendentes=$((pendentes + 1))
else
  marca_criacao
  if [ "$APLICAR" = 1 ]; then
    git -C "$TOP" config core.hooksPath .githooks
    diz "definido" "core.hooksPath=.githooks"
  else
    diz "definiria" "core.hooksPath=.githooks"
  fi
fi

# 5. Mapa de áreas (esqueleto para preencher na fase de arquitetura)
criar_ficheiro ".agentic/areas.json" 0 < <(conteudo_areas)


# 6. Projeto com UI: cópias versionadas do detetor e das regras (da agentic-design instalada).
# Ordem: $AGENTIC_DESIGN_DIR, a pasta irmã desta skill (instalação conjunta ou plugin), as
# pastas de skills de cada agente (utilizador e projeto) e, por fim, o plugin agentic-skills
# do Claude Code (a versão instalada). A mesma lista do pre-commit gerado.
IRMAS="$(cd "$(dirname "$0")/../.." && pwd)"
design_no_plugin() { # pasta agentic-design do plugin agentic-skills do Claude Code, ou nada
  # A instalada (installed_plugins.json, a atualizada mais recentemente); sem esse ficheiro ou
  # sem node, a versão mais recente da cache que não esteja marcada como órfã (.orphaned_at).
  local p="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins" c v melhor=""
  [ -d "$p" ] || return 0
  if [ -f "$p/installed_plugins.json" ] && command -v node >/dev/null 2>&1; then
    while IFS= read -r c; do
      if [ -f "$c/skills/agentic-design/scripts/detetar-slop.mjs" ]; then printf '%s' "$c/skills/agentic-design"; return 0; fi
    done < <(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const e=[];for(const [k,v] of Object.entries(j.plugins||{}))if(k.split("@")[0]==="agentic-skills")for(const x of [].concat(v))if(x&&x.installPath)e.push(x);e.sort((a,b)=>String(b.lastUpdated||"").localeCompare(String(a.lastUpdated||"")));for(const x of e)console.log(x.installPath)' "$p/installed_plugins.json" 2>/dev/null || true)
  fi
  [ -d "$p/cache" ] || return 0
  while IFS= read -r c; do
    v="${c%/skills/agentic-design/scripts/detetar-slop.mjs}"
    if [ -e "$v/.orphaned_at" ]; then continue; fi
    if [ -z "$melhor" ] || [ "$v" -nt "$melhor" ]; then melhor="$v"; fi
  done < <(find "$p/cache" -maxdepth 7 -type f -path '*/skills/agentic-design/scripts/detetar-slop.mjs' 2>/dev/null || true)
  if [ -n "$melhor" ]; then printf '%s' "$melhor/skills/agentic-design"; fi
  return 0
}
pasta_design() { # imprime a pasta da agentic-design, ou nada
  local c
  for c in "${AGENTIC_DESIGN_DIR:-/nao-definido}" "$IRMAS/agentic-design" \
           "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills/agentic-design" "$HOME/.claude/skills/agentic-design" \
           "$HOME/.agents/skills/agentic-design" "$HOME/.codex/skills/agentic-design" \
           "$HOME/.config/agents/skills/agentic-design" "$HOME/.cursor/skills/agentic-design" \
           "$HOME/.gemini/skills/agentic-design" "$HOME/.copilot/skills/agentic-design" \
           "$HOME/.config/opencode/skills/agentic-design" \
           "$TOP/.claude/skills/agentic-design" "$TOP/.agents/skills/agentic-design"; do
    if [ -f "$c/scripts/detetar-slop.mjs" ]; then printf '%s' "$c"; return 0; fi
  done
  design_no_plugin
}
DESIGN="$(pasta_design)"
for par in "scripts/detetar-slop.mjs:.agentic/detetar-slop.mjs" "references/ui-sem-slop.md:.agentic/ui-sem-slop.md"; do
  origem="${par%%:*}"; rel="${par#*:}"
  if [ -e "$TOP/$rel" ]; then
    if [ -n "$DESIGN" ] && ! cmp -s "$DESIGN/$origem" "$TOP/$rel"; then
      diz "aviso" "$rel difere da agentic-design instalada ($DESIGN). Mostra o diff e,"
      diz "" "com OK do humano, atualiza a cópia: cp \"$DESIGN/$origem\" $rel"
      pendentes=$((pendentes + 1))
    else
      diz "existe, mantido" "$rel"
    fi
  elif [ "$COM_UI" = 1 ]; then
    if [ -z "$DESIGN" ]; then
      diz "aviso" "--com-ui: agentic-design não encontrada (\$AGENTIC_DESIGN_DIR, ao lado da agentic-project, pastas de skills dos agentes, plugin agentic-skills); $rel por copiar"
      pendentes=$((pendentes + 1))
    else
      marca_criacao
      if [ "$APLICAR" = 1 ]; then
        mkdir -p "$TOP/.agentic"
        cp "$DESIGN/$origem" "$TOP/$rel"
        diz "copiado" "$rel (de $DESIGN)"
      else
        diz "copiaria" "$rel (de $DESIGN)"
      fi
    fi
  fi
done

echo
if [ "$pendentes" -gt 0 ]; then
  echo "Pendente: $pendentes item(ns) à espera de decisão do humano (ver «aviso» acima)."
fi
if [ "$APLICAR" = 1 ]; then
  echo "Feito: $alteracoes alteração(ões). Nada foi commitado; revê com git status."
elif [ "$alteracoes" = 0 ] && [ "$pendentes" = 0 ]; then
  echo "Simulação: nada por fazer, o repositório já está preparado."
elif [ "$alteracoes" = 0 ]; then
  echo "Simulação: nada que o script possa fazer sozinho; os pendentes acima são do humano."
else
  echo "Simulação: $alteracoes alteração(ões) por fazer. Para aplicar: $0 --aplicar$( [ "$COM_UI" = 1 ] && echo ' --com-ui') --dir $TOP"
fi
