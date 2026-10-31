// Testes do install.sh (node --test tests/*.test.mjs, a partir da raiz do repo). Herméticos: cada teste usa um HOME temporário e
// corre o script com o bash do sistema (no macOS, o 3.2).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, existsSync, readdirSync, writeFileSync, lstatSync, readlinkSync, statSync, readFileSync, realpathSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const SCRIPT = path.join(RAIZ, "install.sh");
const BASH = existsSync("/bin/bash") ? "/bin/bash" : "bash";
const ADAPTADAS = ["agentic-architecture", "agentic-ci-audit", "agentic-tool-design", "agentic-analysis-optimization"];

function casa(t, pastas = []) {
  const home = mkdtempSync(path.join(tmpdir(), "install-teste-"));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  for (const p of pastas) mkdirSync(path.join(home, p), { recursive: true });
  const env = { ...process.env, HOME: home };
  delete env.CLAUDE_CONFIG_DIR;
  const corre = (...args) => correScript(SCRIPT, ...args);
  const correScript = (script, ...args) => {
    const r = spawnSync(BASH, [script, ...args], { env, encoding: "utf8" });
    return { status: r.status, out: r.stdout + r.stderr };
  };
  return { home, corre, correScript };
}

test("sem agentes detetados sai 2 e diz como escolher", (t) => {
  const { corre } = casa(t);
  const r = corre();
  assert.equal(r.status, 2);
  assert.match(r.out, /nenhum agente detetado/);
});

test("simulação deteta os agentes pelas pastas e não cria nada", (t) => {
  const { home, corre } = casa(t, [".claude", ".codex", ".cursor"]);
  const r = corre();
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /SIMULAÇÃO/);
  assert.match(r.out, /^claude → ~\/\.claude\/skills$/m);
  assert.match(r.out, /^codex, cursor → ~\/\.agents\/skills$/m);
  assert.match(r.out, /copiaria\s+agentic-feature/);
  assert.match(r.out, /copiaria\s+agentic-design/);
  assert.match(r.out, /copiaria\s+agentic-code-review/);
  for (const nome of ADAPTADAS) assert.match(r.out, new RegExp(`^\\s+copiaria\\s+${nome}$`, "m"));
  assert.ok(!existsSync(path.join(home, ".claude", "skills")));
  assert.ok(!existsSync(path.join(home, ".agents")));
});

test("--aplicar preserva as onze skills e todos os recursos no Claude e Codex", (t) => {
  const { home, corre } = casa(t);
  const resultado = corre("--aplicar", "--agente", "claude,codex");
  assert.equal(resultado.status, 0, resultado.out);
  // Todas as pastas de skills/: uma skill nova que fique fora do SKILLS do install.sh faz falhar aqui.
  const esperadas = readdirSync(path.join(RAIZ, "skills")).filter((nome) => existsSync(path.join(RAIZ, "skills", nome, "SKILL.md"))).sort();
  const conferir = (origem, destino) => {
    const entradas = readdirSync(origem, { withFileTypes: true });
    assert.deepEqual(readdirSync(destino).sort(), entradas.map((entrada) => entrada.name).sort(), destino);
    for (const entrada of entradas) {
      const fonte = path.join(origem, entrada.name);
      const copia = path.join(destino, entrada.name);
      if (entrada.isDirectory()) conferir(fonte, copia);
      else assert.deepEqual(readFileSync(copia), readFileSync(fonte), copia);
    }
  };
  for (const pasta of [".claude", ".agents"]) {
    const destino = path.join(home, pasta, "skills");
    assert.deepEqual(readdirSync(destino).sort(), esperadas, destino);
    for (const nome of ADAPTADAS) {
      const origem = path.join(RAIZ, "skills", nome);
      assert.ok(existsSync(path.join(origem, "licenses", "LICENSE")), `${nome} sem licença`);
      assert.ok(existsSync(path.join(origem, "references", "origem.md")), `${nome} sem origem`);
      conferir(origem, path.join(destino, nome));
    }
  }
  for (const pasta of [".claude", ".agents"]) {
    assert.ok(statSync(path.join(home, pasta, "skills", "agentic-project", "scripts", "preparar-repo.sh")).mode & 0o111, "script sem execução");
  }
  const repetido = corre("--aplicar", "--agente", "claude,codex");
  assert.equal(repetido.status, 0, repetido.out);
  assert.match(repetido.out, /feito: 0 instalada\(s\), 0 por instalar/);
});

