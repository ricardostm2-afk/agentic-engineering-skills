// Testes do preparar-repo.sh e do pre-commit que ele gera (node --test scripts/*.test.mjs, na
// pasta da skill; o glob sem aspas).
// Herméticos: cada teste cria um repositório numa pasta temporária (os.tmpdir(), segue o TMPDIR),
// com HOME próprio (sem skills nem plugins do utilizador) e git sem configuração global.
// O detetor de slop é um duplo simples (bloqueia linhas com «SLOP», salvo «slop-ok:» na linha
// anterior); um teste à parte usa o detetor real da agentic-design quando ela está ao lado.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, existsSync, rmSync, copyFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(AQUI, "preparar-repo.sh");
const DETETOR_REAL = [process.env.AGENTIC_DESIGN_DIR, path.join(AQUI, "..", "..", "agentic-design")]
  .filter(Boolean)
  .map((d) => path.join(d, "scripts", "detetar-slop.mjs"))
  .find((f) => existsSync(f));

const DUPLO = `import { readFileSync } from "node:fs";
const ficheiros = process.argv.slice(2).filter((a) => a !== "--json");
const achados = [];
for (const f of ficheiros) {
  const linhas = readFileSync(f, "utf8").split("\\n");
  linhas.forEach((l, i) => {
    if (l.includes("SLOP") && !(linhas[i - 1] || "").includes("slop-ok:"))
      achados.push({ ficheiro: f, linha: i + 1, regra: "duplo", severidade: "bloqueio", mensagem: "SLOP", sugestao: "tira-o" });
  });
}
const resumo = { ficheiros: ficheiros.length, bloqueios: achados.length, avisos: 0, porRegra: {} };
process.stdout.write(JSON.stringify({ resumo, achados }));
process.exitCode = achados.length ? 1 : 0;
`;

function ambiente(raiz) {
  const home = path.join(raiz, "home");
  mkdirSync(home, { recursive: true });
  const env = { ...process.env, HOME: home, GIT_CONFIG_GLOBAL: path.join(raiz, "gitconfig-vazio"), GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
  delete env.AGENTIC_DESIGN_DIR;
  delete env.CLAUDE_CONFIG_DIR;
  writeFileSync(env.GIT_CONFIG_GLOBAL, "");
  return env;
}

function novoRepo(t) {
  const raiz = mkdtempSync(path.join(tmpdir(), "preparar-teste-"));
  t.after(() => rmSync(raiz, { recursive: true, force: true }));
  const repo = path.join(raiz, "repo");
  mkdirSync(repo);
  const env = ambiente(raiz);
  const git = (...a) => execFileSync("git", a, { cwd: repo, env, encoding: "utf8" });
  const sh = (args, extra = {}) => spawnSync("bash", [SCRIPT, ...args], { cwd: repo, env: { ...env, ...extra }, encoding: "utf8" });
  // O git manda a saída dos hooks para stderr: «out» junta as duas.
  const commit = (msg, extra = {}) => {
    const p = spawnSync("git", ["commit", "-qm", msg], { cwd: repo, env: { ...env, ...extra }, encoding: "utf8" });
    return { status: p.status, out: p.stdout + p.stderr };
  };
  const escreve = (rel, txt) => { mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true }); writeFileSync(path.join(repo, rel), txt); };
  return { raiz, repo, env, git, sh, commit, escreve };
}

// Repositório com hooks aplicados e um css com SLOP antigo commitado antes dos hooks.
function repoComHooks(t, { versionado = true, detetor = DUPLO } = {}) {
  const r = novoRepo(t);
  r.git("init", "-q", "-b", "main");
  r.escreve("src/legado.css", ".a { x: SLOP; }\n.b { color: var(--x); }\n");
  r.escreve("src/escapado.css", "/* slop-ok: aprovado pelo dono, D-001 */\n.c { x: SLOP; }\n");
  r.git("add", "src");
  r.git("commit", "-qm", "base");
  assert.equal(r.sh(["--aplicar", "--dir", r.repo]).status, 0);
  if (versionado) {
    r.escreve(".agentic/detetar-slop.mjs", detetor);
    r.git("add", ".agentic/detetar-slop.mjs");
    r.git("commit", "-qm", "detetor", "--no-verify");
  }
  return r;
}

