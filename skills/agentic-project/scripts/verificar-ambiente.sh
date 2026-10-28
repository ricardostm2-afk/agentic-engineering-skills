#!/usr/bin/env bash
# verificar-ambiente.sh: confirma as ferramentas locais que a skill agentic-project usa.
# Não instala nada: para cada falta imprime o comando de instalação, para o humano aprovar.
#
# Níveis:
#   essencial    sem ela a skill não funciona            -> saída 1 se faltar
#   recomendada  há alternativa pior (fallback na skill) -> saída 0, mas aparece como FALTA
#   opcional     melhora a segurança/qualidade           -> saída 0
#
# Uso: verificar-ambiente.sh [-h]
# Variáveis: CLAUDE_PLUGINS_DIR (por omissão $CLAUDE_CONFIG_DIR/plugins ou ~/.claude/plugins)
#            para procurar os plugins; AGENTIC_FEATURE_DIR e AGENTIC_DESIGN_DIR se a agentic-feature
#            ou a agentic-design estiverem noutra pasta.
set -euo pipefail

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
PLUGINS_DIR="${CLAUDE_PLUGINS_DIR:-$CLAUDE_DIR/plugins}"
# Pastas de skills do utilizador e do projeto, pela ordem de procura (a mesma do SKILL.md).
PASTAS_SKILLS="$CLAUDE_DIR/skills
$HOME/.claude/skills
$HOME/.agents/skills
$HOME/.codex/skills
$HOME/.config/agents/skills
$HOME/.cursor/skills
$HOME/.gemini/skills
$HOME/.copilot/skills
$HOME/.config/opencode/skills
$PWD/.claude/skills
$PWD/.agents/skills"
SO="$(uname -s)"

faltas_essenciais=0
faltas_outras=0

# Comando de instalação conforme o sistema (macOS com Homebrew, Linux com apt). No Windows nativo
# (Git Bash, MSYS, Cygwin) os scripts e hooks da skill não são suportados: usa-se o WSL.
WINDOWS=0
case "$SO" in MINGW*|MSYS*|CYGWIN*) WINDOWS=1 ;; esac
inst() { # inst <comando-macos> <comando-linux>
  if [ "$WINDOWS" = 1 ]; then printf '%s' "usa o WSL (Ubuntu) e corre a skill dentro dele"
  elif [ "$SO" = "Darwin" ]; then printf '%s' "$1"; else printf '%s' "$2"; fi
}

linha() { # linha <ferramenta> <estado> <nivel> <versao> <instalar>
  printf '%-16s %-6s %-12s %-10s %s\n' "$1" "$2" "$3" "$4" "$5"
}

regista() { # regista <ferramenta> <ok:0|1> <nivel> <versao> <instalar>
  local nome="$1" ok="$2" nivel="$3" versao="$4" instalar="$5"
  if [ "$ok" = 1 ]; then
    linha "$nome" "OK" "$nivel" "$versao" "-"
  else
    linha "$nome" "FALTA" "$nivel" "$versao" "$instalar"
    if [ "$nivel" = "essencial" ]; then
      faltas_essenciais=$((faltas_essenciais + 1))
    else
      faltas_outras=$((faltas_outras + 1))
    fi
  fi
}

tem() { command -v "$1" >/dev/null 2>&1; }

# Procura um SKILL.md de um plugin; devolve o caminho ou vazio.
procura_skill() { # procura_skill <padrao-de-caminho>
  if [ -d "$PLUGINS_DIR" ]; then
    find "$PLUGINS_DIR" -maxdepth 9 -type f -name SKILL.md -path "$1" 2>/dev/null | head -n 1 || true
  fi
}

# Procura uma skill pelo nome nas pastas de skills dos agentes; devolve a pasta ou vazio.
procura_nas_pastas() { # procura_nas_pastas <nome>
  local d
  while IFS= read -r d; do
    if [ -f "$d/$1/SKILL.md" ]; then printf '%s' "$d/$1"; return 0; fi
  done <<EOF_PASTAS
$PASTAS_SKILLS
EOF_PASTAS
  return 0
}