test("--aplicar copia, repõe o bit de execução e a 2.ª corrida não muda nada", (t) => {
  const { home, corre } = casa(t, [".codex"]);
  const r = corre("--aplicar");
  assert.equal(r.status, 0, r.out);
  const s = path.join(home, ".agents", "skills", "agentic-project");
  assert.ok(existsSync(path.join(s, "SKILL.md")));
  assert.ok(existsSync(path.join(home, ".agents", "skills", "agentic-code-review", "scripts", "validar-relatorio.mjs")));
  assert.ok(statSync(path.join(s, "scripts", "preparar-repo.sh")).mode & 0o111, "sem bit de execução");
  const de_novo = corre("--aplicar");
  assert.equal(de_novo.status, 0, de_novo.out);
  assert.match(de_novo.out, /igual, mantida\s+agentic-project/);
});

test("nunca sobrescreve sem --forcar; com --forcar guarda a anterior", (t) => {
  const { home, corre } = casa(t);
  const alheia = path.join(home, ".claude", "skills", "agentic-feature");
  mkdirSync(alheia, { recursive: true });
  writeFileSync(path.join(alheia, "SKILL.md"), "minha versão\n");
  const r = corre("--aplicar", "--agente", "claude");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /existe, mantida\s+agentic-feature/);
  assert.equal(readFileSync(path.join(alheia, "SKILL.md"), "utf8"), "minha versão\n");
  const f = corre("--aplicar", "--agente", "claude", "--forcar");
  assert.equal(f.status, 0, f.out);
  assert.match(f.out, /substituída\s+agentic-feature/);
  const copias = path.join(home, ".agentic-skills-backups");
  const carimbo = readdirSync(copias)[0];
  const sub = readdirSync(path.join(copias, carimbo))[0];
  assert.equal(readFileSync(path.join(copias, carimbo, sub, "agentic-feature", "SKILL.md"), "utf8"), "minha versão\n");
});

test("--ligar cria ligações para o repo; repetir mantém-nas", (t) => {
  const { home, corre } = casa(t);
  const r = corre("--aplicar", "--ligar", "--agente", "gemini,claude");
  assert.equal(r.status, 0, r.out);
  for (const d of [".agents/skills", ".claude/skills"]) {
    const l = path.join(home, d, "agentic-project");
    assert.ok(lstatSync(l).isSymbolicLink(), `${d} não é ligação`);
    assert.equal(readlinkSync(l), path.join(RAIZ, "skills", "agentic-project"));
  }
  const de_novo = corre("--aplicar", "--ligar", "--agente", "todos");
  assert.equal(de_novo.status, 0, de_novo.out);
  assert.match(de_novo.out, /já ligada, mantida\s+agentic-feature/);
  assert.equal(de_novo.out.match(/→ ~\/\.agents\/skills$/gm).length, 1, "a pasta partilhada aparece uma só vez");
  assert.match(de_novo.out, /^codex, cursor, gemini, copilot, opencode → ~\/\.agents\/skills$/m);
});

test("--projeto instala nas pastas do repositório e não no HOME", (t) => {
  const { home, corre } = casa(t, [".claude"]);
  const repo = path.join(home, "repo");
  mkdirSync(repo);
  const r = corre("--aplicar", "--projeto", repo, "--agente", "claude,copilot");
  assert.equal(r.status, 0, r.out);
  assert.ok(existsSync(path.join(repo, ".claude", "skills", "agentic-feature", "SKILL.md")));
  assert.ok(existsSync(path.join(repo, ".agents", "skills", "agentic-feature", "SKILL.md")));
  assert.ok(!existsSync(path.join(home, ".claude", "skills")));
});

