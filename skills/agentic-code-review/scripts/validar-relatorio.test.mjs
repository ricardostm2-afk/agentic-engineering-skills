// Testes do validar-relatorio.mjs — `node --test` a partir da raiz do repo das skills.
// Cada relatório mau prova uma recusa; o bom e o do modelo (assets/relatorio.template.md)
// provam que o validador não recusa o que a skill manda escrever.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { validarRelatorio } from "./validar-relatorio.mjs";

const AQUI = import.meta.dirname;
const SCRIPT = path.join(AQUI, "validar-relatorio.mjs");
const MODELO = path.join(AQUI, "..", "assets", "relatorio.template.md");

const BOM = `Revisão 2bfcbbc05a1e · Padrão · ronda 1/2 · 2 Importantes · 1 Nit · 1 Pré-existente

[Importante] src/api/faturas.ts:88 — o total ignora o desconto da entidade — reproduz: npm test -- faturas.desconto (vermelho) — classe: total recalculado à parte
[Importante] docs/RUNBOOK.md:41 — manda correr scripts/migrar.sh, que já não existe — reproduz: ausente: scripts/migrar.sh (git ls-tree) — classe: doc que mente
[Nit] src/api/faturas.ts:12 — import por usar

Pré-existentes: src/lib/datas.ts:30 · fuso horário fixo
Não li: nada`;

const LIMPO = `Revisão 2bfcbbc · Completa · lente segurança · ronda 2/3 · 0 Importantes · 0 Nits · 0 Pré-existentes
0 Importantes — nada a corrigir

Pré-existentes: nenhum`;

const problemas = (texto) => validarRelatorio(texto).problemas.map((p) => p.msg);
const recusa = (texto, padrao) => {
  const r = validarRelatorio(texto);
  assert.equal(r.ok, false, "devia recusar");
  assert.ok(r.problemas.some((p) => padrao.test(p.msg)), `nenhum problema casa ${padrao}: ${JSON.stringify(r.problemas)}`);
};

test("um relatório bom passa (Importantes, um Nit, um Pré-existente)", () => {
  assert.deepEqual(problemas(BOM), []);
  const r = validarRelatorio(BOM);
  assert.equal(r.ok, true);
  assert.deepEqual(
    { sha: r.cabecalho.sha, via: r.cabecalho.via, ronda: r.cabecalho.ronda, limite: r.cabecalho.limite },
    { sha: "2bfcbbc05a1e", via: "Padrão", ronda: 1, limite: 2 },
  );
});

test("sem achados passa com «0 Importantes — nada a corrigir» logo a seguir", () => {
  assert.deepEqual(problemas(LIMPO), []);
});

test("o exemplo do modelo de relatório passa (o modelo e o validador dizem o mesmo)", () => {
  const modelo = readFileSync(MODELO, "utf8");
  const blocos = [...modelo.matchAll(/```text exemplo\n([\s\S]*?)```/g)].map((m) => m[1]);
  assert.ok(blocos.length >= 2, "o modelo perdeu os blocos ```text exemplo");
  for (const b of blocos) assert.deepEqual(problemas(b), [], b.split("\n")[0]);
});

// ---------------------------------------------------------------------------
// 1.ª linha
// ---------------------------------------------------------------------------

test("recusa uma 1.ª linha sem o formato da contagem", () => {
  recusa("Revisão do ramo: tudo bem\n0 Importantes — nada a corrigir\nPré-existentes: nenhum", /1\.ª linha/);
  recusa("\n\n[Importante] a.ts:1 — x — reproduz: y — classe: z", /1\.ª linha/);
});

test("recusa um SHA que não é hexadecimal ou é curto demais", () => {
  recusa(LIMPO.replace("2bfcbbc", "HEAD"), /1\.ª linha/);
  recusa(LIMPO.replace("2bfcbbc", "2bfc"), /1\.ª linha/);
});

test("recusa a via por preencher", () => {
  recusa(LIMPO.replace("Completa", "<via>"), /via/);
});

test("recusa a ronda acima do limite e a ronda 0", () => {
  recusa(LIMPO.replace("ronda 2/3", "ronda 4/3"), /ronda 4 acima do limite 3/);
  recusa(LIMPO.replace("ronda 2/3", "ronda 0/3"), /ronda/);
});

test("recusa contagens que não batem com os achados", () => {
  recusa(BOM.replace("2 Importantes", "3 Importantes"), /Importantes: a 1\.ª linha diz 3, há 2/);
  recusa(BOM.replace("1 Nit ", "2 Nits "), /Nits: a 1\.ª linha diz 2, há 1/);
  recusa(BOM.replace("1 Pré-existente", "2 Pré-existentes"), /Pré-existentes: a 1\.ª linha diz 2, há 1/);
});

// ---------------------------------------------------------------------------
// «nada a corrigir»
// ---------------------------------------------------------------------------

test("recusa 0 Importantes sem «0 Importantes — nada a corrigir»", () => {
  recusa(LIMPO.replace("0 Importantes — nada a corrigir\n", ""), /nada a corrigir/);
});

