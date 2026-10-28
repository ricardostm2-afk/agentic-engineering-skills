# install.ps1: instala as dez skills do agentic-skills nos agentes.
# Windows PowerShell 5.1 ou PowerShell 7 (também corre em macOS e Linux com o PowerShell 7).
#
# Por omissão é uma SIMULAÇÃO: mostra o que faria e não toca em nada. Só -Aplicar instala.
#
# Uso: .\install.ps1 [-Aplicar] [-Agente A[,B]] [-Projeto PASTA] [-Ligar] [-Forcar] [-Agentes]
#   -Aplicar         instala de facto
#   -Agente A        claude | codex | codex-legado | cursor | gemini | copilot | opencode | todos
#                    (separados por vírgulas; por omissão, os agentes cuja pasta de configuração
#                    existe: ~/.claude ~/.codex ~/.cursor ~/.gemini ~/.copilot ~/.config/opencode).
#                    codex-legado (~/.codex/skills, Codex antigo) só se for pedido e não entra em «todos»
#   -Projeto PASTA   instala nas pastas de skills desse repositório em vez das do utilizador
#   -Ligar           ligações para este clone em vez de cópias (no Windows, junções, que não precisam
#                    de administrador); atualiza com git pull
#   -Forcar          substitui uma skill que já exista; a anterior vai para
#                    ~/.agentic-skills-backups/<data>/
#   -Agentes         opcional, só Claude Code: copia também os agentes definidos (implementador,
#                    implementador-ui, pesquisador, revisor) para a pasta de agentes dele
#                    (~/.claude/agents, ou <repo>/.claude/agents com -Projeto), sem sobrescrever
#                    nenhum ficheiro que já exista (nem com -Forcar), e mostra o excerto para
#                    colares no teu CLAUDE.md. O instalador nunca edita o CLAUDE.md
#   -Ajuda           esta ajuda
#
# Com a política de execução restritiva do Windows:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Aplicar
#
# Destinos (os documentados por cada agente em 2026-10):
#   claude                                utilizador: ~/.claude/skills  projeto: <repo>/.claude/skills
#   codex-legado                          utilizador: ~/.codex/skills (não há âmbito de projeto)
#   codex, cursor, gemini, copilot, opencode
#                                         utilizador: ~/.agents/skills  projeto: <repo>/.agents/skills
# Os agentes que partilham uma pasta recebem uma só instalação. CLAUDE_CONFIG_DIR, se definida,
# substitui ~/.claude.
# Saída: 0 = feito (ou simulação); 1 = com -Aplicar, ficou alguma skill por instalar; 2 = uso.
# Os agentes definidos que já existam ficam como estão e não contam para o código de saída.
[CmdletBinding()]
param(
  [switch]$Aplicar,
  [string[]]$Agente = @(),
  [string]$Projeto = '',
  [switch]$Ligar,
  [switch]$Forcar,
  [switch]$Agentes,
  [switch]$Ajuda
)
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$Script = $MyInvocation.MyCommand.Path
if ($Ajuda) {
  $linhas = Get-Content -LiteralPath $Script -Encoding UTF8
  for ($i = 1; $i -lt $linhas.Count; $i++) {
    if ($linhas[$i] -notmatch '^#') { break }
    Write-Output ($linhas[$i] -replace '^# ?', '')
  }
  exit 0
}

function Falha([string]$Mensagem, [int]$Codigo = 2) {
  [Console]::Error.WriteLine('install.ps1: ' + $Mensagem)
  exit $Codigo
}

$EWindows = $true
if (Get-Variable -Name IsWindows -ErrorAction SilentlyContinue) { $EWindows = [bool]$IsWindows }

$Repo = (Get-Item -LiteralPath (Split-Path -Parent $Script)).FullName
$Skills = @('agentic-project', 'agentic-feature', 'agentic-fix', 'agentic-implement', 'agentic-design', 'agentic-code-review', 'agentic-architecture', 'agentic-ci-audit', 'agentic-tool-design', 'agentic-analysis-optimization')
$Todos = @('claude', 'codex', 'cursor', 'gemini', 'copilot', 'opencode')
$Legado = @('codex-legado')
# Os agentes definidos do Claude Code (-Agentes) vivem como assets da agentic-implement.
$AgentesFonte = Join-Path (Join-Path (Join-Path (Join-Path $Repo 'skills') 'agentic-implement') 'assets') 'agentes'
$AgentesLista = @('implementador', 'implementador-ui', 'pesquisador', 'revisor')