test("ligações para o repo: sem --ligar ficam pendentes; --forcar troca-as por cópias", (t) => {
  const { home, corre } = casa(t);
  assert.equal(corre("--aplicar", "--ligar", "--agente", "codex").status, 0);
  const l = path.join(home, ".agents", "skills", "agentic-project");
  const r = corre("--aplicar", "--agente", "codex");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /existe, mantida\s+agentic-project \(é uma ligação para este repo; --forcar troca-a por uma cópia\)/);
  const f = corre("--aplicar", "--forcar", "--agente", "codex");
  assert.equal(f.status, 0, f.out);
  assert.ok(!lstatSync(l).isSymbolicLink(), "continua a ser ligação");
  assert.ok(existsSync(path.join(l, "SKILL.md")));
});

test("--ligar sobre cópias iguais diz que é uma cópia, não que é diferente", (t) => {
  const { corre } = casa(t);
  assert.equal(corre("--aplicar", "--agente", "codex").status, 0);
  const r = corre("--aplicar", "--ligar", "--agente", "codex");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /existe, mantida\s+agentic-feature \(é uma cópia igual; --forcar troca-a por uma ligação\)/);
  assert.doesNotMatch(r.out, /é diferente/);
});

test("o mesmo clone por um caminho com ligação conta como o mesmo repo", (t) => {
  const { home, corre, correScript } = casa(t);
  const atalho = path.join(home, "atalho-clone");
  symlinkSync(RAIZ, atalho);
  const a = correScript(path.join(atalho, "install.sh"), "--aplicar", "--ligar", "--agente", "claude");
  assert.equal(a.status, 0, a.out);
  const b = corre("--aplicar", "--ligar", "--agente", "claude");
  assert.equal(b.status, 0, b.out);
  assert.match(b.out, /já ligada, mantida\s+agentic-project/);
});

test("uma pasta nova e outra antiga: avisa que ficam em versões diferentes", (t) => {
  const { home, corre } = casa(t, [".claude", ".config/opencode"]);
  const antiga = path.join(home, ".claude", "skills", "agentic-feature");
  mkdirSync(antiga, { recursive: true });
  writeFileSync(path.join(antiga, "SKILL.md"), "versão antiga\n");
  const r = corre("--aplicar");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /escolhe ao acaso a cópia/);
  assert.match(r.out, /atenção: uma pasta fica com a versão nova e outra com a que já lá estava/);
});

// As vias de instalação do README que listam skills (o ciclo `gh skill` e o ciclo do Gemini CLI)
// têm de levar as mesmas que o SKILLS do install.sh: uma skill nova que fique fora de uma via
// deixa quem instala por ela sem as irmãs que a agentic-feature manda carregar.
const skillsDoInstall = () => readFileSync(SCRIPT, "utf8").match(/^SKILLS="([^"]+)"/m)[1].split(/\s+/).sort();

