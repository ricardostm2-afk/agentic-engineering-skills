// O sistema de memória (memoria/): o guia e o modelo de pasta vazio cumprem as regras que ensinam
// (índice curto, sub-índices, um facto por ficheiro, sem órfãs nem ligações em falta) e não levam
// nenhuma memória real (node --test, a partir da raiz do repo).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MEMORIA = path.join(RAIZ, "memoria");
const MODELO = path.join(MEMORIA, "modelo");
const ler = (...p) => readFileSync(path.join(...p), "utf8");
const TIPOS = ["user", "feedback", "project", "reference"];

// Frontmatter de uma memória: name, description e metadata.type (com um nível de indentação).
export function lerMemoria(texto) {
  const linhas = texto.split("\n");
  if (linhas[0] !== "---") return { erro: "não começa com ---" };
  const fim = linhas.indexOf("---", 1);
  if (fim < 0) return { erro: "frontmatter sem --- de fecho" };
  const campos = {};
  const metadata = {};
  let emMetadata = false;
  for (const l of linhas.slice(1, fim)) {
    const sub = /^  ([a-z_]+): (\S.*)$/.exec(l);
    if (emMetadata && sub) { metadata[sub[1]] = sub[2]; continue; }
    const m = /^([a-z]+):(?: (.+))?$/.exec(l);
    if (!m) return { erro: `linha inesperada: ${l}` };
    emMetadata = m[1] === "metadata" && !m[2];
    if (!emMetadata) campos[m[1]] = m[2];
  }
  return { campos, metadata, corpo: linhas.slice(fim + 1).join("\n") };
}