# Pasta <nome> do plugin agentic-skills: a versão instalada (installed_plugins.json, a
# atualizada mais recentemente); sem esse ficheiro, a mais recente da cache que não seja órfã.
skill_no_plugin() { # skill_no_plugin <nome>
  local p="$PLUGINS_DIR" c v melhor=""
  [ -d "$p" ] || return 0
  if [ -f "$p/installed_plugins.json" ] && tem node; then
    while IFS= read -r c; do
      if [ -f "$c/skills/$1/SKILL.md" ]; then printf '%s' "$c/skills/$1"; return 0; fi
    done < <(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const e=[];for(const [k,v] of Object.entries(j.plugins||{}))if(k.split("@")[0]==="agentic-skills")for(const x of [].concat(v))if(x&&x.installPath)e.push(x);e.sort((a,b)=>String(b.lastUpdated||"").localeCompare(String(a.lastUpdated||"")));for(const x of e)console.log(x.installPath)' "$p/installed_plugins.json" 2>/dev/null || true)
  fi
  [ -d "$p/cache" ] || return 0
  while IFS= read -r c; do
    v="${c%/skills/$1/SKILL.md}"
    if [ -e "$v/.orphaned_at" ]; then continue; fi
    if [ -z "$melhor" ] || [ "$v" -nt "$melhor" ]; then melhor="$v"; fi
  done < <(find "$p/cache" -maxdepth 6 -type f -path "*/skills/$1/SKILL.md" 2>/dev/null || true)
  if [ -n "$melhor" ]; then printf '%s' "$melhor/skills/$1"; fi
  return 0
}

echo "Ambiente para agentic-project ($SO). Nada é instalado por este script."
if [ "$WINDOWS" = 1 ]; then
  echo "AVISO: Windows nativo não é suportado (hooks e scripts bash). Instala o WSL (Ubuntu) e corre a skill lá dentro."
fi
echo
linha "FERRAMENTA" "ESTADO" "NIVEL" "VERSAO" "INSTALAR (so se FALTA)"
linha "----------" "------" "-----" "------" "----------------------"

# git
if tem git; then
  regista git 1 essencial "$(git --version | awk '{print $3}')" ""
else
  regista git 0 essencial "-" "$(inst 'xcode-select --install  (ou brew install git)' 'sudo apt install -y git')"
fi

# node >= 20 (o CLI do quadro é um script node)
if tem node; then
  v="$(node -v 2>/dev/null | sed 's/^v//')"
  maior="${v%%.*}"
  case "$maior" in ''|*[!0-9]*) maior=0 ;; esac
  if [ "$maior" -ge 20 ]; then
    regista "node>=20" 1 essencial "$v" ""
  else
    regista "node>=20" 0 essencial "$v" "nvm install 22  (ou $(inst 'brew install node' 'ver https://nodejs.org'))"
  fi
else
  regista "node>=20" 0 essencial "-" "nvm install 22  (ou $(inst 'brew install node' 'ver https://nodejs.org'))"
fi

# gh (GitHub CLI): remoto, PRs, proteção de ramo
if tem gh; then
  regista gh 1 recomendada "$(gh --version 2>/dev/null | head -n 1 | awk '{print $3}')" ""
else
  regista gh 0 recomendada "-" "$(inst 'brew install gh' 'sudo apt install -y gh  (ver https://cli.github.com)'); depois: gh auth login (humano)"
fi

# uv (instala o specify)
if tem uv; then
  regista uv 1 recomendada "$(uv --version 2>/dev/null | awk '{print $2}')" ""
else
  regista uv 0 recomendada "-" "$(inst 'brew install uv' 'curl -LsSf https://astral.sh/uv/install.sh | sh')"
fi