// As skills do `for skill in … ; do` da secção `### <titulo>` do README ([] se a secção ou o ciclo faltam).
function skillsDoCiclo(readme, titulo) {
  const inicio = readme.search(new RegExp(`^### .*${titulo}`, "m"));
  if (inicio < 0) return [];
  const resto = readme.slice(inicio + 4);
  const fim = resto.search(/^### /m);
  const secao = fim < 0 ? resto : resto.slice(0, fim);
  const ciclo = /for skill in ([^;]*); do/.exec(secao.replace(/\\\n/g, " "));
  return ciclo ? ciclo[1].split(/\s+/).filter(Boolean).sort() : [];
}

test("README: o ciclo do gh skill e o do Gemini CLI levam as mesmas skills que o SKILLS do install.sh", () => {
  const readme = readFileSync(path.join(RAIZ, "README.md"), "utf8");
  const esperadas = skillsDoInstall();
  assert.deepEqual(esperadas, [...["agentic-project","agentic-feature","agentic-design","agentic-implement","agentic-fix","agentic-code-review","agentic-architecture","agentic-explain","agentic-analysis-optimization","agentic-ci-audit","agentic-tool-design"]].sort(), "o SKILLS do install.sh devia ter as onze");
  assert.deepEqual(skillsDoCiclo(readme, "`gh skill`"), esperadas, "gh skill");
  assert.deepEqual(skillsDoCiclo(readme, "Gemini CLI"), esperadas, "Gemini CLI");
});

test("o leitor das vias do README não passa em vazio (controlo)", () => {
  assert.deepEqual(skillsDoCiclo("### Outra\n\nfor skill in a b; do\n", "Gemini CLI"), []);
  assert.deepEqual(skillsDoCiclo("### Gemini CLI\n\ngemini skills install x --path skills/a\n", "Gemini CLI"), []);
  assert.deepEqual(skillsDoCiclo("### Gemini CLI\n\nfor skill in b \\\n  a; do\n  x\ndone\n### Fim\n", "Gemini CLI"), ["a", "b"]);
});

// --- --agentes: os agentes definidos do Claude Code (opcional, nunca sobrescreve, nunca edita o CLAUDE.md)

const FONTE_AGENTES = path.join(RAIZ, "skills", "agentic-implement", "assets", "agentes");
const QUATRO_AGENTES = ["implementador", "implementador-ui", "pesquisador", "revisor"];

test("--agentes, na simulação, diz o que copiaria, mostra o excerto do CLAUDE.md e não cria nada", (t) => {
  const { home, corre } = casa(t, [".claude"]);
  const r = corre("--agente", "claude", "--agentes");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^claude \(agentes\) → ~\/\.claude\/agents$/m);
  for (const a of QUATRO_AGENTES) assert.match(r.out, new RegExp(`^\\s+copiaria\\s+${a}$`, "m"), a);
  assert.match(r.out, /Excerto para o teu CLAUDE\.md \(o instalador não o edita/);
  assert.ok(r.out.includes(readFileSync(path.join(FONTE_AGENTES, "excerto-claude-md.md"), "utf8")), "o excerto vem inteiro");
  assert.match(r.out, /^agentes: 4 por copiar, 0 já lá estão\.$/m);
  assert.ok(!existsSync(path.join(home, ".claude", "agents")));
  assert.ok(!existsSync(path.join(home, ".claude", "skills")));
});

test("sem --agentes o instalador não toca nos agentes nem mostra o excerto", (t) => {
  const { home, corre } = casa(t);
  const r = corre("--aplicar", "--agente", "claude");
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.out, /agentes\)|Excerto|implementador/);
  assert.ok(!existsSync(path.join(home, ".claude", "agents")));
});

test("--aplicar --agentes copia os quatro agentes, e só eles, para ~/.claude/agents sem editar o CLAUDE.md", (t) => {
  const { home, corre } = casa(t, [".claude"]);
  const claudeMd = path.join(home, ".claude", "CLAUDE.md");
  writeFileSync(claudeMd, "# As minhas regras\n\nnão mexas.\n");
  const antes = statSync(claudeMd);
  const r = corre("--aplicar", "--agente", "claude", "--agentes");
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(readdirSync(path.join(home, ".claude", "agents")).sort(), QUATRO_AGENTES.map((a) => `${a}.md`).sort(), "o LEIA-ME e o excerto não são agentes");
  for (const a of QUATRO_AGENTES) {
    assert.equal(readFileSync(path.join(home, ".claude", "agents", `${a}.md`), "utf8"), readFileSync(path.join(FONTE_AGENTES, `${a}.md`), "utf8"), a);
    assert.match(r.out, new RegExp(`^\\s+copiado\\s+${a}$`, "m"), a);
  }
  assert.match(r.out, /^agentes: 4 copiado\(s\), 0 mantido\(s\)\.$/m);
  assert.equal(readFileSync(claudeMd, "utf8"), "# As minhas regras\n\nnão mexas.\n", "o CLAUDE.md do utilizador fica como estava");
  assert.equal(statSync(claudeMd).mtimeMs, antes.mtimeMs);
  assert.deepEqual(readdirSync(path.join(home, ".claude")).filter((f) => /^CLAUDE/.test(f)), ["CLAUDE.md"]);
});