// Ligações de verdade: fora dos comentários HTML, dos blocos de código e do código em linha, onde os
// modelos mostram `[Título](ficheiro.md)` como exemplo.
const semCodigo = (texto) => texto.replace(/<!--[^]*?-->/g, "").replace(/^(~~~|```)[^]*?^\1/gm, "").replace(/`[^`\n]*`/g, "");
const ligacoes = (texto) => [...semCodigo(texto).matchAll(/\]\(([^)\s#]+\.md)\)/g)].map((m) => m[1]);
const memorias = () => readdirSync(MODELO).filter((f) => f.endsWith(".md") && f !== "MEMORY.md" && f !== "README.md");

test("as ligações dos exemplos não contam, as de verdade sim (controlo)", () => {
  assert.deepEqual(ligacoes("<!-- `- [T](a.md)` -->\n`[T](b.md)`\n~~~md\n[T](c.md)\n~~~\n- [T](d.md) e [U](e.md)\n"), ["d.md", "e.md"]);
});

test("o leitor de memórias recusa o que o Claude Code não lê (controlo)", () => {
  assert.match(lerMemoria("sem frontmatter\n").erro, /não começa/);
  assert.match(lerMemoria("---\nname: x\n").erro, /sem --- de fecho/);
  assert.match(lerMemoria("---\nname: x\n  perdido: 1\n---\n").erro, /linha inesperada/);
  const ok = lerMemoria("---\nname: x\ndescription: d\nmetadata:\n  type: user\n---\ncorpo\n");
  assert.deepEqual([ok.campos, ok.metadata], [{ name: "x", description: "d" }, { type: "user" }]);
});

test("o modelo de pasta tem o índice, o sub-índice do histórico, o README e o .gitignore, e nenhuma memória real", () => {
  assert.deepEqual(readdirSync(MODELO, { encoding: "utf8" }).sort(), [".gitignore", "MEMORY.md", "README.md", "indice-historico.md"]);
  assert.deepEqual(memorias(), ["indice-historico.md"], "a única memória do modelo é o sub-índice vazio");
});

test("o MEMORY.md do modelo cabe com folga nos limites do Claude Code (200 linhas, 25 KB) e está vazio", () => {
  const t = ler(MODELO, "MEMORY.md");
  assert.ok(t.split("\n").length < 30 && Buffer.byteLength(t) < 2048, "o modelo é um esqueleto");
  assert.match(t, /^Arrumação: /, "a regra de arrumação na 1.ª linha");
  assert.deepEqual(t.split("\n").filter((l) => l.startsWith("## ")), ["## Aplica-se a qualquer sessão", "## Sub-índices por tema"]);
  const linhasDeEntrada = t.split("\n").filter((l) => l.startsWith("- ["));
  assert.deepEqual(linhasDeEntrada.map((l) => /\(([^)]+)\)/.exec(l)[1]), ["indice-historico.md"], "só o ponteiro para o histórico");
});

test("o modelo cumpre as suas regras: cada memória numa linha de índice, sem órfãs e sem ligações em falta", () => {
  const indice = ler(MODELO, "MEMORY.md");
  const alvos = [...ligacoes(indice), ...memorias().flatMap((m) => ligacoes(ler(MODELO, m)))];
  for (const alvo of alvos) assert.ok(existsSync(path.join(MODELO, alvo)), `ligação em falta: ${alvo}`);
  const ligadas = ligacoes(indice);
  for (const m of memorias()) assert.equal(ligadas.filter((a) => a === m).length, 1, `${m} tem de estar numa só linha do MEMORY.md`);
  assert.ok(!ligacoes(ler(MODELO, "README.md")).length, "o README não liga memórias");
});

test("cada ficheiro de memória do modelo tem name igual ao do ficheiro, description e metadata.type válido", () => {
  for (const m of memorias()) {
    const { campos, metadata, erro } = lerMemoria(ler(MODELO, m));
    assert.equal(erro, undefined, `${m}: ${erro}`);
    assert.equal(campos.name, m.replace(/\.md$/, ""));
    assert.ok(campos.description?.length > 20, `${m}: sem descrição`);
    assert.ok(TIPOS.includes(metadata.type), `${m}: type ${metadata.type}`);
  }
  assert.equal(lerMemoria(ler(MODELO, "MEMORY.md")).erro, "não começa com ---", "o índice não tem frontmatter");
});

test("o molde de uma memória tem os campos do guia e as ligações [[nome]]", () => {
  const { campos, metadata, corpo, erro } = lerMemoria(ler(MEMORIA, "modelo-de-memoria.md"));
  assert.equal(erro, undefined);
  assert.deepEqual(Object.keys(campos), ["name", "description"]);
  assert.ok(TIPOS.includes(metadata.type));
  assert.match(corpo, /\*\*Porquê:\*\*/);
  assert.match(corpo, /\*\*Como aplicar:\*\*/);
  assert.match(corpo, /\[\[[a-z0-9-]+\]\]/);
  const guia = ler(MEMORIA, "GUIA.md");
  const exemplo = /~~~markdown\n(---\n[^]*?\n---)/.exec(guia)[1];
  assert.deepEqual(Object.keys(lerMemoria(exemplo + "\n").campos), ["name", "description"], "o exemplo do guia tem os mesmos campos");
  assert.deepEqual(Object.keys(lerMemoria(exemplo + "\n").metadata), ["type"]);
});

test("o guia cobre o que foi pedido: camadas, subida e descida, o que nunca entra, git privado, autoMemoryDirectory e o aviso de partilha", () => {
  const g = ler(MEMORIA, "GUIA.md");
  for (const secao of ["## O que o Claude Code faz (e o desenho aproveita)", "## As camadas", "## O modelo de pasta", "## Uma memória: um facto por ficheiro",
    "## Quando uma memória sobe e quando desce", "## O que nunca entra", "## Ligar a pasta a um repositório git privado", "## Manter"]) assert.ok(g.includes(`\n${secao}\n`), secao);
  for (const t of ["200 linhas", "25 KB", "`MEMORY.md`", "indice-<tema>.md", "[[nome]]", "metadata.type", "`user`", "`feedback`", "`project`", "`reference`",
    "autoMemoryDirectory", "repositório **privado**", "**Testa antes de confiares.**", "partilha a memória entre projetos", "Segredos", "Dados de saúde"]) assert.ok(g.includes(t), t);
  assert.match(g, /~\/\.claude\/settings\.json/);
  assert.match(g, /\{ "autoMemoryDirectory": "~\/claude-memoria" \}/);
  assert.match(g, /nunca direta no `MEMORY\.md`|nunca direta/);
  for (const alvo of ligacoes(g)) assert.ok(existsSync(path.join(MEMORIA, alvo)), `ligação do guia em falta: ${alvo}`);
});

test("o README do modelo diz que não é uma memória e repete as regras curtas", () => {
  const r = ler(MODELO, "README.md");
  assert.match(r, /não é uma memória/);
  for (const t of ["200 linhas ou 25 KB", "Sem órfãs, sem ligações em falta", "autoMemoryDirectory", "Segredos"]) assert.ok(r.includes(t), t);
});

test("os números do guia e do modelo dizem o mesmo", () => {
  const g = ler(MEMORIA, "GUIA.md");
  const m = ler(MODELO, "MEMORY.md");
  const r = ler(MODELO, "README.md");
  assert.match(g, /até ~25 entradas, ~3 KB/);
  assert.match(g, /~6 KB, ~45 linhas/);
  assert.match(m, /~6 KB ou de ~45 linhas/);
  assert.match(ler(MODELO, "indice-historico.md"), /~25 entradas ou ~3 KB/);
  assert.match(g, /~500 ficheiros/);
  assert.match(r, /~500 ficheiros/);
  assert.match(g, /teto de ~30 linhas/);
  assert.match(m, /Teto de ~30 linhas/);
});