# specify (Spec Kit); sem ele a skill usa o modelo de spec leve
if tem specify; then
  sv="$(specify version 2>/dev/null | tr -d '\033' | grep -o 'CLI Version *[0-9][0-9.]*' | awk '{print $3}' || true)"
  # A skill foi testada com a 1.2.0 (flags do init); outra versão aparece como FALTA, com o comando
  # que a troca (sem --force, o uv mantém a versão já instalada).
  if [ "${sv:-}" = "1.2.0" ]; then
    regista specify 1 recomendada "$sv" ""
  else
    regista specify 0 recomendada "${sv:-?}" "uv tool install --force specify-cli --from git+https://github.com/github/spec-kit.git@v1.2.0  (testada: 1.2.0)"
  fi
else
  regista specify 0 recomendada "-" "uv tool install --force specify-cli --from git+https://github.com/github/spec-kit.git@v1.2.0"
fi

# gitleaks (segredos no pre-commit)
if tem gitleaks; then
  regista gitleaks 1 opcional "$(gitleaks version 2>/dev/null | head -n 1)" ""
else
  regista gitleaks 0 opcional "-" "$(inst 'brew install gitleaks' 'ver https://github.com/gitleaks/gitleaks/releases')"
fi

# Skills irmãs: a agentic-feature (por onde entra cada feature) e a agentic-design (as regras e o
# detetor de slop de UI; essencial num projeto com UI, o pre-commit e o AGENTS.md usam-nos).
# Ordem: $AGENTIC_FEATURE_DIR ou $AGENTIC_DESIGN_DIR, a pasta irmã desta skill, as pastas de
# skills de cada agente e o plugin agentic-skills (a mesma do pre-commit que o preparar-repo.sh
# gera). A agentic-design só conta com o detetor.
IRMAS="$(cd "$(dirname "$0")/../.." && pwd)"
irma() { # irma <nome> <variável> <ficheiro que tem de existir>: imprime a pasta, ou nada
  local c
  for c in "${2:-/nao-definido}" "$IRMAS/$1"; do
    if [ -f "$c/SKILL.md" ] && [ -f "$c/$3" ]; then printf '%s' "$c"; return 0; fi
  done
  c="$(procura_nas_pastas "$1")"
  if [ -n "$c" ] && [ -f "$c/$3" ]; then printf '%s' "$c"; return 0; fi
  c="$(skill_no_plugin "$1")"
  if [ -n "$c" ] && [ -f "$c/$3" ]; then printf '%s' "$c"; fi
  return 0
}
if [ -n "$(irma agentic-feature "${AGENTIC_FEATURE_DIR:-}" SKILL.md)" ]; then
  regista agentic-feature 1 recomendada "skill" ""
else
  regista agentic-feature 0 recomendada "skill" "instala as skills juntas (install.sh do repo delas, ou o plugin)"
fi
if [ -n "$(irma agentic-design "${AGENTIC_DESIGN_DIR:-}" scripts/detetar-slop.mjs)" ]; then
  regista agentic-design 1 recomendada "skill" ""
else
  regista agentic-design 0 recomendada "skill" "instala as skills juntas (install.sh do repo delas, ou o plugin); essencial com UI"
fi

# Skills de terceiros: plugin do Claude Code ou skill instalada numa pasta de skills de um agente.
# Os comandos /plugin correm-se dentro do Claude Code; o gh skill serve os outros agentes.
if [ -n "$(procura_skill '*mattpocock*/grilling/SKILL.md')" ] || [ -n "$(procura_nas_pastas grilling)" ]; then
  regista mattpocock 1 recomendada "skills" ""
else
  regista mattpocock 0 recomendada "skills" "no Claude Code: /plugin marketplace add mattpocock/skills  e  /plugin install mattpocock-skills@mattpocock; noutros agentes (não testado): gh skill install mattpocock/skills <nome> --dir ~/.agents/skills"
fi

echo
if [ "$faltas_essenciais" -gt 0 ]; then
  echo "Resultado: faltam $faltas_essenciais essencial(is) e $faltas_outras outra(s). Instalar as essenciais antes de continuar."
  exit 1
fi
if [ "$faltas_outras" -gt 0 ]; then
  echo "Resultado: essenciais OK; faltam $faltas_outras recomendada(s)/opcional(is). A skill continua com o fallback de cada uma."
else
  echo "Resultado: tudo OK."
fi
exit 0