test("--agentes não cria um CLAUDE.md que não exista", (t) => {
  const { home, corre } = casa(t, [".claude"]);
  const r = corre("--aplicar", "--agente", "claude", "--agentes");
  assert.equal(r.status, 0, r.out);
  assert.ok(!existsSync(path.join(home, ".claude", "CLAUDE.md")));
  assert.ok(!existsSync(path.join(home, "CLAUDE.md")));
});

test("--agentes nunca sobrescreve: um agente do utilizador fica como está, também com --forcar", (t) => {
  const { home, corre } = casa(t, [".claude/agents"]);
  const meu = path.join(home, ".claude", "agents", "revisor.md");
  writeFileSync(meu, "o meu revisor\n");
  const r = corre("--aplicar", "--agente", "claude", "--agentes");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^\s+existe, mantido\s+revisor \(é diferente; não se sobrescreve/m);
  assert.match(r.out, /^\s+copiado\s+implementador$/m);
  assert.match(r.out, /^agentes: 3 copiado\(s\), 1 mantido\(s\)\.$/m);
  assert.equal(readFileSync(meu, "utf8"), "o meu revisor\n");
  const forcado = corre("--aplicar", "--agente", "claude", "--agentes", "--forcar");
  assert.equal(forcado.status, 0, forcado.out);
  assert.equal(readFileSync(meu, "utf8"), "o meu revisor\n", "nem o --forcar substitui um agente");
  assert.match(forcado.out, /^\s+igual, mantido\s+implementador$/m, "os que já eram iguais dizem-no");
  assert.match(forcado.out, /^agentes: 0 copiado\(s\), 4 mantido\(s\)\.$/m);
  const copias = path.join(home, ".agentic-skills-backups");
  assert.ok(!existsSync(copias) || !readdirSync(copias, { recursive: true }).some((f) => /agents/.test(f)), "nada de agentes vai para as cópias de segurança");
});

test("--agentes: um agente que seja uma ligação do utilizador também não é tocado", (t) => {
  const { home, corre } = casa(t, [".claude/agents"]);
  const alvo = path.join(home, "meu-pesquisador.md");
  writeFileSync(alvo, "meu\n");
  symlinkSync(alvo, path.join(home, ".claude", "agents", "pesquisador.md"));
  const r = corre("--aplicar", "--agente", "claude", "--agentes");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /existe, mantido\s+pesquisador/);
  assert.equal(readFileSync(alvo, "utf8"), "meu\n");
  assert.ok(lstatSync(path.join(home, ".claude", "agents", "pesquisador.md")).isSymbolicLink());
});

test("--agentes com --projeto copia para <repo>/.claude/agents; com --ligar os agentes continuam a ser cópias", (t) => {
  const { home, corre } = casa(t, [".claude"]);
  const repo = path.join(home, "repo");
  mkdirSync(repo);
  const r = corre("--aplicar", "--ligar", "--projeto", repo, "--agente", "claude", "--agentes");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^claude \(agentes\) → ~\/repo\/\.claude\/agents$/m);
  for (const a of QUATRO_AGENTES) {
    const f = path.join(repo, ".claude", "agents", `${a}.md`);
    assert.ok(!lstatSync(f).isSymbolicLink(), `${a}: os agentes são para editar, por isso copiam-se`);
    assert.equal(readFileSync(f, "utf8"), readFileSync(path.join(FONTE_AGENTES, `${a}.md`), "utf8"));
  }
  assert.ok(lstatSync(path.join(repo, ".claude", "skills", "agentic-project")).isSymbolicLink(), "as skills ficam ligadas");
  assert.ok(!existsSync(path.join(home, ".claude", "agents")));
});

