#!/usr/bin/env bash
# install.sh: instala as onze skills do agentic-skills nos agentes.
#
# Por omissão é uma SIMULAÇÃO: mostra o que faria e não toca em nada. Só --aplicar instala.
#
# Uso: ./install.sh [--aplicar] [--agente A]... [--projeto PASTA] [--ligar] [--forcar] [--agentes]
#   --aplicar        instala de facto
#   --agente A       claude | codex | codex-legado | cursor | gemini | copilot | opencode | todos
#                    (repetível, ou separado por vírgulas; por omissão, os agentes cuja pasta de
#                    configuração existe: ~/.claude ~/.codex ~/.cursor ~/.gemini ~/.copilot
#                    ~/.config/opencode). codex-legado (~/.codex/skills, Codex antigo) só se for
#                    pedido e não entra em «todos»
#   --projeto PASTA  instala nas pastas de skills desse repositório em vez das do utilizador
#   --ligar          ligações simbólicas para este repo em vez de cópias (atualiza com git pull)
#   --forcar         substitui uma skill que já exista; a anterior vai para
#                    ~/.agentic-skills-backups/<data>/
#   --agentes        opcional, só Claude Code: copia também os agentes definidos (implementador,
#                    implementador-ui, pesquisador, revisor) para a pasta de agentes dele
#                    (~/.claude/agents, ou <repo>/.claude/agents com --projeto), sem sobrescrever
#                    nenhum ficheiro que já exista (nem com --forcar), e mostra o excerto para
#                    colares no teu CLAUDE.md. O instalador nunca edita o CLAUDE.md
#   -h, --help       esta ajuda
#
# Destinos (os documentados por cada agente em 2026-10):
#   claude                                utilizador: ~/.claude/skills  projeto: <repo>/.claude/skills
#   codex-legado                          utilizador: ~/.codex/skills (não há âmbito de projeto)
#   codex, cursor, gemini, copilot, opencode
#                                         utilizador: ~/.agents/skills  projeto: <repo>/.agents/skills
# Os agentes que partilham uma pasta recebem uma só instalação. CLAUDE_CONFIG_DIR, se definida,
# substitui ~/.claude.
# Saída: 0 = feito (ou simulação); 1 = com --aplicar, ficou alguma skill por instalar; 2 = uso.
# Os agentes definidos que já existam ficam como estão e não contam para o código de saída.
set -euo pipefail

uso() { awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"; }

REPO="$(cd "$(dirname "$0")" && pwd -P)"  # caminho real: o mesmo clone por uma ligação conta como o mesmo
SKILLS="agentic-project agentic-feature agentic-design agentic-implement agentic-fix agentic-code-review agentic-architecture agentic-explain agentic-analysis-optimization agentic-ci-audit agentic-tool-design"
TODOS="claude codex cursor gemini copilot opencode"
LEGADO="codex-legado"  # só a pedido: o Codex atual lê ~/.agents/skills
# Os agentes definidos do Claude Code (--agentes) vivem como assets da agentic-implement.
AGENTES_FONTE="agentic-implement/assets/agentes"
AGENTES_LISTA="implementador implementador-ui pesquisador revisor"

APLICAR=0
COM_AGENTES=0
LIGAR=0
FORCAR=0
PROJETO=""
AGENTES=""

while [ $# -gt 0 ]; do
  case "$1" in
    --aplicar) APLICAR=1 ;;
    --ligar) LIGAR=1 ;;
    --forcar) FORCAR=1 ;;
    --agentes) COM_AGENTES=1 ;;
    --agente)
      [ $# -ge 2 ] || { echo "install.sh: --agente precisa de um nome" >&2; exit 2; }
      AGENTES="$AGENTES $(printf '%s' "$2" | tr ',' ' ')"; shift ;;
    --agente=*) AGENTES="$AGENTES $(printf '%s' "${1#--agente=}" | tr ',' ' ')" ;;
    --projeto)
      [ $# -ge 2 ] || { echo "install.sh: --projeto precisa de uma pasta" >&2; exit 2; }
      PROJETO="$2"; shift ;;
    --projeto=*) PROJETO="${1#--projeto=}" ;;
    -h|--help) uso; exit 0 ;;
    *) echo "install.sh: opção desconhecida: $1 (vê --help)" >&2; exit 2 ;;
  esac
  shift
