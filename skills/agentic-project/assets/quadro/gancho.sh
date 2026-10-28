#!/usr/bin/env bash
# gancho.sh inicio|sinal|fim <job> [opções] — liga um runner de agentes qualquer (cron, fila de jobs, script de
# workflow, CI) ao quadro (scrum.sh). Mudo e sempre com saída 0: uma falha do quadro nunca pode parar o trabalho.
#
#   inicio <job> [--nome N] [--tipo T] [--modelo M] [--item I] [--detalhe D] [--prompt FICHEIRO]
#          → agente sinal (ativo) + evento inicio
#   sinal  <job> [--detalhe D] [...]       → agente sinal (chama-o de 10 em 10 min; sem sinal há 45 min o quadro
#                                            mostra o agente «à espera»)
#   fim    <job> [--codigo N] [--estado terminado|erro] [--detalhe D] [...]
#          → agente fim terminado (código 0 ou omisso) | erro (código ≠ 0) + evento fim | erro
#
# Agente: id = <job> em minúsculas com [a-z0-9-] (prefixo GANCHO_PREFIXO, ex.: «job-»); tipo por omissão
# GANCHO_TIPO ou outro-agente. Com --prompt, o nome sai do primeiro título Markdown do ficheiro («# …» ou
# «## Tarefa N — …») e o item da linha «item: <id>» (põe-na no cabeçalho do prompt). Opções explícitas ganham.
exec >/dev/null 2>&1
# Com o trinco do quadro ocupado, desiste em 4 s (omissão do CLI: 15 s): o runner pode estar à espera do gancho.
export SCRUM_ESPERA_MS="${SCRUM_ESPERA_MS:-4000}"
fase="${1:-}"; job="${2:-}"
[ -n "$job" ] || exit 0
shift 2 2>/dev/null || exit 0
S=(bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scrum.sh")

nome=""; tipo=""; modelo=""; item=""; detalhe=""; prompt=""; codigo=""; estado=""
while [ $# -gt 0 ]; do
  case "$1" in
    --nome) nome="${2:-}"; shift 2 ;;
    --tipo) tipo="${2:-}"; shift 2 ;;
    --modelo) modelo="${2:-}"; shift 2 ;;
    --item) item="${2:-}"; shift 2 ;;
    --detalhe) detalhe="${2:-}"; shift 2 ;;
    --prompt) prompt="${2:-}"; shift 2 ;;
    --codigo) codigo="${2:-}"; shift 2 ;;
    --estado) estado="${2:-}"; shift 2 ;;
    *) shift ;;
  esac
done

id="$(printf '%s' "${GANCHO_PREFIXO:-}$job" | tr 'A-Z' 'a-z' | tr -c 'a-z0-9' '-' | sed 's/--*/-/g; s/^-//; s/-$//' | cut -c1-64 | sed 's/-$//')"
[ -n "$id" ] || exit 0
if [ -n "$prompt" ] && [ -f "$prompt" ]; then
  [ -n "$nome" ] || nome="$(sed -n 's/^##* *Tarefa [^[:space:]]*[[:space:]]*[—–-]*[[:space:]]*//p' "$prompt" | head -1)"
  [ -n "$nome" ] || nome="$(sed -n 's/^##*[[:space:]][[:space:]]*//p' "$prompt" | head -1)"
  [ -n "$item" ] || item="$(sed -n 's/^item:[[:space:]]*\([a-z0-9][a-z0-9-]*\)[[:space:]]*$/\1/p' "$prompt" | head -1)"
fi
# Sem nome dado, o texto dos eventos usa o nome que o agente já tem no quadro (o do «inicio»), senão o job.
rotulo="$nome"
if [ -z "$rotulo" ] && [ "$fase" = "fim" ]; then
  rotulo="$("${S[@]}" ver agentes "$id" 2>/dev/null | node -e 'let s="";process.stdin.on("data",(d)=>{s+=d}).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).agentes.nome||""))}catch{}})' 2>/dev/null)"
fi
rotulo="${rotulo:-$job}"

# Opções do agente: nome/tipo/modelo só quando se sabem, para um «sinal» ou «fim» não apagar o nome que o
# «inicio» deu. Se o agente ainda não existe (o «inicio» falhou ou não houve), repete com nome e tipo por omissão.
extra=()
[ -n "$nome" ] && extra+=(--nome "$nome")
[ -n "$tipo" ] && extra+=(--tipo "$tipo")
[ -n "$modelo" ] && extra+=(--modelo "$modelo")
[ -n "$item" ] && extra+=(--item "$item")
ref=(--agente "$id")
[ -n "$item" ] && ref+=(--item "$item")
agente() { # agente <sinal|fim> [opções…]
  local acao="$1"; shift
  "${S[@]}" agente "$acao" "$id" "${extra[@]}" "$@" && return 0
  [ $? -eq 75 ] && return 1
  "${S[@]}" agente "$acao" "$id" --nome "$rotulo" --tipo "${tipo:-${GANCHO_TIPO:-outro-agente}}" "${extra[@]}" "$@"
}
det=(); [ -n "$detalhe" ] && det=(--detalhe "$detalhe")

case "$fase" in
  inicio)
    [ -n "$nome" ] || extra+=(--nome "$rotulo")
    [ -n "$tipo" ] || extra+=(--tipo "${GANCHO_TIPO:-outro-agente}")
    agente sinal --estado ativo --detalhe "${detalhe:-job $job}"
    "${S[@]}" evento inicio "$rotulo arrancou" "${ref[@]}" ;;
  sinal|vivo)
    agente sinal --estado ativo "${det[@]}" ;;
  fim)
    if [ -z "$estado" ]; then
      if [ -z "$codigo" ] || [ "$codigo" = "0" ]; then estado=terminado; else estado=erro; fi
    fi
    if [ "$estado" = "erro" ]; then
      agente fim --estado erro --detalhe "${detalhe:-$job falhou${codigo:+ (código $codigo)}}"
      "${S[@]}" evento erro "$rotulo falhou${codigo:+ (código $codigo)}" "${ref[@]}"
    else
      agente fim --estado terminado --detalhe "${detalhe:-$job terminou}"
      "${S[@]}" evento fim "$rotulo terminou" "${ref[@]}"
    fi ;;
esac
exit 0
