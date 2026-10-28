// Os agentes definidos do Claude Code que vêm com a agentic-implement (skills/agentic-implement/assets/agentes/):
// frontmatter válido, ferramentas em lista fechada, modelo e esforço como predefinição comentada de um nível,
// e o excerto do CLAUDE.md que aponta para o escolher-o-agente.md em vez de o repetir
// (node --test, a partir da raiz do repo).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = path.join(RAIZ, "skills", "agentic-implement", "assets", "agentes");
const AGENTES = ["implementador", "implementador-ui", "pesquisador", "revisor"];
const ler = (...p) => readFileSync(path.join(...p), "utf8");

// Lê o frontmatter destes ficheiros: «chave: valor» numa linha, e os comentários «# …» à parte.
// Um valor sem aspas que traga «: » ou « #» partia o YAML a sério, por isso é erro aqui.
export function lerAgente(texto) {
  const linhas = texto.split("\n");
  if (linhas[0] !== "---") return { erro: "não começa com ---" };
  const fim = linhas.indexOf("---", 1);
  if (fim < 0) return { erro: "frontmatter sem --- de fecho" };
  const campos = {};
  const comentarios = [];
  for (const l of linhas.slice(1, fim)) {
    if (l.startsWith("#")) { comentarios.push(l.replace(/^#\s?/, "")); continue; }
    const m = /^([A-Za-z][\w-]*): (.+)$/.exec(l);
    if (!m) return { erro: `linha inesperada no frontmatter: ${l}` };
    let valor = m[2].trim();
    if (valor.startsWith('"')) {
      if (!/^"[^"]*"$/.test(valor)) return { erro: `${m[1]}: aspas por fechar ou por escapar` };
      valor = valor.slice(1, -1);
    } else if (/: | #/.test(valor)) {
      return { erro: `${m[1]}: valor sem aspas com «: » ou « #» (parte o YAML)` };
    }
    if (m[1] in campos) return { erro: `${m[1]}: campo repetido` };
    campos[m[1]] = valor;
  }
  return { campos, comentarios, corpo: linhas.slice(fim + 1).join("\n") };
}

const agente = (nome) => lerAgente(ler(PASTA, `${nome}.md`));
const ferramentas = (nome) => agente(nome).campos.tools.split(",").map((s) => s.trim());
const SO_LEITURA = ["pesquisador", "revisor"];
const ESCRITA = ["Edit", "Write", "NotebookEdit"];

test("a pasta tem os quatro agentes, o excerto do CLAUDE.md e o LEIA-ME, e mais nada", () => {
  assert.deepEqual(readdirSync(PASTA).sort(), [...AGENTES.map((a) => `${a}.md`), "LEIA-ME.md", "excerto-claude-md.md"].sort());
});

test("o leitor do frontmatter apanha o que parte o YAML (controlo)", () => {
  assert.match(lerAgente("---\nname: x\ndescription: Contexto novo: quem escreve\n---\n").erro, /parte o YAML/);
  assert.match(lerAgente('---\nname: x\ndescription: "sem fecho\n---\n').erro, /aspas/);
  assert.match(lerAgente("sem frontmatter\n").erro, /não começa/);
  assert.match(lerAgente("---\nname: x\n").erro, /sem --- de fecho/);
  assert.deepEqual(lerAgente('---\n# comentário\nname: x\ndescription: "a: b"\n---\ncorpo\n').campos, { name: "x", description: "a: b" });
});

for (const nome of AGENTES) {
  test(`${nome}: frontmatter válido, nome igual ao do ficheiro e descrição que diz quando usar`, () => {
    const { campos, erro } = agente(nome);
    assert.equal(erro, undefined, erro);
    assert.equal(campos.name, nome);
    assert.match(campos.name, /^[a-z][a-z0-9-]*$/);
    assert.ok(campos.description.length >= 60 && campos.description.length <= 300, `descrição com ${campos.description.length} caracteres`);
    assert.match(campos.description, /\bUsa-o\b|\bRevê\b|\bContexto novo\b/, "a descrição diz quando delegar");
    assert.deepEqual(Object.keys(campos).filter((k) => !["name", "description", "model", "effort", "tools", "skills"].includes(k)), [], "só os campos que o Claude Code lê e que aqui servem");
  });

  test(`${nome}: lista de ferramentas fechada, sem lançar outros agentes`, () => {
    const lista = ferramentas(nome);
    assert.ok(lista.length >= 4 && lista.length <= 8, lista.join(","));
    for (const f of lista) assert.match(f, /^[A-Z][A-Za-z]+$/, `ferramenta suspeita: ${f}`);
    assert.equal(new Set(lista).size, lista.length, "ferramenta repetida");
    for (const proibida of ["Agent", "Task", "Skill"]) assert.ok(!lista.includes(proibida), proibida);
    assert.ok(lista.includes("Read"));
    if (SO_LEITURA.includes(nome)) for (const f of ESCRITA) assert.ok(!lista.includes(f), `${nome} é de leitura e tem ${f}`);
    else for (const f of ["Edit", "Write", "Bash"]) assert.ok(lista.includes(f), `${nome} sem ${f}`);
    assert.equal(agente(nome).campos.disallowedTools, undefined, "uma lista fechada não precisa de disallowedTools");
  });

  test(`${nome}: modelo e esforço são a predefinição comentada de um nível, que o utilizador muda`, () => {
    const { campos, comentarios } = agente(nome);
    assert.match(campos.model, /^(sonnet|opus|haiku)$/, "um apelido, não um identificador que envelhece");
    assert.match(campos.effort, /^(low|medium|high|xhigh|max)$/);
    const nivel = nome === "revisor" ? "revisão" : "bem-definida";
    const linha = comentarios.find((c) => new RegExp(`${nivel}: model: (\\w+), effort: (\\w+)`).test(c));
    assert.ok(linha, `sem a linha comentada do nível «${nivel}»`);
    const [, modelo, esforco] = new RegExp(`${nivel}: model: (\\w+), effort: (\\w+)`).exec(linha);
    assert.deepEqual([campos.model, campos.effort], [modelo, esforco], "o ativo é o do comentário");
    assert.match(comentarios.join(" "), /Troca estas duas linhas/);
  });
}

test("o revisor tem o modelo do nível «revisão» e os outros três o do nível «bem-definida»", () => {
  assert.deepEqual([agente("revisor").campos.model, agente("revisor").campos.effort], ["opus", "medium"]);
  for (const nome of ["implementador", "implementador-ui", "pesquisador"]) assert.deepEqual([agente(nome).campos.model, agente(nome).campos.effort], ["sonnet", "xhigh"], nome);
  assert.match(ler(PASTA, "revisor.md"), /Só leitura: não edites, não faças commits/);
});

test("as skills pré-carregadas existem; só os agentes que escrevem código as pré-carregam", () => {
  assert.equal(agente("implementador").campos.skills, "[agentic-implement]");
  assert.equal(agente("implementador-ui").campos.skills, "[agentic-implement, agentic-design]");
  assert.equal(agente("pesquisador").campos.skills, undefined);
  assert.equal(agente("revisor").campos.skills, undefined);
  for (const a of AGENTES) {
    const lista = agente(a).campos.skills;
    for (const s of lista ? lista.slice(1, -1).split(/,\s*/) : []) assert.ok(existsSync(path.join(RAIZ, "skills", s, "SKILL.md")), `${a}: skill ${s} não existe`);
  }
});

test("o revisor aponta para o brief da agentic-code-review em vez de o repetir", () => {
  const corpo = agente("revisor").corpo;
  assert.match(corpo, /assets\/brief-revisor\.template\.md/);
  assert.ok(existsSync(path.join(RAIZ, "skills", "agentic-code-review", "assets", "brief-revisor.template.md")));
  assert.doesNotMatch(corpo, /\[Importante\]|Pré-existentes|Nit\b/, "o formato do relatório vive no brief e no modelo da skill");
  assert.ok(corpo.split("\n").length < 30);
});

// Padrões genéricos: caminhos pessoais de qualquer máquina e nomes de ferramentas de uma instalação. O vocabulário
// específico de um projeto, de uma pessoa ou de um fornecedor não se lista aqui, inteiro ou partido ao meio: um teste
// que o nomeia leva-o consigo para cada cópia deste repositório.
const GENERICO = /\/Users\/|\/home\/[a-z]|[A-Za-z]:\\Users\\|mcp__/;

test("nada específico de uma máquina ou de uma instalação nos agentes e no excerto", () => {
  for (const f of [...AGENTES.map((a) => `${a}.md`), "excerto-claude-md.md", "LEIA-ME.md"]) {
    const t = ler(PASTA, f);
    assert.doesNotMatch(t, GENERICO, f);
    assert.doesNotMatch(t, /Sonnet|Opus [0-9]|gpt-/, `${f}: nomes de modelo versionados envelhecem; usa os apelidos`);
  }
});

test("o excerto do CLAUDE.md: modelo por tarefa, agentes definidos em vez do general-purpose, e aponta para o escolher-o-agente.md", () => {
  const t = ler(PASTA, "excerto-claude-md.md");
  assert.match(t, /^## Agentes e modelos por tarefa\n/);
  assert.ok(t.split("\n").length <= 30, "um excerto curto");
  for (const nivel of ["curta", "bem-definida", "complexa", "revisão"]) assert.match(t, new RegExp(`^\\| ${nivel} `, "m"), nivel);
  for (const a of AGENTES) assert.ok(t.includes(`\`${a}\``), a);
  assert.match(t, /`general-purpose`/);
  assert.match(t, /Quem orquestra/);
  assert.match(t, /`references\/escolher-o-agente\.md`/);
  assert.ok(existsSync(path.join(RAIZ, "skills", "agentic-implement", "references", "escolher-o-agente.md")));
  for (const copiado of ["Causa por descobrir", "Desenho que só aparece", "Passos por enumerar", "Já falhou"]) assert.ok(!t.includes(copiado), `repete as perguntas do escolher-o-agente.md: ${copiado}`);
  assert.doesNotMatch(t, /^---$/m, "é texto para colar, sem frontmatter");
});

test("o escolher-o-agente.md (§4) e o LEIA-ME listam os quatro agentes e o instalador", () => {
  const escolher = ler(RAIZ, "skills", "agentic-implement", "references", "escolher-o-agente.md");
  const leia = ler(PASTA, "LEIA-ME.md");
  for (const a of AGENTES) {
    assert.ok(escolher.includes(`assets/agentes/${a}.md`), `escolher-o-agente.md sem ${a}`);
    assert.ok(leia.includes(`\`${a}.md\``), `LEIA-ME sem ${a}`);
  }
  assert.match(escolher, /install\.sh --agentes/);
  for (const t of ["--agentes", "-Agentes", "excerto-claude-md.md", "nunca edita o teu `CLAUDE.md`", "sem sobrescrever|nunca sobrescrevem"]) assert.match(leia, new RegExp(t), t);
});