done

for s in $SKILLS; do
  if [ ! -f "$REPO/skills/$s/SKILL.md" ]; then
    echo "install.sh: não encontro $REPO/skills/$s/SKILL.md; corre o script a partir do clone do repo" >&2
    exit 2
  fi
done

if [ "$COM_AGENTES" = 1 ]; then
  for f in $AGENTES_LISTA excerto-claude-md; do
    if [ ! -f "$REPO/skills/$AGENTES_FONTE/$f.md" ]; then
      echo "install.sh: não encontro $REPO/skills/$AGENTES_FONTE/$f.md; corre o script a partir do clone do repo" >&2
      exit 2
    fi
  done
fi

if [ -n "$PROJETO" ]; then
  if [ ! -d "$PROJETO" ]; then echo "install.sh: --projeto: a pasta $PROJETO não existe" >&2; exit 2; fi
  PROJETO="$(cd "$PROJETO" && pwd)"
fi

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

pasta_config() { # pasta_config <agente>: pasta cuja existência indica que o agente está presente
  case "$1" in
    claude) printf '%s' "$CLAUDE_DIR" ;;
    codex) printf '%s' "$HOME/.codex" ;;
    codex-legado) printf '%s' "$HOME/.codex" ;;
    cursor) printf '%s' "$HOME/.cursor" ;;
    gemini) printf '%s' "$HOME/.gemini" ;;
    copilot) printf '%s' "$HOME/.copilot" ;;
    opencode) printf '%s' "$HOME/.config/opencode" ;;
  esac
}

destino() { # destino <agente>: pasta de skills onde instalar
  if [ "$1" = codex-legado ]; then printf '%s' "$HOME/.codex/skills"; return; fi
  if [ "$1" = claude ]; then
    if [ -n "$PROJETO" ]; then printf '%s' "$PROJETO/.claude/skills"; else printf '%s' "$CLAUDE_DIR/skills"; fi
  else
    if [ -n "$PROJETO" ]; then printf '%s' "$PROJETO/.agents/skills"; else printf '%s' "$HOME/.agents/skills"; fi
  fi
}

destino_agentes() { # pasta de agentes do Claude Code
  if [ -n "$PROJETO" ]; then printf '%s' "$PROJETO/.claude/agents"; else printf '%s' "$CLAUDE_DIR/agents"; fi
}

