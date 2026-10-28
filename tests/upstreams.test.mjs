import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const INVENTARIO = JSON.parse(readFileSync(path.join(RAIZ, "UPSTREAMS.json"), "utf8"));
const SHA_GIT = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function caminhoRelativo(valor) {
  assert.equal(typeof valor, "string");
  assert.ok(valor.length > 0 && !/[\\:]/.test(valor), `path inválido: ${valor}`);
  assert.ok(!path.posix.isAbsolute(valor) && !path.win32.isAbsolute(valor), `path absoluto: ${valor}`);
  assert.equal(path.posix.normalize(valor), valor, `path não canónico: ${valor}`);
  assert.ok(valor.split("/").every((parte) => parte && parte !== "." && parte !== ".."), `path fora da raiz: ${valor}`);
  return valor;
}

function ficheiroLocal(valor) {
  const relativo = caminhoRelativo(valor);
  const absoluto = realpathSync(path.resolve(RAIZ, relativo));
  const desdeRaiz = path.relative(RAIZ, absoluto);
  assert.ok(desdeRaiz && desdeRaiz !== ".." && !desdeRaiz.startsWith(`..${path.sep}`) && !path.isAbsolute(desdeRaiz), `path sai do repo: ${valor}`);
  assert.ok(statSync(absoluto).isFile(), `não é ficheiro: ${valor}`);
  return absoluto;
}

function ficheirosDe(pasta) {
  return readdirSync(path.join(RAIZ, pasta), { withFileTypes: true }).flatMap((entrada) => {
    const relativo = `${pasta}/${entrada.name}`;
    if (entrada.isDirectory()) return ficheirosDe(relativo);
    assert.ok(entrada.isFile(), `entrada não regular: ${relativo}`);
    ficheiroLocal(relativo);
    return [relativo];
  });
}

function linksMarkdown(texto) {
  return [...texto.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)].map((resultado) => resultado[1]);
}

test("as seis skills que adaptam material de outros têm origens fixadas e licenças identificadas", () => {
  assert.equal(INVENTARIO.schemaVersion, 1);
  assert.deepEqual(INVENTARIO.skills.map((skill) => skill.name).sort(), [
    "agentic-analysis-optimization",
    "agentic-architecture",
    "agentic-ci-audit",
    "agentic-fix",
    "agentic-implement",
    "agentic-tool-design",
  ]);
  for (const skill of INVENTARIO.skills) assert.ok(skill.coverage === undefined || skill.coverage === "partial", `${skill.name}: coverage inválida`);
  assert.equal(new Set(INVENTARIO.skills.map((skill) => skill.name)).size, INVENTARIO.skills.length);
  assert.ok(Object.keys(INVENTARIO.upstreams).length > 0);
  for (const [nome, upstream] of Object.entries(INVENTARIO.upstreams)) {
    assert.match(upstream.commit, SHA_GIT, `${nome}: revisão sem pin completo`);
    assert.match(upstream.repository, /^https:\/\/github\.com\/[^/]+\/[^/]+$/);
    assert.equal(upstream.gitUrl, `${upstream.repository}.git`);
    assert.ok(upstream.license.length > 0, `${nome}: licença em falta`);
  }
  for (const skill of INVENTARIO.skills) {
    assert.ok(skill.origin.startsWith(`skills/${skill.name}/`));
    assert.ok(skill.licenseFile.startsWith(`skills/${skill.name}/`));
    ficheiroLocal(`skills/${skill.name}/SKILL.md`);
    ficheiroLocal(skill.origin);
    ficheiroLocal(skill.licenseFile);
  }
});

test("a tabela do README aponta para o upstream de cada skill adaptada", () => {
  const linhas = readFileSync(path.join(RAIZ, "README.md"), "utf8").split(/\r?\n/);
  for (const skill of INVENTARIO.skills) {
    const ficheiro = INVENTARIO.files.find((entrada) => entrada.targetPath === `skills/${skill.name}/SKILL.md`);
    assert.ok(ficheiro, `${skill.name}: SKILL.md sem proveniência`);
    const linha = linhas.find((entrada) => entrada.startsWith(`| \`${skill.name}\` |`));
    assert.ok(linha, `${skill.name}: linha em falta na tabela do README`);
    assert.deepEqual(linksMarkdown(linha), [INVENTARIO.upstreams[ficheiro.upstream].repository], `${skill.name}: origem do README divergiu`);
  }
});

