// Testes do install.ps1 (node --test, a partir da raiz do repo). Herméticos: HOME temporário e o
// PowerShell do sistema (pwsh ou powershell); sem PowerShell, saltam com o motivo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(RAIZ, "install.ps1");
const PS = ["pwsh", "powershell"].find((b) => spawnSync(b, ["-NoProfile", "-Command", "exit 0"]).status === 0);
const opcoes = { skip: PS ? false : "sem PowerShell (pwsh ou powershell) nesta máquina" };
const DEZ = ["agentic-analysis-optimization", "agentic-architecture", "agentic-ci-audit", "agentic-code-review", "agentic-design", "agentic-feature", "agentic-fix", "agentic-implement", "agentic-project", "agentic-tool-design"];

function casa(t, pastas = []) {
  const home = mkdtempSync(path.join(tmpdir(), "install-ps1-"));
  for (const p of pastas) mkdirSync(path.join(home, p), { recursive: true });
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  delete env.CLAUDE_CONFIG_DIR;
  const corre = (...args) => {
    const r = spawnSync(PS, ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", SCRIPT, ...args], { env, encoding: "utf8" });
    return { status: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
  };
  return { home, corre };
}

test("o install.ps1 começa com BOM (o Windows PowerShell 5.1 lê UTF-8 só com ele)", () => {
  assert.deepEqual([...readFileSync(SCRIPT).subarray(0, 3)], [0xef, 0xbb, 0xbf]);
});

test("sem agentes detetados sai 2 e diz como escolher", opcoes, (t) => {
  const { corre } = casa(t);
  const r = corre();
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /nenhum agente detetado/);
});

test("simulação deteta os agentes pelas pastas e não cria nada", opcoes, (t) => {
  const { home, corre } = casa(t, [".claude", ".codex"]);
  const r = corre();
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /SIMULAÇÃO/);
  assert.match(r.out, /^claude → ~\/\.claude\/skills$/m);
  assert.match(r.out, /^codex → ~\/\.agents\/skills$/m);
  for (const nome of DEZ) assert.match(r.out, new RegExp("^\\s+copiaria\\s+" + nome + "$", "m"));
  assert.ok(!existsSync(path.join(home, ".claude", "skills")));
  assert.ok(!existsSync(path.join(home, ".agents")));
});

test("-Aplicar copia as dez skills para o Claude e o Codex, e a 2.ª corrida não muda nada", opcoes, (t) => {
  const { home, corre } = casa(t);
  const r = corre("-Aplicar", "-Agente", "claude,codex");
  assert.equal(r.status, 0, r.out);
  for (const pasta of [".claude", ".agents"]) {
    const destino = path.join(home, pasta, "skills");
    assert.deepEqual(readdirSync(destino).sort(), DEZ, destino);
    assert.ok(existsSync(path.join(destino, "agentic-code-review", "scripts", "validar-relatorio.mjs")));
    assert.ok(existsSync(path.join(destino, "agentic-architecture", "licenses", "LICENSE")));
  }
  const de_novo = corre("-Aplicar", "-Agente", "claude,codex");
  assert.equal(de_novo.status, 0, de_novo.out);
  assert.match(de_novo.out, /feito: 0 instalada\(s\), 0 por instalar/);
  assert.match(de_novo.out, /igual, mantida\s+agentic-project/);
});

test("nunca sobrescreve sem -Forcar; com -Forcar guarda a anterior", opcoes, (t) => {
  const { home, corre } = casa(t);
  const alheia = path.join(home, ".claude", "skills", "agentic-feature");
  mkdirSync(alheia, { recursive: true });
  writeFileSync(path.join(alheia, "SKILL.md"), "minha versão\n");
  const r = corre("-Aplicar", "-Agente", "claude");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /existe, mantida\s+agentic-feature/);
  assert.equal(readFileSync(path.join(alheia, "SKILL.md"), "utf8"), "minha versão\n");
  const f = corre("-Aplicar", "-Agente", "claude", "-Forcar");
  assert.equal(f.status, 0, f.out);
  assert.match(f.out, /substituída\s+agentic-feature/);
  const copias = path.join(home, ".agentic-skills-backups");
  const carimbo = readdirSync(copias)[0];
  const sub = readdirSync(path.join(copias, carimbo))[0];
  assert.equal(readFileSync(path.join(copias, carimbo, sub, "agentic-feature", "SKILL.md"), "utf8"), "minha versão\n");
});

test("-Ligar cria ligações para o clone e repetir mantém-nas", opcoes, (t) => {
  const { home, corre } = casa(t);
  const r = corre("-Aplicar", "-Ligar", "-Agente", "gemini,claude");
  assert.equal(r.status, 0, r.out);
  for (const d of [".agents/skills", ".claude/skills"]) {
    const l = path.join(home, d, "agentic-project");
    assert.ok(lstatSync(l).isSymbolicLink() || process.platform === "win32", d + " não é ligação");
    assert.ok(existsSync(path.join(l, "SKILL.md")), d);
  }
  const de_novo = corre("-Aplicar", "-Ligar", "-Agente", "todos");
  assert.equal(de_novo.status, 0, de_novo.out);
  assert.match(de_novo.out, /já ligada, mantida\s+agentic-feature/);
  assert.match(de_novo.out, /^codex, cursor, gemini, copilot, opencode → ~\/\.agents\/skills$/m);
});