test("--mostrar imprime o hook atual com a marca de versão; nome desconhecido sai 2", () => {
  const ok = spawnSync("bash", [SCRIPT, "--mostrar", "pre-commit"], { encoding: "utf8" });
  assert.equal(ok.status, 0);
  assert.match(ok.stdout, /^#!\/usr\/bin\/env bash/);
  assert.match(ok.stdout, /agentic-project:pre-commit:3/);
  assert.equal(spawnSync("bash", ["-n"], { input: ok.stdout }).status, 0, "o hook gerado tem sintaxe bash válida");
  assert.equal(spawnSync("bash", [SCRIPT, "--mostrar", "xpto"], { encoding: "utf8" }).status, 2);
});

test("simulação não toca em nada; --aplicar cria; a 2.ª corrida já não tem nada por fazer", (t) => {
  const r = novoRepo(t);
  const sim = r.sh(["--dir", r.repo]);
  assert.equal(sim.status, 0);
  assert.match(sim.stdout, /criaria\s+\.githooks\/pre-commit/);
  assert.ok(!existsSync(path.join(r.repo, ".git")), "a simulação não fez git init");
  assert.equal(r.sh(["--aplicar", "--dir", r.repo]).status, 0);
  assert.equal(r.git("config", "--get", "core.hooksPath").trim(), ".githooks");
  assert.match(readFileSync(path.join(r.repo, ".gitignore"), "utf8"), /^\.claude\/settings\.local\.json$/m);
  assert.match(r.sh(["--dir", r.repo]).stdout, /nada por fazer, o repositório já está preparado/);
});

test("avisos contam como pendentes: .gitignore sem .env e pre-commit sem detetor", (t) => {
  const r = novoRepo(t);
  r.git("init", "-q", "-b", "main");
  r.escreve(".gitignore", "node_modules/\n");
  r.escreve(".githooks/pre-commit", "#!/bin/sh\nexit 0\n");
  const out = r.sh(["--dir", r.repo]).stdout;
  assert.match(out, /aviso\s+\.gitignore não tem a linha '\.env'/);
  assert.match(out, /aviso\s+\.githooks\/pre-commit não corre o detetar-slop/);
  assert.match(out, /Pendente: 2 item\(ns\)/);
  assert.doesNotMatch(out, /já está preparado/);
  // Num projeto sem UI, a linha n.a. fecha o aviso do detetor.
  r.escreve(".githooks/pre-commit", "#!/bin/sh\n# detetar-slop: n.a. (sem UI, D-001)\nexit 0\n");
  assert.match(r.sh(["--dir", r.repo]).stdout, /Pendente: 1 item\(ns\)/);
});

test("pre-commit de uma versão anterior (sem a marca) dá aviso pendente", (t) => {
  const r = novoRepo(t);
  r.git("init", "-q", "-b", "main");
  const atual = spawnSync("bash", [SCRIPT, "--mostrar", "pre-commit"], { encoding: "utf8" }).stdout;
  r.escreve(".githooks/pre-commit", atual.replace("agentic-project:pre-commit:3", "versao-antiga"));
  const out = r.sh(["--dir", r.repo]).stdout;
  assert.match(out, /vem de uma versão anterior/);
  assert.match(out, /Pendente: 1 item\(ns\)/);
});

test("hook: um bloqueio antigo numa linha não tocada não pára o commit e sai como pré-existente", (t) => {
  const r = repoComHooks(t);
  r.escreve("src/legado.css", ".a { x: SLOP; }\n.b { color: var(--y); }\n");
  r.git("add", "src/legado.css");
  const c = r.commit("muda a linha 2");
  assert.equal(c.status, 0, c.out);
  assert.match(c.out, /src\/legado\.css:1\s+pré-existente/);
  assert.match(c.out, /0 bloqueio\(s\) em linhas alteradas, 1 pré-existente/);
});

test("hook: um bloqueio numa linha acrescentada pára o commit", (t) => {
  const r = repoComHooks(t);
  appendFileSync(path.join(r.repo, "src/legado.css"), ".d { x: SLOP; }\n");
  r.git("add", "src/legado.css");
  const c = r.commit("acrescenta slop");
  assert.equal(c.status, 1);
  assert.match(c.out, /src\/legado\.css:3\s+bloqueio/);
  assert.match(c.out, /FALHOU: detetar-slop/);
});

test("hook: apagar o slop-ok de cima de uma linha antiga desmascara-a e bloqueia", (t) => {
  const r = repoComHooks(t);
  r.escreve("src/escapado.css", ".c { x: SLOP; }\n");
  r.git("add", "src/escapado.css");
  const c = r.commit("tira o escape");
  assert.equal(c.status, 1, c.out);
  assert.match(c.out, /src\/escapado\.css:1\s+bloqueio/);
});

test("hook: com a cópia versionada em falta falha fechado; sem cópia versionada só avisa", (t) => {
  const r = repoComHooks(t);
  rmSync(path.join(r.repo, ".agentic/detetar-slop.mjs"));
  appendFileSync(path.join(r.repo, "src/legado.css"), ".e { color: blue; }\n");
  r.git("add", "src/legado.css");
  const c = r.commit("sem detetor");
  assert.equal(c.status, 1);
  assert.match(c.out, /FALHOU: detetar-slop: detetar-slop\.mjs não encontrado/);

  const s = repoComHooks(t, { versionado: false });
  appendFileSync(path.join(s.repo, "src/legado.css"), ".e { color: blue; }\n");
  s.git("add", "src/legado.css");
  const d = s.commit("sem detetor, sem cópia");
  assert.equal(d.status, 0, d.out);
  assert.match(d.out, /AVISO: detetar-slop\.mjs não encontrado.*UI NÃO verificada/);
});

test("hook: encontra o detetor em $AGENTIC_DESIGN_DIR", (t) => {
  const r = repoComHooks(t, { versionado: false });
  const design = path.join(r.raiz, "design");
  mkdirSync(path.join(design, "scripts"), { recursive: true });
  writeFileSync(path.join(design, "scripts", "detetar-slop.mjs"), DUPLO);
  r.escreve("src/novo.css", ".f { x: SLOP; }\n");
  r.git("add", "src/novo.css");
  const c = r.commit("novo com slop", { AGENTIC_DESIGN_DIR: design });
  assert.equal(c.status, 1);
  assert.match(c.out, /src\/novo\.css:1\s+bloqueio/);
});

test("--com-ui copia o detetor e as regras; uma cópia diferente da skill dá aviso", (t) => {
  const r = novoRepo(t);
  const design = path.join(r.raiz, "design");
  mkdirSync(path.join(design, "scripts"), { recursive: true });
  mkdirSync(path.join(design, "references"), { recursive: true });
  writeFileSync(path.join(design, "scripts", "detetar-slop.mjs"), DUPLO);
  writeFileSync(path.join(design, "references", "ui-sem-slop.md"), "# regras\n");
  // Cópia do script sozinha numa pasta: sem irmã ao lado, sem skills no HOME de teste.
  const isolado = path.join(r.raiz, "isolado", "agentic-project", "scripts");
  mkdirSync(isolado, { recursive: true });
  copyFileSync(SCRIPT, path.join(isolado, "preparar-repo.sh"));
  const sem = spawnSync("bash", [path.join(isolado, "preparar-repo.sh"), "--com-ui", "--dir", r.repo], { cwd: r.repo, env: r.env, encoding: "utf8" });
  assert.match(sem.stdout, /--com-ui: agentic-design não encontrada/);
  const ap = r.sh(["--aplicar", "--com-ui", "--dir", r.repo], { AGENTIC_DESIGN_DIR: design });
  assert.equal(ap.status, 0);
  assert.equal(readFileSync(path.join(r.repo, ".agentic/ui-sem-slop.md"), "utf8"), "# regras\n");
  appendFileSync(path.join(design, "references", "ui-sem-slop.md"), "nova regra\n");
  const de_novo = r.sh(["--dir", r.repo], { AGENTIC_DESIGN_DIR: design });
  assert.match(de_novo.stdout, /aviso\s+\.agentic\/ui-sem-slop\.md difere da agentic-design instalada/);
});

test("hook com o detetor real da agentic-design: 10px antigo passa, 9px novo bloqueia", { skip: DETETOR_REAL ? false : "agentic-design não está ao lado nem em $AGENTIC_DESIGN_DIR" }, (t) => {
  const r = repoComHooks(t, { detetor: readFileSync(DETETOR_REAL, "utf8") });
  r.escreve("src/ecrã.css", ".a { font-size: 10px; }\n");
  r.git("add", "src/ecrã.css");
  r.git("commit", "-qm", "antigo", "--no-verify");
  appendFileSync(path.join(r.repo, "src/ecrã.css"), ".b { color: red; }\n");
  r.git("add", "src/ecrã.css");
  const ok = r.commit("muda outra linha");
  assert.equal(ok.status, 0, ok.out);
  assert.match(ok.out, /src\/ecrã\.css:1\s+pré-existente\s+letra-pequena/);
  appendFileSync(path.join(r.repo, "src/ecrã.css"), ".c { font-size: 9px; }\n");
  r.git("add", "src/ecrã.css");
  const mau = r.commit("letra pequena nova");
  assert.equal(mau.status, 1);
  assert.match(mau.out, /src\/ecrã\.css:3\s+bloqueio\s+letra-pequena/);
});

test("hook: encontra o detetor em ~/.agents/skills (Codex, Cursor, Gemini, Copilot, OpenCode)", (t) => {
  const r = repoComHooks(t, { versionado: false });
  const pasta = path.join(r.env.HOME, ".agents", "skills", "agentic-design", "scripts");
  mkdirSync(pasta, { recursive: true });
  writeFileSync(path.join(pasta, "detetar-slop.mjs"), DUPLO);
  r.escreve("src/novo.css", ".f { x: SLOP; }\n");
  r.git("add", "src/novo.css");
  const c = r.commit("novo com slop");
  assert.equal(c.status, 1, c.out);
  assert.match(c.out, /src\/novo\.css:1\s+bloqueio/);
});

test("--com-ui encontra a agentic-design irmã, ao lado desta skill, sem variável", { skip: existsSync(path.join(AQUI, "..", "..", "agentic-design", "scripts", "detetar-slop.mjs")) ? false : "agentic-design não está ao lado" }, (t) => {
  const r = novoRepo(t);
  const ap = r.sh(["--aplicar", "--com-ui", "--dir", r.repo]);
  assert.equal(ap.status, 0, ap.stdout + ap.stderr);
  const irma = path.join(AQUI, "..", "..", "agentic-design");
  assert.equal(readFileSync(path.join(r.repo, ".agentic/detetar-slop.mjs"), "utf8"), readFileSync(path.join(irma, "scripts", "detetar-slop.mjs"), "utf8"));
  assert.equal(readFileSync(path.join(r.repo, ".agentic/ui-sem-slop.md"), "utf8"), readFileSync(path.join(irma, "references", "ui-sem-slop.md"), "utf8"));
});

test("hook: encontra o detetor em $CLAUDE_CONFIG_DIR/skills (onde o install.sh o põe)", (t) => {
  const r = repoComHooks(t, { versionado: false });
  const cfg = path.join(r.env.HOME, "cfg");
  const pasta = path.join(cfg, "skills", "agentic-design", "scripts");
  mkdirSync(pasta, { recursive: true });
  writeFileSync(path.join(pasta, "detetar-slop.mjs"), DUPLO);
  r.escreve("src/novo.css", ".f { x: SLOP; }\n");
  r.git("add", "src/novo.css");
  const c = r.commit("novo com slop", { CLAUDE_CONFIG_DIR: cfg });
  assert.equal(c.status, 1, c.out);
  assert.match(c.out, /src\/novo\.css:1\s+bloqueio/);
});

test("hook: encontra o detetor só em ~/.cursor/skills", (t) => {
  const r = repoComHooks(t, { versionado: false });
  const pasta = path.join(r.env.HOME, ".cursor", "skills", "agentic-design", "scripts");
  mkdirSync(pasta, { recursive: true });
  writeFileSync(path.join(pasta, "detetar-slop.mjs"), DUPLO);
  r.escreve("src/novo.css", ".f { x: SLOP; }\n");
  r.git("add", "src/novo.css");
  const c = r.commit("novo com slop");
  assert.equal(c.status, 1, c.out);
  assert.match(c.out, /src\/novo\.css:1\s+bloqueio/);
});

test("hook: no plugin usa a versão instalada (installed_plugins.json), não outra da cache", (t) => {
  const r = repoComHooks(t, { versionado: false });
  const plugins = path.join(r.env.HOME, ".claude", "plugins");
  const versao = (v, detetor) => {
    const d = path.join(plugins, "cache", "agentic-skills", "agentic-skills", v, "skills", "agentic-design", "scripts");
    mkdirSync(d, { recursive: true });
    writeFileSync(path.join(d, "detetar-slop.mjs"), detetor);
    return path.join(plugins, "cache", "agentic-skills", "agentic-skills", v);
  };
  // Duas versões antigas que deixam tudo passar, à volta da instalada (a que bloqueia).
  const passa = 'process.stdout.write(JSON.stringify({ resumo: { ficheiros: 1, bloqueios: 0, avisos: 0, porRegra: {} }, achados: [] }));\n';
  versao("0a1b2c3d4e5f", passa);
  const instalada = versao("5f5f5f5f5f5f", DUPLO);
  versao("9c1d2e3f4a5b", passa);
  writeFileSync(path.join(plugins, "installed_plugins.json"), JSON.stringify({ version: 2, plugins: {
    "agentic-skills@agentic-skills": [{ scope: "user", installPath: instalada, version: "5f5f5f5f5f5f", lastUpdated: "2026-10-16T10:00:00.000Z" }] } }));
  r.escreve("src/novo.css", ".f { x: SLOP; }\n");
  r.git("add", "src/novo.css");
  const c = r.commit("novo com slop");
  assert.equal(c.status, 1, c.out);
  assert.match(c.out, /src\/novo\.css:1\s+bloqueio/);
});