test("cada mapeamento preserva identidade, modo e SHA-256 dos bytes locais", () => {
  assert.ok(INVENTARIO.files.length > 0);
  assert.equal(new Set(INVENTARIO.files.map((ficheiro) => ficheiro.targetPath)).size, INVENTARIO.files.length, "destino repetido");
  for (const ficheiro of INVENTARIO.files) {
    assert.ok(Object.hasOwn(INVENTARIO.upstreams, ficheiro.upstream), `upstream desconhecido: ${ficheiro.upstream}`);
    caminhoRelativo(ficheiro.sourcePath);
    const destino = ficheiroLocal(ficheiro.targetPath);
    assert.match(ficheiro.sourceSha256, SHA256, ficheiro.sourcePath);
    assert.match(ficheiro.targetSha256, SHA256, ficheiro.targetPath);
    assert.ok(ficheiro.mode === "verbatim" || ficheiro.mode === "adapted", `modo inválido: ${ficheiro.mode}`);
    assert.ok(typeof ficheiro.reason === "string" && ficheiro.reason.trim(), `razão em falta: ${ficheiro.targetPath}`);
    const observado = createHash("sha256").update(readFileSync(destino)).digest("hex");
    assert.equal(observado, ficheiro.targetSha256, `hash local divergiu: ${ficheiro.targetPath}`);
    if (ficheiro.mode === "verbatim") {
      assert.equal(ficheiro.targetSha256, ficheiro.sourceSha256, `cópia verbatim alterada: ${ficheiro.targetPath}`);
    } else {
      assert.notEqual(ficheiro.targetSha256, ficheiro.sourceSha256, `adaptação sem diferença: ${ficheiro.targetPath}`);
    }
  }
});

test("o inventário cobre todos os ficheiros curados e cada licença copiada", () => {
  const esperados = new Set(INVENTARIO.files.map((ficheiro) => ficheiro.targetPath));
  for (const skill of INVENTARIO.skills) esperados.add(skill.origin);
  // Uma skill «partial» só adapta alguns ficheiros do upstream; o resto dela é original e fica fora do inventário.
  const inteiras = INVENTARIO.skills.filter((skill) => skill.coverage !== "partial");
  const existentes = inteiras.flatMap((skill) => ficheirosDe(`skills/${skill.name}`));
  const dasInteiras = [...esperados].filter((p) => inteiras.some((skill) => p.startsWith(`skills/${skill.name}/`)));
  assert.deepEqual(existentes.sort(), dasInteiras.sort());
  for (const skill of INVENTARIO.skills.filter((s) => s.coverage === "partial")) {
    const seus = [...esperados].filter((p) => p.startsWith(`skills/${skill.name}/`));
    assert.ok(seus.length >= 3, `${skill.name}: ficheiros adaptados em falta`);
    for (const p of seus) ficheiroLocal(p);
  }
  for (const skill of INVENTARIO.skills) {
    const licença = INVENTARIO.files.find((ficheiro) => ficheiro.targetPath === skill.licenseFile);
    assert.ok(licença, `${skill.name}: licença sem proveniência`);
    assert.equal(licença.mode, "verbatim", `${skill.name}: licença modificada`);
    assert.equal(licença.sourcePath, "LICENSE");
    assert.ok(INVENTARIO.files.some((ficheiro) => ficheiro.targetPath === `skills/${skill.name}/SKILL.md`), `${skill.name}: SKILL.md sem proveniência`);
  }
});

test("as origens ligam a licenças existentes e a todos os ficheiros fonte fixados", () => {
  for (const skill of INVENTARIO.skills) {
    const origem = ficheiroLocal(skill.origin);
    const links = linksMarkdown(readFileSync(origem, "utf8"));
    const locais = links.filter((link) => !/^[a-z][a-z0-9+.-]*:/i.test(link) && !link.startsWith("#"));
    const destinos = locais.map((link) => {
      const semFragmento = decodeURIComponent(link.split("#")[0]);
      const relativo = path.relative(RAIZ, path.resolve(path.dirname(origem), semFragmento)).split(path.sep).join("/");
      ficheiroLocal(relativo);
      return relativo;
    });
    assert.ok(destinos.includes(skill.licenseFile), `${skill.name}: link da licença em falta`);
    for (const ficheiro of INVENTARIO.files.filter((entrada) => entrada.targetPath.startsWith(`skills/${skill.name}/`))) {
      const upstream = INVENTARIO.upstreams[ficheiro.upstream];
      const esperado = `${upstream.repository}/blob/${upstream.commit}/${ficheiro.sourcePath}`;
      assert.ok(links.includes(esperado), `${skill.name}: origem sem ${esperado}`);
    }
  }
});

test("os materiais importados usam links de ficheiro fixados, sem main móvel", () => {
  const paths = new Set([...INVENTARIO.files.map((ficheiro) => ficheiro.targetPath), ...INVENTARIO.skills.map((skill) => skill.origin)]);
  for (const relativo of paths) {
    const texto = readFileSync(ficheiroLocal(relativo), "utf8");
    assert.doesNotMatch(texto, /https?:\/\/(?:github\.com\/[^/\s]+\/[^/\s]+\/(?:blob|raw|tree)|raw\.githubusercontent\.com\/[^/\s]+\/[^/\s]+)\/(?:main|master|HEAD)(?=[/#\s)<>]|$)/i, `${relativo}: link móvel`);
    for (const upstream of Object.values(INVENTARIO.upstreams)) {
      const prefixo = `${upstream.repository}/blob/`;
      for (const link of linksMarkdown(texto).filter((destino) => destino.startsWith(prefixo))) {
        assert.match(link.slice(prefixo.length).split("/")[0], SHA_GIT, `${relativo}: link sem revisão completa`);
      }
    }
  }
});