test("-Projeto instala nas pastas do repositório e não no HOME", opcoes, (t) => {
  const { home, corre } = casa(t);
  const repo = path.join(home, "repo");
  mkdirSync(repo);
  const r = corre("-Aplicar", "-Projeto", repo, "-Agente", "claude,copilot");
  assert.equal(r.status, 0, r.out);
  assert.ok(existsSync(path.join(repo, ".claude", "skills", "agentic-feature", "SKILL.md")));
  assert.ok(existsSync(path.join(repo, ".agents", "skills", "agentic-feature", "SKILL.md")));
  assert.ok(!existsSync(path.join(home, ".claude", "skills")));
});

test("codex-legado instala em ~/.codex/skills; agente desconhecido sai 2", opcoes, (t) => {
  const { home, corre } = casa(t);
  const r = corre("-Aplicar", "-Agente", "codex-legado");
  assert.equal(r.status, 0, r.out);
  assert.ok(existsSync(path.join(home, ".codex", "skills", "agentic-project", "SKILL.md")));
  assert.ok(!existsSync(path.join(home, ".agents")));
  const mau = corre("-Agente", "emacs");
  assert.equal(mau.status, 2, mau.out);
  assert.match(mau.out, /agente desconhecido: emacs/);
});

test("-Ajuda imprime o uso e sai 0", opcoes, (t) => {
  const { corre } = casa(t);
  const r = corre("-Ajuda");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /-Aplicar/);
  assert.match(r.out, /codex-legado/);
  assert.match(r.out, /\[-Agentes\]/);
  assert.match(r.out, /O instalador nunca edita o CLAUDE\.md/);
});

// --- -Agentes: os agentes definidos do Claude Code (opcional, nunca sobrescreve, nunca edita o CLAUDE.md)
const FONTE_AGENTES = path.join(RAIZ, "skills", "agentic-implement", "assets", "agentes");
const QUATRO_AGENTES = ["implementador", "implementador-ui", "pesquisador", "revisor"];

test("-Agentes: a simulação diz o que copiaria e mostra o excerto; nada é criado", opcoes, (t) => {
  const { home, corre } = casa(t, [".claude"]);
  const r = corre("-Agente", "claude", "-Agentes");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^claude \(agentes\) → ~\/\.claude\/agents$/m);
  for (const a of QUATRO_AGENTES) assert.match(r.out, new RegExp("^\\s+copiaria\\s+" + a + "$", "m"), a);
  assert.match(r.out, /Excerto para o teu CLAUDE\.md/);
  assert.match(r.out, /^## Agentes e modelos por tarefa$/m);
  assert.match(r.out, /^agentes: 4 por copiar, 0 já lá estão\.$/m);
  assert.ok(!existsSync(path.join(home, ".claude", "agents")));
});

test("-Aplicar -Agentes copia só os quatro agentes e não edita o CLAUDE.md", opcoes, (t) => {
  const { home, corre } = casa(t, [".claude"]);
  const claudeMd = path.join(home, ".claude", "CLAUDE.md");
  writeFileSync(claudeMd, "as minhas regras\n");
  const r = corre("-Aplicar", "-Agente", "claude", "-Agentes");
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(readdirSync(path.join(home, ".claude", "agents")).sort(), QUATRO_AGENTES.map((a) => a + ".md").sort());
  for (const a of QUATRO_AGENTES) {
    assert.deepEqual(readFileSync(path.join(home, ".claude", "agents", a + ".md")), readFileSync(path.join(FONTE_AGENTES, a + ".md")), a);
  }
  assert.match(r.out, /^agentes: 4 copiado\(s\), 0 mantido\(s\)\.$/m);
  assert.equal(readFileSync(claudeMd, "utf8"), "as minhas regras\n");
});

test("-Agentes nunca sobrescreve, nem com -Forcar; com -Projeto copia para <repo>/.claude/agents", opcoes, (t) => {
  const { home, corre } = casa(t, [".claude/agents"]);
  const meu = path.join(home, ".claude", "agents", "revisor.md");
  writeFileSync(meu, "o meu revisor\n");
  const r = corre("-Aplicar", "-Agente", "claude", "-Agentes", "-Forcar");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^\s+existe, mantido\s+revisor \(é diferente; não se sobrescreve/m);
  assert.equal(readFileSync(meu, "utf8"), "o meu revisor\n");
  const de_novo = corre("-Aplicar", "-Agente", "claude", "-Agentes");
  assert.match(de_novo.out, /^\s+igual, mantido\s+implementador$/m);
  const repo = path.join(home, "repo");
  mkdirSync(repo);
  const p = corre("-Aplicar", "-Projeto", repo, "-Agente", "claude", "-Agentes");
  assert.equal(p.status, 0, p.out);
  assert.ok(existsSync(path.join(repo, ".claude", "agents", "pesquisador.md")));
});

test("-Agentes sem o Claude Code entre os agentes sai 2 e não copia nada", opcoes, (t) => {
  const { home, corre } = casa(t, [".codex"]);
  const r = corre("-Agente", "codex", "-Agentes");
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /-Agentes copia para a pasta de agentes do Claude Code; junta -Agente claude/);
  assert.ok(!existsSync(path.join(home, ".claude")));
});