curto() { # mostra um caminho com ~ no lugar do HOME
  case "$1" in
    "$HOME"/*) printf '~/%s' "${1#"$HOME"/}" ;;
    *) printf '%s' "$1" ;;
  esac
}

# Lista final de agentes (sem repetidos, pela ordem de TODOS).
pedidos=""
for a in $AGENTES; do
  case "$a" in
    todos) pedidos="$pedidos $TODOS" ;;
    claude|codex|codex-legado|cursor|gemini|copilot|opencode) pedidos="$pedidos $a" ;;
    *) echo "install.sh: agente desconhecido: $a (claude, codex, codex-legado, cursor, gemini, copilot, opencode, todos)" >&2; exit 2 ;;
  esac
done
escolhidos=""
if [ -n "$pedidos" ]; then
  for a in $TODOS $LEGADO; do
    case " $pedidos " in *" $a "*) escolhidos="$escolhidos $a" ;; esac
  done
  origem_lista="pedidos"
else
  for a in $TODOS; do
    if [ -d "$(pasta_config "$a")" ]; then escolhidos="$escolhidos $a"; fi
  done
  origem_lista="detetados"
  if [ -z "$escolhidos" ]; then
    echo "install.sh: nenhum agente detetado (procurei $(curto "$CLAUDE_DIR"), ~/.codex, ~/.cursor, ~/.gemini, ~/.copilot, ~/.config/opencode)." >&2
    echo "install.sh: escolhe com --agente claude|codex|cursor|gemini|copilot|opencode|todos" >&2
    exit 2
  fi
fi

if [ "$COM_AGENTES" = 1 ]; then
  case " $escolhidos " in
    *" claude "*) ;;
    *) echo "install.sh: --agentes copia para a pasta de agentes do Claude Code; junta --agente claude" >&2; exit 2 ;;
  esac
fi

if [ -n "$PROJETO" ]; then
  case " $escolhidos " in
    *" codex-legado "*) echo "install.sh: codex-legado só existe no âmbito do utilizador (~/.codex/skills); tira --projeto ou o agente" >&2; exit 2 ;;
  esac
fi

if [ "$APLICAR" = 1 ]; then modo="instalar"; else modo="SIMULAÇÃO (nada muda; junta --aplicar para instalar)"; fi
if [ "$LIGAR" = 1 ]; then forma="ligações simbólicas para $(curto "$REPO")/skills"; else forma="cópias"; fi
if [ -n "$PROJETO" ]; then ambito="projeto $(curto "$PROJETO")"; else ambito="utilizador"; fi
echo "agentic-skills: $modo"
echo "  âmbito: $ambito · forma: $forma · agentes $origem_lista:$escolhidos"
if [ -n "$PROJETO" ] && [ "$LIGAR" = 1 ]; then
  echo "  atenção: com --projeto, --ligar aponta para uma pasta desta máquina; não commites essas ligações"
fi

CARIMBO="$(date +%Y%m%d-%H%M%S)"
pendentes=0
feitos=0
novos=0      # instaladas ou substituídas (ou que o seriam, na simulação)
destinos_feitos=""

instala_uma() { # instala_uma <origem> <destino>
  mkdir -p "$(dirname "$2")"
  if [ "$LIGAR" = 1 ]; then
    ln -s "$1" "$2"
  else
    cp -R "$1" "$2"
    find "$2" -type f -name '*.sh' -exec chmod +x {} +
  fi
}

for a in $escolhidos; do
  d="$(destino "$a")"
  case " $destinos_feitos " in
    *" $d "*) continue ;;  # pasta partilhada, já tratada (o título lista todos os que a leem)
  esac
  destinos_feitos="$destinos_feitos $d"
  # Quem mais lê esta pasta, entre os escolhidos (para a linha de título).
  quem=""
  for b in $escolhidos; do
    if [ "$(destino "$b")" = "$d" ]; then quem="${quem:+$quem, }$b"; fi
  done
  echo
  echo "$quem → $(curto "$d")"
  for s in $SKILLS; do
    src="$REPO/skills/$s"
    dst="$d/$s"
    # Ligação para este repo (comparando caminhos reais, para um clone usado por uma ligação).
    ligada_aqui=0
    if [ -L "$dst" ] && [ -d "$dst" ] && [ "$(cd "$dst" && pwd -P)" = "$src" ]; then ligada_aqui=1; fi
    if [ "$LIGAR" = 1 ] && [ "$ligada_aqui" = 1 ]; then
      echo "  já ligada, mantida   $s"
      continue
    fi
    if [ -e "$dst" ] || [ -L "$dst" ]; then
      if [ "$LIGAR" = 0 ] && [ ! -L "$dst" ] && diff -rq "$src" "$dst" >/dev/null 2>&1; then
        echo "  igual, mantida       $s"
        continue
      fi
      if [ "$FORCAR" = 0 ]; then
        if [ "$LIGAR" = 0 ] && [ "$ligada_aqui" = 1 ]; then
          echo "  existe, mantida      $s (é uma ligação para este repo; --forcar troca-a por uma cópia)"
        elif [ "$LIGAR" = 1 ] && [ ! -L "$dst" ] && diff -rq "$src" "$dst" >/dev/null 2>&1; then
          echo "  existe, mantida      $s (é uma cópia igual; --forcar troca-a por uma ligação)"
        else
          echo "  existe, mantida      $s (é diferente; --forcar substitui e guarda a atual)"
        fi
        pendentes=$((pendentes + 1))
        continue
      fi
      copia="$HOME/.agentic-skills-backups/$CARIMBO/$(printf '%s' "$d" | tr '/' '_')/$s"
      if [ "$APLICAR" = 1 ]; then
        mkdir -p "$(dirname "$copia")"
        mv "$dst" "$copia"
        instala_uma "$src" "$dst"
        echo "  substituída          $s (a anterior está em $(curto "$copia"))"
        feitos=$((feitos + 1))
      else
        echo "  substituiria         $s (a anterior iria para $(curto "$copia"))"
      fi
      novos=$((novos + 1))
      continue
    fi
    if [ "$APLICAR" = 1 ]; then
      instala_uma "$src" "$dst"
      if [ "$LIGAR" = 1 ]; then echo "  ligada               $s"; else echo "  copiada              $s"; fi
      feitos=$((feitos + 1))
    else
      if [ "$LIGAR" = 1 ]; then echo "  ligaria              $s → $(curto "$src")"; else echo "  copiaria             $s"; fi
    fi
    novos=$((novos + 1))
  done
done

# Agentes definidos (opcional): copiados sempre (são para editar), nunca sobrescritos.
agentes_novos=0
agentes_mantidos=0
if [ "$COM_AGENTES" = 1 ]; then
  da="$(destino_agentes)"
  echo
  echo "claude (agentes) → $(curto "$da")"
  for f in $AGENTES_LISTA; do
    src="$REPO/skills/$AGENTES_FONTE/$f.md"
    dst="$da/$f.md"
    if [ -e "$dst" ] || [ -L "$dst" ]; then
      if [ ! -L "$dst" ] && cmp -s "$src" "$dst"; then
        echo "  igual, mantido       $f"
      else
        echo "  existe, mantido      $f (é diferente; não se sobrescreve, nem com --forcar: compara à mão)"
      fi
      agentes_mantidos=$((agentes_mantidos + 1))
      continue
    fi
    if [ "$APLICAR" = 1 ]; then
      mkdir -p "$da"
      cp "$src" "$dst"
      echo "  copiado              $f"
    else
      echo "  copiaria             $f"
    fi
    agentes_novos=$((agentes_novos + 1))
  done
  echo
  echo "Excerto para o teu CLAUDE.md (o instalador não o edita: cola-o à mão onde quiseres):"
  echo "----------------------------------------------------------------"
  cat "$REPO/skills/$AGENTES_FONTE/excerto-claude-md.md"
  echo "----------------------------------------------------------------"
fi

# Cursor, OpenCode e o Copilot no VS Code também leem ~/.claude/skills.
tem_claude=0; tem_agents=0
for a in $escolhidos; do
  if [ "$a" = claude ]; then tem_claude=1; else tem_agents=1; fi
done
echo
if [ "$tem_claude" = 1 ] && [ "$tem_agents" = 1 ] && [ -z "$PROJETO" ]; then
  echo "nota: OpenCode, Cursor e o Copilot no VS Code também leem ~/.claude/skills. O OpenCode"
  echo "      (medido na 1.18) mostra uma entrada por skill, mas escolhe ao acaso a cópia de"
  echo "      ~/.claude/skills ou de ~/.agents/skills: mantém as duas pastas na mesma versão."
  if [ "$pendentes" -gt 0 ] && [ "$novos" -gt 0 ]; then
    echo "atenção: uma pasta fica com a versão nova e outra com a que já lá estava; repete com"
    echo "      --forcar para as alinhar (as anteriores vão para ~/.agentic-skills-backups/)."
  fi
fi
if [ "$APLICAR" = 1 ]; then
  echo "feito: $feitos instalada(s), $pendentes por instalar. Abre uma sessão nova do agente para as carregar."
  if [ "$COM_AGENTES" = 1 ]; then echo "agentes: $agentes_novos copiado(s), $agentes_mantidos mantido(s)."; fi
  if [ "$pendentes" -gt 0 ]; then exit 1; fi
else
  echo "simulação: $pendentes por resolver. Para instalar, repete o mesmo comando com --aplicar."
  if [ "$COM_AGENTES" = 1 ]; then echo "agentes: $agentes_novos por copiar, $agentes_mantidos já lá estão."; fi
fi