test("--agentes usa o CLAUDE_CONFIG_DIR quando existe", (t) => {
  const { home } = casa(t);
  const config = path.join(home, "config-claude");
  mkdirSync(config);
  const r = spawnSync(BASH, [SCRIPT, "--aplicar", "--agente", "claude", "--agentes"], { env: { ...process.env, HOME: home, CLAUDE_CONFIG_DIR: config }, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(existsSync(path.join(config, "agents", "revisor.md")));
  assert.ok(!existsSync(path.join(home, ".claude")));
});

test("--agentes sem o Claude Code entre os agentes sai 2, diz porquê e não copia nada", (t) => {
  const { home, corre } = casa(t, [".codex"]);
  for (const args of [["--agente", "codex", "--agentes"], ["--aplicar", "--agentes"]]) {
    const r = corre(...args);
    assert.equal(r.status, 2, r.out);
    assert.match(r.out, /--agentes copia para a pasta de agentes do Claude Code; junta --agente claude/);
  }
  assert.ok(!existsSync(path.join(home, ".claude")));
  assert.ok(!existsSync(path.join(home, ".agents")));
});

test("o AGENTES_LISTA do install.sh é a lista dos agentes da pasta, e o --help fala do --agentes", (t) => {
  const instalador = readFileSync(SCRIPT, "utf8");
  assert.equal(/^AGENTES_LISTA="([^"]+)"$/m.exec(instalador)[1], QUATRO_AGENTES.join(" "));
  const comFrontmatter = readdirSync(FONTE_AGENTES).filter((f) => f.endsWith(".md") && readFileSync(path.join(FONTE_AGENTES, f), "utf8").startsWith("---\n")).map((f) => f.replace(/\.md$/, ""));
  assert.deepEqual(comFrontmatter.sort(), [...QUATRO_AGENTES].sort());
  const { corre } = casa(t);
  const ajuda = corre("--help");
  assert.equal(ajuda.status, 0, ajuda.out);
  assert.match(ajuda.out, /\[--agentes\]/);
  assert.match(ajuda.out, /^\s*--agentes\s+opcional, só Claude Code/m);
  assert.match(ajuda.out, /O instalador nunca edita o CLAUDE\.md/);
});

// codex-legado: o Codex antigo lê ~/.codex/skills. Só a pedido, e não entra em «todos».
test("codex-legado instala em ~/.codex/skills, só a pedido", (t) => {
  const { home, corre } = casa(t);
  const r = corre("--aplicar", "--agente", "codex-legado");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^codex-legado → ~\/\.codex\/skills$/m);
  for (const nome of ["agentic-project", "agentic-feature", "agentic-code-review"]) {
    assert.ok(existsSync(path.join(home, ".codex", "skills", nome, "SKILL.md")), nome);
  }
  assert.ok(!existsSync(path.join(home, ".agents")), "o Codex atual não é tocado");
});

test("codex-legado não entra em «todos» nem na deteção; --projeto recusa-o", (t) => {
  const { corre } = casa(t, [".codex"]);
  const todos = corre("--agente", "todos");
  assert.equal(todos.status, 0, todos.out);
  assert.doesNotMatch(todos.out, /codex-legado|\.codex\/skills/);
  const detetado = corre();
  assert.doesNotMatch(detetado.out, /codex-legado/);
  const repo = casa(t).home;
  const projeto = corre("--agente", "codex-legado", "--projeto", repo);
  assert.equal(projeto.status, 2, projeto.out);
  assert.match(projeto.out, /codex-legado só existe no âmbito do utilizador/);
});

test("--help diz os agentes, inclui o codex-legado e sai 0", (t) => {
  const { corre } = casa(t);
  const r = corre("--help");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /codex-legado/);
  assert.match(r.out, /^Uso: \.\/install\.sh/m);
});