test("recusa «nada a corrigir» quando há Importantes", () => {
  recusa(BOM.replace("\n\n[Importante]", "\n0 Importantes — nada a corrigir\n\n[Importante]"), /nada a corrigir.*há 2 Importantes/);
});

// ---------------------------------------------------------------------------
// Importantes e prova
// ---------------------------------------------------------------------------

test("recusa um Importante sem ficheiro:linha", () => {
  recusa(BOM.replace("src/api/faturas.ts:88", "src/api/faturas.ts"), /sem ficheiro:linha/);
  recusa(BOM.replace("src/api/faturas.ts:88", "a função calcularTotal"), /sem ficheiro:linha/);
});

test("recusa um Importante sem «reproduz:» ou sem classe", () => {
  recusa(BOM.replace(" — reproduz: npm test -- faturas.desconto (vermelho)", ""), /reproduz/);
  recusa(BOM.replace(" — classe: total recalculado à parte", ""), /classe/);
  recusa(BOM.replace("reproduz: npm test -- faturas.desconto (vermelho)", "reproduz: "), /reproduz/);
});

test("num doc, recusa a prova só com a linha do doc (falta a linha que o desmente)", () => {
  recusa(BOM.replace("reproduz: ausente: scripts/migrar.sh (git ls-tree)", "reproduz: li o doc"), /doc.*desmente/);
  const comLinha = BOM.replace("reproduz: ausente: scripts/migrar.sh (git ls-tree)", "reproduz: scripts/README.md:3 lista só deploy.sh");
  assert.deepEqual(problemas(comLinha), []);
});

test("numa dependência, recusa a prova sem a ausência na pesquisa aprovada", () => {
  const dep = (prova) =>
    `Revisão abcdef1 · Padrão · ronda 1/2 · 1 Importante · 0 Nits · 0 Pré-existentes\n` +
    `[Importante] package.json:31 — entra a dependência left-pad — reproduz: ${prova} — classe: dependência fora da pesquisa\n` +
    `Pré-existentes: nenhum`;
  recusa(dep("git diff base...head -- package.json"), /dependência.*ausente em/);
  assert.deepEqual(problemas(dep("git diff base...head -- package.json; ausente em specs/012/research.md")), []);
  recusa(dep("git diff base...head -- package.json; ausente em nada"), /fora da pesquisa.*ausente em/);
});

test("uma dependência vulnerável prova-se como código, sem pesquisa aprovada", () => {
  const r =
    `Revisão abcdef1 · Padrão · ronda 1/2 · 1 Importante · 0 Nits · 0 Pré-existentes\n` +
    `[Importante] package.json:31 — lodash 4.17.20 com CVE conhecido — reproduz: npm audit --omit=dev (alto) — classe: dependência vulnerável\n` +
    `Pré-existentes: nenhum`;
  assert.deepEqual(problemas(r), []);
});

// ---------------------------------------------------------------------------
// Nits, etiquetas, ordem e Pré-existentes
// ---------------------------------------------------------------------------

test("recusa mais de 3 Nits", () => {
  const nits = Array.from({ length: 4 }, (_, i) => `[Nit] src/a.ts:${i + 1} — nome confuso`).join("\n");
  const r = `Revisão abcdef1 · Padrão · ronda 1/2 · 0 Importantes · 4 Nits · 0 Pré-existentes\n0 Importantes — nada a corrigir\n${nits}\nPré-existentes: nenhum`;
  recusa(r, /4 Nits.*máximo 3/);
});

test("recusa um Nit sem ficheiro:linha", () => {
  recusa(BOM.replace("[Nit] src/api/faturas.ts:12", "[Nit] faturas"), /Nit sem ficheiro:linha/);
});

test("recusa etiquetas que não são as da skill", () => {
  recusa(BOM.replace("[Nit]", "[Crítico]"), /etiqueta desconhecida «Crítico»/);
});

test("recusa um Importante depois de um Nit (ordem por gravidade)", () => {
  const linhas = BOM.split("\n");
  const nit = linhas.findIndex((l) => l.startsWith("[Nit]"));
  const [n] = linhas.splice(nit, 1);
  linhas.splice(2, 0, n);
  recusa(linhas.join("\n"), /depois de um Nit/);
});

test("recusa Pré-existentes em várias linhas, em falta ou sem ficheiro:linha", () => {
  recusa(BOM.replace("Pré-existentes: src/lib/datas.ts:30 · fuso horário fixo", "[Pré-existente] src/lib/datas.ts:30 · fuso"), /Pré-existentes.*numa linha/);
  recusa(BOM.replace("Pré-existentes: src/lib/datas.ts:30 · fuso horário fixo", ""), /falta a linha «Pré-existentes:/);
  recusa(BOM + "\nPré-existentes: nenhum", /mais de uma linha «Pré-existentes:/);
  recusa(BOM.replace("src/lib/datas.ts:30 · fuso", "datas · fuso"), /Pré-existente sem ficheiro:linha/);
  recusa(LIMPO.replace("Pré-existentes: nenhum", "Pré-existentes: "), /nenhum/);
  recusa(BOM.replace(" · fuso horário fixo", ""), /Pré-existente sem classe/);
});

