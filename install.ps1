# install.ps1: installs the eleven agentic-skills skills into coding agents.
# Windows PowerShell 5.1 or PowerShell 7 (also runs on macOS and Linux with PowerShell 7).
#
# DRY RUN by default: shows what it would do without changing anything. Only -Apply installs.
#
# Usage: .\install.ps1 [-Apply] [-Agent A[,B]] [-Project FOLDER] [-Link] [-Force] [-Agents]
#   -Apply          install
#   -Agent A        claude | codex | codex-legacy | cursor | gemini | copilot | opencode | all
#                   (comma-separated; defaults to agents whose config folder exists:
#                   ~/.claude ~/.codex ~/.cursor ~/.gemini ~/.copilot ~/.config/opencode).
#                   codex-legacy (~/.codex/skills, older Codex) is opt-in and excluded from all
#   -Project DIR    install into that repository's skill folders instead of the user's
#   -Link           links to this clone instead of copies (Windows junctions need no administrator);
#                   update with git pull
#   -Force          replace an existing skill; back up the previous one to
#                   ~/.agentic-skills-backups/<date>/
#   -Agents         optional, Claude Code only: also copy the defined agents (implementer,
#                   implementer-ui, researcher, reviewer) into its agents folder
#                   (~/.claude/agents, or <repo>/.claude/agents with -Project), without overwriting
#                   existing files (even with -Force), and print an excerpt to paste into your
#                   CLAUDE.md. The installer never edits CLAUDE.md
#   -Help           show this help
#
# With Windows' restrictive execution policy:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Apply
#
# Destinations (documented by each agent in 2026-10):
#   claude                                user: ~/.claude/skills  project: <repo>/.claude/skills
#   codex-legacy                          user: ~/.codex/skills (no project scope)
#   codex, cursor, gemini, copilot, opencode
#                                         user: ~/.agents/skills  project: <repo>/.agents/skills
# Agents sharing a folder receive one installation. CLAUDE_CONFIG_DIR, when set, replaces ~/.claude.
# Exit: 0 = done (or dry run); 1 = -Apply left skills uninstalled; 2 = usage error.
# Existing agent definitions are kept and do not affect the exit code.
[CmdletBinding()]
param(
  [switch]$Apply,
  [string[]]$Agent = @(),
  [string]$Project = '',
  [switch]$Link,
  [switch]$Force,
  [switch]$Agents,
  [switch]$Help
)
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$Script = $MyInvocation.MyCommand.Path
if ($Help) {
  $lines = Get-Content -LiteralPath $Script -Encoding UTF8
  for ($i = 1; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -notmatch '^#') { break }
    Write-Output ($lines[$i] -replace '^# ?', '')
  }
  exit 0
}

function Fail([string]$Message, [int]$Code = 2) {
  [Console]::Error.WriteLine('install.ps1: ' + $Message)
  exit $Code
}

$RunningOnWindows = $true
if (Get-Variable -Name IsWindows -ErrorAction SilentlyContinue) { $RunningOnWindows = [bool]$IsWindows }

$Repo = (Get-Item -LiteralPath (Split-Path -Parent $Script)).FullName
$Skills = @('agentic-project', 'agentic-feature', 'agentic-fix', 'agentic-implement', 'agentic-design', 'agentic-code-review', 'agentic-architecture', 'agentic-explain', 'agentic-ci-audit', 'agentic-tool-design', 'agentic-analysis-optimization')
$All = @('claude', 'codex', 'cursor', 'gemini', 'copilot', 'opencode')
$Legacy = @('codex-legacy')
# Claude Code agent definitions (-Agents) are agentic-implement assets.
$AgentsSource = Join-Path (Join-Path (Join-Path (Join-Path $Repo 'skills') 'agentic-implement') 'assets') 'agents'
$AgentsList = @('implementer', 'implementer-ui', 'researcher', 'reviewer')