foreach ($s in $Skills) {
  $f = Join-Path (Join-Path (Join-Path $Repo 'skills') $s) 'SKILL.md'
  if (-not (Test-Path -LiteralPath $f)) { Falha ('não encontro ' + $f + '; corre o script a partir do clone do repo') }
}

if ($Agentes) {
  foreach ($f in ($AgentesLista + 'excerto-claude-md')) {
    $p = Join-Path $AgentesFonte ($f + '.md')
    if (-not (Test-Path -LiteralPath $p)) { Falha ('não encontro ' + $p + '; corre o script a partir do clone do repo') }
  }
}

if ($Projeto) {
  if (-not (Test-Path -LiteralPath $Projeto -PathType Container)) { Falha ('-Projeto: a pasta ' + $Projeto + ' não existe') }
  $Projeto = (Resolve-Path -LiteralPath $Projeto).ProviderPath
}

$Casa = $HOME
if ($env:CLAUDE_CONFIG_DIR) { $ClaudeDir = $env:CLAUDE_CONFIG_DIR } else { $ClaudeDir = Join-Path $Casa '.claude' }

function PastaConfig([string]$a) {
  switch ($a) {
    'claude' { return $ClaudeDir }
    'codex' { return (Join-Path $Casa '.codex') }
    'cursor' { return (Join-Path $Casa '.cursor') }
    'gemini' { return (Join-Path $Casa '.gemini') }
    'copilot' { return (Join-Path $Casa '.copilot') }
    'opencode' { return (Join-Path (Join-Path $Casa '.config') 'opencode') }
  }
}

function Destino([string]$a) {
  if ($a -eq 'claude') {
    if ($Projeto) { return (Join-Path (Join-Path $Projeto '.claude') 'skills') }
    return (Join-Path $ClaudeDir 'skills')
  }
  if ($a -eq 'codex-legado') { return (Join-Path (Join-Path $Casa '.codex') 'skills') }
  if ($Projeto) { return (Join-Path (Join-Path $Projeto '.agents') 'skills') }
  return (Join-Path (Join-Path $Casa '.agents') 'skills')
}

function Curto([string]$p) {
  $q = $p -replace '\\', '/'
  $h = ($Casa -replace '\\', '/').TrimEnd('/')
  if ($q.StartsWith($h + '/')) { return '~/' + $q.Substring($h.Length + 1) }
  return $q
}