test("recusa uma etiqueta fora do início da linha (o achado escondia-se da contagem)", () => {
  const com = (linha) =>
    `Revisão abcdef1 · Padrão · ronda 1/2 · 0 Importantes · 0 Nits · 0 Pré-existentes\n0 Importantes — nada a corrigir\n${linha}\nPré-existentes: nenhum`;
  recusa(com("- [Importante] src/a.ts:3 — perde o desconto — reproduz: npm test — classe: total à parte"), /fora do início da linha/);
  recusa(com("1. [Nit] sem nada"), /fora do início da linha/);
  recusa(com("**[Importante]** sem ficheiro"), /fora do início da linha/);
});

test("recusa um limite de rondas acima do do nível da skill", () => {
  recusa(BOM.replace("Padrão · ronda 1/2", "Padrão · ronda 3/3"), /limite 3 acima do do nível «Padrão» \(2\)/);
  recusa(BOM.replace("Padrão · ronda 1/2", "Rápida (pedida) · ronda 2/2"), /nível «Rápida \(pedida\)» \(1\)/);
  assert.deepEqual(problemas(BOM.replace("Padrão · ronda 1/2", "Profunda · ronda 3/3")), []);
});

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function correr(args, input) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", input });
  return { codigo: r.status, out: r.stdout + r.stderr };
}

test("CLI: 0 com um relatório bom, 1 com um mau (com a lista), 2 sem ficheiro", (t) => {
  const pasta = mkdtempSync(path.join(tmpdir(), "validar-relatorio-"));
  t.after(() => rmSync(pasta, { recursive: true, force: true }));
  const bom = path.join(pasta, "bom.md");
  const mau = path.join(pasta, "mau.md");
  writeFileSync(bom, BOM);
  writeFileSync(mau, BOM.replace("2 Importantes", "5 Importantes").replace("src/api/faturas.ts:88", "faturas"));
  const ok = correr([bom]);
  assert.equal(ok.codigo, 0, ok.out);
  assert.match(ok.out, /^ok: /);
  const falha = correr([mau]);
  assert.equal(falha.codigo, 1, falha.out);
  assert.match(falha.out, /sem ficheiro:linha/);
  assert.match(falha.out, /a 1\.ª linha diz 5, há 2/);
  assert.equal(correr([]).codigo, 2);
  assert.equal(correr([path.join(pasta, "nao-existe.md")]).codigo, 2);
});

test("CLI: lê da entrada padrão com «-» e dá JSON com --json", () => {
  const r = correr(["--json", "-"], LIMPO);
  assert.equal(r.codigo, 0, r.out);
  const j = JSON.parse(r.out);
  assert.equal(j.ok, true);
  assert.equal(j.cabecalho.importantes, 0);
});

test("CLI: chamado por uma ligação simbólica (a instalação --ligar) dá o mesmo resultado que pelo caminho real", (t) => {
  const pasta = mkdtempSync(path.join(tmpdir(), "validar-relatorio-ligacao-"));
  // As ligações saem primeiro: o rmSync recursivo nunca chega ao repo para onde apontam.
  const ligacaoDaSkill = path.join(pasta, "agentic-code-review");
  const ligacaoDoScript = path.join(pasta, "outro-nome.mjs");
  t.after(() => {
    // Se o teste falhou antes de criar uma ligação, a limpeza segue para as outras.
    for (const ligacao of [ligacaoDaSkill, ligacaoDoScript]) rmSync(ligacao, { force: true });
    rmSync(pasta, { recursive: true, force: true });
  });
  symlinkSync(path.join(AQUI, ".."), ligacaoDaSkill, "dir");
  symlinkSync(SCRIPT, ligacaoDoScript, "file");
  const bom = path.join(pasta, "bom.md");
  const mau = path.join(pasta, "mau.md");
  writeFileSync(bom, BOM);
  writeFileSync(mau, "isto não é um relatório de revisão\n");
  const pelaSkill = path.join(ligacaoDaSkill, "scripts", "validar-relatorio.mjs");
  for (const script of [SCRIPT, pelaSkill, ligacaoDoScript]) {
    const aoMau = spawnSync(process.execPath, [script, mau], { encoding: "utf8" });
    assert.equal(aoMau.status, 1, `${script}: um texto que não é relatório sai 1 (saiu ${aoMau.status}, ${JSON.stringify(aoMau.stdout + aoMau.stderr)})`);
    assert.match(aoMau.stdout, /^falha: /, script);
    const aoBom = spawnSync(process.execPath, [script, bom], { encoding: "utf8" });
    assert.equal(aoBom.status, 0, `${script}: ${aoBom.stdout}${aoBom.stderr}`);
    assert.match(aoBom.stdout, /^ok: /, script);
    assert.equal(spawnSync(process.execPath, [script], { encoding: "utf8" }).status, 2, `${script}: sem ficheiro sai 2`);
  }
});