foreach ($s in $Skills) {
  $f = Join-Path (Join-Path (Join-Path $Repo 'skills') $s) 'SKILL.md'
  if (-not (Test-Path -LiteralPath $f)) { Fail ('cannot find ' + $f + '; run the script from the repository clone') }
}
if ($Agents) {
  foreach ($f in ($AgentsList + 'claude-md-excerpt')) {
    $p = Join-Path $AgentsSource ($f + '.md')
    if (-not (Test-Path -LiteralPath $p)) { Fail ('cannot find ' + $p + '; run the script from the repository clone') }
  }
}
if ($Project) {
  if (-not (Test-Path -LiteralPath $Project -PathType Container)) { Fail ('-Project: folder ' + $Project + ' does not exist') }
  $Project = (Resolve-Path -LiteralPath $Project).ProviderPath
}

$UserRoot = $HOME
if ($env:CLAUDE_CONFIG_DIR) { $ClaudeDir = $env:CLAUDE_CONFIG_DIR } else { $ClaudeDir = Join-Path $UserRoot '.claude' }

function ConfigFolder([string]$a) {
  switch ($a) {
    'claude' { return $ClaudeDir }
    'codex' { return (Join-Path $UserRoot '.codex') }
    'cursor' { return (Join-Path $UserRoot '.cursor') }
    'gemini' { return (Join-Path $UserRoot '.gemini') }
    'copilot' { return (Join-Path $UserRoot '.copilot') }
    'opencode' { return (Join-Path (Join-Path $UserRoot '.config') 'opencode') }
  }
}
function Destination([string]$a) {
  if ($a -eq 'claude') {
    if ($Project) { return (Join-Path (Join-Path $Project '.claude') 'skills') }
    return (Join-Path $ClaudeDir 'skills')
  }
  if ($a -eq 'codex-legacy') { return (Join-Path (Join-Path $UserRoot '.codex') 'skills') }
  if ($Project) { return (Join-Path (Join-Path $Project '.agents') 'skills') }
  return (Join-Path (Join-Path $UserRoot '.agents') 'skills')
}
function ShortPath([string]$p) {
  $q = $p -replace '\\', '/'
  $h = ($UserRoot -replace '\\', '/').TrimEnd('/')
  if ($q.StartsWith($h + '/')) { return '~/' + $q.Substring($h.Length + 1) }
  return $q
}
function SamePath([string]$a, [string]$b) {
  try {
    $x = [System.IO.Path]::GetFullPath($a).TrimEnd('\', '/')
    $y = [System.IO.Path]::GetFullPath($b).TrimEnd('\', '/')
  } catch { return $false }
  if ($RunningOnWindows) { return ($x -ieq $y) }
  return ($x -ceq $y)
}
function IsLink($item) { return ($null -ne $item -and -not [string]::IsNullOrEmpty([string]$item.LinkType)) }
function LinkTarget($item) {
  $t = $item.Target
  if ($t -is [array]) { $t = $t[0] }
  return [string]$t
}
function FileList([string]$root) {
  $base = (Get-Item -LiteralPath $root).FullName.TrimEnd('\', '/')
  $lines = @()
  foreach ($f in (Get-ChildItem -LiteralPath $root -Recurse -File -Force)) {
    $rel = $f.FullName.Substring($base.Length).TrimStart('\', '/').Replace('\', '/')
    $lines += ($rel + ':' + (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash)
  }
  return ($lines | Sort-Object)
}
function SameFolders([string]$a, [string]$b) {
  $x = (@(FileList $a)) -join '|'
  $y = (@(FileList $b)) -join '|'
  return ($x -ceq $y)
}

# Final agent list: deduplicated, in $All then $Legacy order.
$requested = @()
foreach ($item in $Agent) {
  foreach ($a in ($item -split '[,\s]+')) {
    if (-not $a) { continue }
    $a = $a.ToLower()
    if ($a -eq 'all') { $requested += $All }
    elseif (($All + $Legacy) -contains $a) { $requested += $a }
    else { Fail ('unknown agent: ' + $a + ' (claude, codex, codex-legacy, cursor, gemini, copilot, opencode, all)') }
  }
}
$selected = @()
if ($requested.Count -gt 0) {
  foreach ($a in ($All + $Legacy)) { if ($requested -contains $a) { $selected += $a } }
  $listSource = 'requested'
} else {
  foreach ($a in $All) { if (Test-Path -LiteralPath (ConfigFolder $a) -PathType Container) { $selected += $a } }
  $listSource = 'detected'
  if ($selected.Count -eq 0) {
    [Console]::Error.WriteLine('install.ps1: no agents detected (looked for ' + (ShortPath $ClaudeDir) + ', ~/.codex, ~/.cursor, ~/.gemini, ~/.copilot, ~/.config/opencode).')
    Fail 'choose with -Agent claude|codex|codex-legacy|cursor|gemini|copilot|opencode|all'
  }
}
if ($Project -and ($selected -contains 'codex-legacy')) { Fail 'codex-legacy only supports user scope (~/.codex/skills); remove -Project or that agent' }
if ($Agents -and -not ($selected -contains 'claude')) { Fail "-Agents copies into Claude Code's agents folder; add -Agent claude" }

if ($Apply) { $mode = 'install' } else { $mode = 'DRY RUN (nothing changes; add -Apply to install)' }
if ($Link) { $form = 'links to ' + (ShortPath $Repo) + '/skills' } else { $form = 'copies' }
if ($Project) { $scope = 'project ' + (ShortPath $Project) } else { $scope = 'user' }
Write-Output ('agentic-skills: ' + $mode)
Write-Output ('  scope: ' + $scope + ' · form: ' + $form + ' · ' + $listSource + ' agents: ' + ($selected -join ' '))
if ($Project -and $Link) { Write-Output '  notice: with -Project, -Link points to a folder on this machine; do not commit those links' }

$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$pending = 0
$installed = 0
$new = 0
$handledDestinations = @()
function InstallOne([string]$source, [string]$destination) {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
  if ($Link) {
    if ($RunningOnWindows) { New-Item -ItemType Junction -Path $destination -Value $source | Out-Null }
    else { New-Item -ItemType SymbolicLink -Path $destination -Value $source | Out-Null }
  } else {
    Copy-Item -LiteralPath $source -Destination $destination -Recurse
    if (-not $RunningOnWindows) {
      foreach ($f in (Get-ChildItem -LiteralPath $destination -Recurse -File -Filter '*.sh')) { & chmod +x $f.FullName }
    }
  }
}
foreach ($a in $selected) {
  $d = Destination $a
  if ($handledDestinations -contains $d) { continue }
  $handledDestinations += $d
  $readers = @()
  foreach ($b in $selected) { if ((Destination $b) -eq $d) { $readers += $b } }
  Write-Output ''
  Write-Output (($readers -join ', ') + ' → ' + (ShortPath $d))
  foreach ($s in $Skills) {
    $src = Join-Path (Join-Path $Repo 'skills') $s
    $dst = Join-Path $d $s
    $item = Get-Item -LiteralPath $dst -Force -ErrorAction SilentlyContinue
    $exists = ($null -ne $item)
    $isLink = IsLink $item
    $linkedHere = $false
    if ($isLink -and (SamePath (LinkTarget $item) $src)) { $linkedHere = $true }
    if ($Link -and $linkedHere) { Write-Output ('  already linked, kept ' + $s); continue }
    if ($exists) {
      $equal = $false
      if ((-not $isLink) -and $item.PSIsContainer) { $equal = SameFolders $src $dst }
      if ((-not $Link) -and $equal) { Write-Output ('  identical, kept      ' + $s); continue }
      if (-not $Force) {
        if ((-not $Link) -and $linkedHere) { Write-Output ('  exists, kept         ' + $s + ' (a link to this clone; -Force replaces it with a copy)') }
        elseif ($Link -and (-not $isLink) -and $equal) { Write-Output ('  exists, kept         ' + $s + ' (an identical copy; -Force replaces it with a link)') }
        else { Write-Output ('  exists, kept         ' + $s + ' (different; -Force replaces and backs up the current version)') }
        $pending++
        continue
      }
      $backup = Join-Path (Join-Path (Join-Path (Join-Path $UserRoot '.agentic-skills-backups') $Stamp) ($d -replace '[\\/:]', '_')) $s
      if ($Apply) {
        New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backup) | Out-Null
        Move-Item -LiteralPath $dst -Destination $backup
        InstallOne $src $dst
        Write-Output ('  replaced             ' + $s + ' (previous version in ' + (ShortPath $backup) + ')')
        $installed++
      } else { Write-Output ('  would replace        ' + $s + ' (previous version would go to ' + (ShortPath $backup) + ')') }
      $new++
      continue
    }
    if ($Apply) {
      InstallOne $src $dst
      if ($Link) { Write-Output ('  linked               ' + $s) } else { Write-Output ('  copied               ' + $s) }
      $installed++
    } else {
      if ($Link) { Write-Output ('  would link           ' + $s + ' → ' + (ShortPath $src)) } else { Write-Output ('  would copy           ' + $s) }
    }
    $new++
  }
}

# Optional agent definitions: always copied for editing, never overwritten.
$newAgents = 0
$keptAgents = 0
if ($Agents) {
  if ($Project) { $da = Join-Path (Join-Path $Project '.claude') 'agents' } else { $da = Join-Path $ClaudeDir 'agents' }
  Write-Output ''
  Write-Output ('claude (agents) → ' + (ShortPath $da))
  foreach ($f in $AgentsList) {
    $src = Join-Path $AgentsSource ($f + '.md')
    $dst = Join-Path $da ($f + '.md')
    $item = Get-Item -LiteralPath $dst -Force -ErrorAction SilentlyContinue
    if ($null -ne $item) {
      $equal = $false
      if ((-not (IsLink $item)) -and ((Get-FileHash -LiteralPath $src -Algorithm SHA256).Hash -eq (Get-FileHash -LiteralPath $dst -Algorithm SHA256).Hash)) { $equal = $true }
      if ($equal) { Write-Output ('  identical, kept      ' + $f) }
      else { Write-Output ('  exists, kept         ' + $f + ' (different; never overwritten, even with -Force: compare by hand)') }
      $keptAgents++
      continue
    }
    if ($Apply) {
      New-Item -ItemType Directory -Force -Path $da | Out-Null
      Copy-Item -LiteralPath $src -Destination $dst
      Write-Output ('  copied               ' + $f)
    } else { Write-Output ('  would copy           ' + $f) }
    $newAgents++
  }
  Write-Output ''
  Write-Output 'Excerpt for your CLAUDE.md (the installer never edits it: paste it where you want):'
  Write-Output '----------------------------------------------------------------'
  Write-Output ((Get-Content -LiteralPath (Join-Path $AgentsSource 'claude-md-excerpt.md') -Raw -Encoding UTF8).TrimEnd([char]13, [char]10))
  Write-Output '----------------------------------------------------------------'
}
$hasClaude = $selected -contains 'claude'
$hasAgents = $false
foreach ($a in $selected) { if ($a -ne 'claude') { $hasAgents = $true } }
Write-Output ''
if ($hasClaude -and $hasAgents -and -not $Project) {
  Write-Output 'note: OpenCode, Cursor and Copilot in VS Code also read ~/.claude/skills. OpenCode'
  Write-Output '      (measured in 1.18) lists each skill once, but randomly picks the copy from'
  Write-Output '      ~/.claude/skills or ~/.agents/skills: keep both folders at the same version.'
  if ($pending -gt 0 -and $new -gt 0) {
    Write-Output 'notice: one folder gets the new version and another keeps the existing version; repeat with'
    Write-Output '      -Force to align them (previous versions go to ~/.agentic-skills-backups/).'
  }
}
if ($Apply) {
  Write-Output ('done: ' + $installed + ' installed, ' + $pending + ' pending. Open a new agent session to load them.')
  if ($Agents) { Write-Output ('agents: ' + $newAgents + ' copied, ' + $keptAgents + ' kept.') }
  if ($pending -gt 0) { exit 1 }
} else {
  Write-Output ('dry run: ' + $pending + ' unresolved. To install, repeat the same command with -Apply.')
  if ($Agents) { Write-Output ('agents: ' + $newAgents + ' to copy, ' + $keptAgents + ' already present.') }
}
exit 0