function MesmoCaminho([string]$a, [string]$b) {
  try {
    $x = [System.IO.Path]::GetFullPath($a).TrimEnd('\', '/')
    $y = [System.IO.Path]::GetFullPath($b).TrimEnd('\', '/')
  } catch { return $false }
  if ($EWindows) { return ($x -ieq $y) }
  return ($x -ceq $y)
}

function EhLigacao($item) { return ($null -ne $item -and -not [string]::IsNullOrEmpty([string]$item.LinkType)) }

function AlvoDaLigacao($item) {
  $t = $item.Target
  if ($t -is [array]) { $t = $t[0] }
  return [string]$t
}

function ListaFicheiros([string]$raiz) {
  $base = (Get-Item -LiteralPath $raiz).FullName.TrimEnd('\', '/')
  $linhas = @()
  foreach ($f in (Get-ChildItem -LiteralPath $raiz -Recurse -File -Force)) {
    $rel = $f.FullName.Substring($base.Length).TrimStart('\', '/').Replace('\', '/')
    $linhas += ($rel + ':' + (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash)
  }
  return ($linhas | Sort-Object)
}

function PastasIguais([string]$a, [string]$b) {
  $x = (@(ListaFicheiros $a)) -join '|'
  $y = (@(ListaFicheiros $b)) -join '|'
  return ($x -ceq $y)
}

# Lista final de agentes (sem repetidos, pela ordem de $Todos e depois $Legado).
$pedidos = @()
foreach ($item in $Agente) {
  foreach ($a in ($item -split '[,\s]+')) {
    if (-not $a) { continue }
    $a = $a.ToLower()
    if ($a -eq 'todos') { $pedidos += $Todos }
    elseif (($Todos + $Legado) -contains $a) { $pedidos += $a }
    else { Falha ('agente desconhecido: ' + $a + ' (claude, codex, codex-legado, cursor, gemini, copilot, opencode, todos)') }
  }
}
$escolhidos = @()
if ($pedidos.Count -gt 0) {
  foreach ($a in ($Todos + $Legado)) { if ($pedidos -contains $a) { $escolhidos += $a } }
  $origemLista = 'pedidos'
} else {
  foreach ($a in $Todos) { if (Test-Path -LiteralPath (PastaConfig $a) -PathType Container) { $escolhidos += $a } }
  $origemLista = 'detetados'
  if ($escolhidos.Count -eq 0) {
    [Console]::Error.WriteLine('install.ps1: nenhum agente detetado (procurei ' + (Curto $ClaudeDir) + ', ~/.codex, ~/.cursor, ~/.gemini, ~/.copilot, ~/.config/opencode).')
    Falha 'escolhe com -Agente claude|codex|codex-legado|cursor|gemini|copilot|opencode|todos'
  }
}
if ($Projeto -and ($escolhidos -contains 'codex-legado')) {
  Falha 'codex-legado só existe no âmbito do utilizador (~/.codex/skills); tira -Projeto ou o agente'
}
if ($Agentes -and -not ($escolhidos -contains 'claude')) {
  Falha '-Agentes copia para a pasta de agentes do Claude Code; junta -Agente claude'
}

if ($Aplicar) { $modo = 'instalar' } else { $modo = 'SIMULAÇÃO (nada muda; junta -Aplicar para instalar)' }
if ($Ligar) { $forma = 'ligações para ' + (Curto $Repo) + '/skills' } else { $forma = 'cópias' }
if ($Projeto) { $ambito = 'projeto ' + (Curto $Projeto) } else { $ambito = 'utilizador' }
Write-Output ('agentic-skills: ' + $modo)
Write-Output ('  âmbito: ' + $ambito + ' · forma: ' + $forma + ' · agentes ' + $origemLista + ': ' + ($escolhidos -join ' '))
if ($Projeto -and $Ligar) {
  Write-Output '  atenção: com -Projeto, -Ligar aponta para uma pasta desta máquina; não commites essas ligações'
}

$Carimbo = Get-Date -Format 'yyyyMMdd-HHmmss'
$pendentes = 0
$feitos = 0
$novos = 0
$destinosFeitos = @()

function InstalaUma([string]$origem, [string]$destino) {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destino) | Out-Null
  if ($Ligar) {
    if ($EWindows) { New-Item -ItemType Junction -Path $destino -Value $origem | Out-Null }
    else { New-Item -ItemType SymbolicLink -Path $destino -Value $origem | Out-Null }
  } else {
    Copy-Item -LiteralPath $origem -Destination $destino -Recurse
    if (-not $EWindows) {
      foreach ($f in (Get-ChildItem -LiteralPath $destino -Recurse -File -Filter '*.sh')) { & chmod +x $f.FullName }
    }
  }
}

foreach ($a in $escolhidos) {
  $d = Destino $a
  if ($destinosFeitos -contains $d) { continue }
  $destinosFeitos += $d
  $quem = @()
  foreach ($b in $escolhidos) { if ((Destino $b) -eq $d) { $quem += $b } }
  Write-Output ''
  Write-Output (($quem -join ', ') + ' → ' + (Curto $d))
  foreach ($s in $Skills) {
    $src = Join-Path (Join-Path $Repo 'skills') $s
    $dst = Join-Path $d $s
    $item = Get-Item -LiteralPath $dst -Force -ErrorAction SilentlyContinue
    $existe = ($null -ne $item)
    $ehLink = EhLigacao $item
    $ligadaAqui = $false
    if ($ehLink -and (MesmoCaminho (AlvoDaLigacao $item) $src)) { $ligadaAqui = $true }
    if ($Ligar -and $ligadaAqui) {
      Write-Output ('  já ligada, mantida   ' + $s)
      continue
    }
    if ($existe) {
      $igual = $false
      if ((-not $ehLink) -and $item.PSIsContainer) { $igual = PastasIguais $src $dst }
      if ((-not $Ligar) -and $igual) {
        Write-Output ('  igual, mantida       ' + $s)
        continue
      }
      if (-not $Forcar) {
        if ((-not $Ligar) -and $ligadaAqui) {
          Write-Output ('  existe, mantida      ' + $s + ' (é uma ligação para este repo; -Forcar troca-a por uma cópia)')
        } elseif ($Ligar -and (-not $ehLink) -and $igual) {
          Write-Output ('  existe, mantida      ' + $s + ' (é uma cópia igual; -Forcar troca-a por uma ligação)')
        } else {
          Write-Output ('  existe, mantida      ' + $s + ' (é diferente; -Forcar substitui e guarda a atual)')
        }
        $pendentes++
        continue
      }
      $copia = Join-Path (Join-Path (Join-Path (Join-Path $Casa '.agentic-skills-backups') $Carimbo) ($d -replace '[\\/:]', '_')) $s
      if ($Aplicar) {
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $copia) | Out-Null
        Move-Item -LiteralPath $dst -Destination $copia
        InstalaUma $src $dst
        Write-Output ('  substituída          ' + $s + ' (a anterior está em ' + (Curto $copia) + ')')
        $feitos++
      } else {
        Write-Output ('  substituiria         ' + $s + ' (a anterior iria para ' + (Curto $copia) + ')')
      }
      $novos++
      continue
    }
    if ($Aplicar) {
      InstalaUma $src $dst
      if ($Ligar) { Write-Output ('  ligada               ' + $s) } else { Write-Output ('  copiada              ' + $s) }
      $feitos++
    } else {
      if ($Ligar) { Write-Output ('  ligaria              ' + $s + ' → ' + (Curto $src)) } else { Write-Output ('  copiaria             ' + $s) }
    }
    $novos++
  }
}

# Agentes definidos (opcional): copiados sempre (são para editar), nunca sobrescritos.
$agentesNovos = 0
$agentesMantidos = 0
if ($Agentes) {
  if ($Projeto) { $da = Join-Path (Join-Path $Projeto '.claude') 'agents' } else { $da = Join-Path $ClaudeDir 'agents' }
  Write-Output ''
  Write-Output ('claude (agentes) → ' + (Curto $da))
  foreach ($f in $AgentesLista) {
    $src = Join-Path $AgentesFonte ($f + '.md')
    $dst = Join-Path $da ($f + '.md')
    $item = Get-Item -LiteralPath $dst -Force -ErrorAction SilentlyContinue
    if ($null -ne $item) {
      $igual = $false
      if ((-not (EhLigacao $item)) -and ((Get-FileHash -LiteralPath $src -Algorithm SHA256).Hash -eq (Get-FileHash -LiteralPath $dst -Algorithm SHA256).Hash)) { $igual = $true }
      if ($igual) { Write-Output ('  igual, mantido       ' + $f) }
      else { Write-Output ('  existe, mantido      ' + $f + ' (é diferente; não se sobrescreve, nem com -Forcar: compara à mão)') }
      $agentesMantidos++
      continue
    }
    if ($Aplicar) {
      New-Item -ItemType Directory -Force -Path $da | Out-Null
      Copy-Item -LiteralPath $src -Destination $dst
      Write-Output ('  copiado              ' + $f)
    } else {
      Write-Output ('  copiaria             ' + $f)
    }
    $agentesNovos++
  }
  Write-Output ''
  Write-Output 'Excerto para o teu CLAUDE.md (o instalador não o edita: cola-o à mão onde quiseres):'
  Write-Output '----------------------------------------------------------------'
  Write-Output ((Get-Content -LiteralPath (Join-Path $AgentesFonte 'excerto-claude-md.md') -Raw -Encoding UTF8).TrimEnd([char]13, [char]10))
  Write-Output '----------------------------------------------------------------'
}

$temClaude = $escolhidos -contains 'claude'
$temAgents = $false
foreach ($a in $escolhidos) { if ($a -ne 'claude') { $temAgents = $true } }
Write-Output ''
if ($temClaude -and $temAgents -and -not $Projeto) {
  Write-Output 'nota: OpenCode, Cursor e o Copilot no VS Code também leem ~/.claude/skills. O OpenCode'
  Write-Output '      (medido na 1.18) mostra uma entrada por skill, mas escolhe ao acaso a cópia de'
  Write-Output '      ~/.claude/skills ou de ~/.agents/skills: mantém as duas pastas na mesma versão.'
  if ($pendentes -gt 0 -and $novos -gt 0) {
    Write-Output 'atenção: uma pasta fica com a versão nova e outra com a que já lá estava; repete com'
    Write-Output '      -Forcar para as alinhar (as anteriores vão para ~/.agentic-skills-backups/).'
  }
}
if ($Aplicar) {
  Write-Output ('feito: ' + $feitos + ' instalada(s), ' + $pendentes + ' por instalar. Abre uma sessão nova do agente para as carregar.')
  if ($Agentes) { Write-Output ('agentes: ' + $agentesNovos + ' copiado(s), ' + $agentesMantidos + ' mantido(s).') }
  if ($pendentes -gt 0) { exit 1 }
} else {
  Write-Output ('simulação: ' + $pendentes + ' por resolver. Para instalar, repete o mesmo comando com -Aplicar.')
  if ($Agentes) { Write-Output ('agentes: ' + $agentesNovos + ' por copiar, ' + $agentesMantidos + ' já lá estão.') }
}
exit 0
