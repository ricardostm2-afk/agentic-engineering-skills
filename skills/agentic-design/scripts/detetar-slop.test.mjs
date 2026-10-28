// Testes do detetar-slop.mjs — `node --test` nesta pasta.
// Cada fixture diz o que prova; as linhas esperadas encontram-se pelo texto,
// para o teste não partir quando alguém acrescenta uma linha à fixture.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

const AQUI = import.meta.dirname;
const SCRIPT = path.join(AQUI, "detetar-slop.mjs");

function correr(args, cwd = AQUI) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: "utf8" });
  const json = args.includes("--json") && r.status !== 2 ? JSON.parse(r.stdout) : null;
  return { codigo: r.status, out: r.stdout, err: r.stderr, json };
}

const achados = (...ficheiros) => correr(["--json", ...ficheiros]).json.achados.map((a) => `${a.linha} ${a.regra}`).sort();
const linhaCom = (ficheiro, trecho) => {
  const n = readFileSync(path.join(AQUI, ficheiro), "utf8").split("\n").findIndex((l) => l.includes(trecho)) + 1;
  assert.ok(n > 0, `a fixture ${ficheiro} já não tem «${trecho}»`);
  return n;
};
const esperado = (ficheiro, pares) => pares.map(([trecho, regra]) => `${linhaCom(ficheiro, trecho)} ${regra}`).sort();

// -----------------------------------------------------------------------------
// Limpo: zero achados, sai 0
// -----------------------------------------------------------------------------

test("um ecrã limpo (TSX e CSS) dá 0 achados e sai 0 — comentários, tokens, cápsulas, diálogos e impressão não contam", () => {
  const r = correr(["--json", "fixtures/limpo.tsx", "fixtures/limpo.module.css", "fixtures/componente.vue"]);
  assert.equal(r.codigo, 0);
  assert.deepEqual(r.json.achados, []);
  assert.equal(r.json.resumo.ficheiros, 3);
});

// -----------------------------------------------------------------------------
// Bloqueios: cada regra apanhada na linha certa, sai 1
// -----------------------------------------------------------------------------

test("TSX: cada bloqueio na sua linha", () => {
  const f = "fixtures/bloqueios.tsx";
  assert.deepEqual(
    achados(f),
    esperado(f, [
      ["from-indigo-500", "gradiente-roxo"],
      ["from-sky-400", "gradiente-de-fundo"],
      ["Desbloqueie", "microcopia-marketing"],
      ["text-[10px]", "letra-pequena"],
      ["✨ Novidades", "emoji"],
      ["Bem-vindo de volta!", "microcopia-marketing"],
      ["fontSize: 11", "letra-pequena"],
      ["#7c3aed", "gradiente-roxo"],
      ["Seamless", "escape-sem-motivo"],
      ["Seamless", "microcopia-marketing"],
      ["uppercase tracking-widest", "maiusculas-espacadas"],
      ["transition-all", "transicao-all"]
    ])
  );
  assert.equal(correr([f]).codigo, 1);
});

test("CSS: gradiente roxo (também num token), gradiente no fundo do hero, letra pequena, emoji em content, maiúsculas espaçadas, transition: all", () => {
  const f = "fixtures/bloqueios.module.css";
  assert.deepEqual(
    achados(f),
    esperado(f, [
      ["#6366f1", "gradiente-roxo"],
      ["#0ea5e9", "gradiente-de-fundo"],
      ["0.65rem", "letra-pequena"],
      ['content: "✨"', "emoji"],
      ["hsl(265", "gradiente-roxo"],
      ["text-transform: uppercase", "maiusculas-espacadas"],
      ["transition: all", "transicao-all"]
    ])
  );
});

test("HTML: o <style> conta, o comentário <!-- --> não; emoji e marketing em inglês", () => {
  const f = "fixtures/pagina.html";
  assert.deepEqual(
    achados(f),
    esperado(f, [
      ["#4f46e5", "gradiente-roxo"],
      ["font-size: 10px", "letra-pequena"],
      ["Welcome back", "emoji"],
      ["Welcome back", "microcopia-marketing"],
      ["Unlock", "microcopia-marketing"]
    ])
  );
});

// -----------------------------------------------------------------------------
// Avisos: listados, mas saem 0
// -----------------------------------------------------------------------------

test("avisos (cor literal, cantos, sombras repetidas, «Sem dados» e as regras de movimento e de estrutura) saem 0", () => {
  const r = correr(["--json", "fixtures/avisos.tsx", "fixtures/avisos.module.css"]);
  assert.equal(r.codigo, 0);
  assert.equal(r.json.resumo.bloqueios, 0);
  const regras = new Set(r.json.achados.map((a) => a.regra));
  assert.deepEqual([...regras].sort(), [
    "borda-lateral", "botao-contorno", "canto-grande", "cor-literal", "hover-move-alvo", "movimento-continuo",
    "numeracao-decorativa", "sem-dados", "sombra-grande", "traco-vazio", "vidro-no-conteudo"
  ]);
  assert.ok(r.json.achados.every((a) => a.severidade === "aviso"));
});

// -----------------------------------------------------------------------------
// Regras da consolidação da UI: uma por teste, na linha certa. Os
// negativos de cada uma estão no limpo.tsx e no limpo.module.css (0 achados).
// -----------------------------------------------------------------------------

const daRegra = (regra, ...ficheiros) => {
  const r = correr(["--json", ...ficheiros]).json.achados.filter((a) => a.regra === regra);
  return { onde: r.map((a) => `${a.ficheiro}:${a.linha}`).sort(), severidades: [...new Set(r.map((a) => a.severidade))] };
};
const em = (...pares) => pares.map(([ficheiro, trecho]) => `${ficheiro}:${linhaCom(ficheiro, trecho)}`).sort();

test("maiusculas-espacadas é bloqueio (B13), em classes e em CSS", () => {
  const r = daRegra("maiusculas-espacadas", "fixtures/bloqueios.tsx", "fixtures/bloqueios.module.css");
  assert.deepEqual(r.onde, em(["fixtures/bloqueios.tsx", "uppercase tracking-widest"], ["fixtures/bloqueios.module.css", "text-transform: uppercase"]));
  assert.deepEqual(r.severidades, ["bloqueio"]);
});

// Corre o detetor sobre um ficheiro escrito numa pasta temporária e devolve as linhas da regra.
function linhasDaRegra(regra, nome, texto) {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "slop-regra-")));
  try {
    writeFileSync(path.join(dir, nome), texto);
    return correr(["--json", nome], dir).json.achados.filter((a) => a.regra === regra).map((a) => a.linha);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const tsxComClasses = (classes) => `export const A = () => <span className="${classes}">sigla</span>;\n`;

// Só bloqueia o que é exato (§14 da SKILL.md): maiúsculas com tracking positivo a partir de 0,03 em
// (0,5 px), no CSS e nas classes. Um tracking negativo ou abaixo do limiar é legítimo (siglas, números).
for (const [classes, bloqueia] of [
  ["uppercase tracking-[-0.02em]", false],
  ["uppercase tracking-[0.02em]", false],
  ["uppercase tracking-[0.3px]", false],
  ["uppercase -tracking-widest", false],
  ["uppercase tracking-[0.1em]", true],
  ["uppercase tracking-[0.03em]", true],
  ["uppercase tracking-[2px]", true],
  ["uppercase tracking-wide", true],
  ["uppercase tracking-wider", true],
  ["uppercase tracking-widest", true],
  ["md:tracking-[0.05em] uppercase", true]
]) {
  test(`maiusculas-espacadas em classes: «${classes}» ${bloqueia ? "bloqueia" : "não dá achado"}`, () => {
    const r = linhasDaRegra("maiusculas-espacadas", "a.tsx", tsxComClasses(classes));
    assert.deepEqual(r, bloqueia ? [1] : []);
  });
}

test("maiusculas-espacadas: as classes e o CSS bloqueiam com o mesmo limiar", () => {
  const valores = ["-0.02em", "0.02em", "0.03em", "0.1em", "0.05rem", "0.3px", "0.5px", "2px"];
  const css = linhasDaRegra("maiusculas-espacadas", "a.module.css", valores.map((v, i) => `.c${i} { text-transform: uppercase; letter-spacing: ${v}; }\n`).join(""));
  const tsx = linhasDaRegra("maiusculas-espacadas", "a.tsx", valores.map((v) => `export const A = () => <span className="uppercase tracking-[${v}]">sigla</span>;\n`).join(""));
  assert.deepEqual(css, [3, 4, 5, 7, 8], "o CSS bloqueia a partir de 0,03 em e de 0,5 px");
  assert.deepEqual(tsx, css);
});

test("transicao-all: transition-all e transition: all são bloqueio (B18); transition: opacity não", () => {
  const r = daRegra("transicao-all", "fixtures/bloqueios.tsx", "fixtures/bloqueios.module.css");
  assert.deepEqual(r.onde, em(["fixtures/bloqueios.tsx", "transition-all"], ["fixtures/bloqueios.module.css", "transition: all"]));
  assert.deepEqual(r.severidades, ["bloqueio"]);
});

test("hover-move-alvo: hover:-translate e transform em :hover fora de @media (hover: hover) são aviso (B18)", () => {
  const r = daRegra("hover-move-alvo", "fixtures/avisos.tsx", "fixtures/avisos.module.css");
  assert.deepEqual(r.onde, em(["fixtures/avisos.tsx", "hover:-translate-y-1"], ["fixtures/avisos.module.css", "transform: translateY(-2px)"]));
  assert.deepEqual(r.severidades, ["aviso"]);
});

test("movimento-continuo: animação infinita fora de uma espera é aviso (B18, B22); o spinner não", () => {
  const r = daRegra("movimento-continuo", "fixtures/avisos.tsx", "fixtures/avisos.module.css");
  assert.deepEqual(r.onde, em(["fixtures/avisos.tsx", "animate-ping"], ["fixtures/avisos.module.css", "animation: respirar"]));
  assert.deepEqual(r.severidades, ["aviso"]);
});

test("vidro-no-conteudo: desfoque atrás de uma lista é aviso (B22); na barra lateral e na navegação não", () => {
  const r = daRegra("vidro-no-conteudo", "fixtures/avisos.tsx", "fixtures/avisos.module.css");
  assert.deepEqual(r.onde, em(["fixtures/avisos.tsx", "backdrop-blur-md"], ["fixtures/avisos.module.css", "backdrop-filter: blur(12px)"]));
  assert.deepEqual(r.severidades, ["aviso"]);
});

test("borda-lateral: borda esquerda de 2 px ou mais a marcar um bloco é aviso (B17); navegação, item ativo e citação não", () => {
  const r = daRegra("borda-lateral", "fixtures/avisos.tsx", "fixtures/avisos.module.css");
  assert.deepEqual(r.onde, em(["fixtures/avisos.tsx", "border-l-4"], ["fixtures/avisos.module.css", "border-left: 4px"]));
  assert.deepEqual(r.severidades, ["aviso"]);
});

test("botao-contorno: botão delimitado por uma linha é aviso (B20); foco, cores forçadas e campos não", () => {
  const r = daRegra("botao-contorno", "fixtures/avisos.tsx", "fixtures/avisos.module.css");
  assert.deepEqual(r.onde, em(["fixtures/avisos.tsx", 'variant="outline"'], ["fixtures/avisos.tsx", "border bg-transparent"], ["fixtures/avisos.module.css", "border: 1px solid var(--marca)"]));
  assert.deepEqual(r.severidades, ["aviso"]);
});

test("traco-vazio: «-» no lugar de um campo vazio é aviso (B15); a string vazia não", () => {
  const r = daRegra("traco-vazio", "fixtures/avisos.tsx");
  assert.deepEqual(r.onde, em(["fixtures/avisos.tsx", '?? "-"']));
  assert.deepEqual(r.severidades, ["aviso"]);
});

test("numeracao-decorativa: «01 / Dados» é aviso (B13); «Passo 2 de 3» não", () => {
  const r = daRegra("numeracao-decorativa", "fixtures/avisos.tsx");
  assert.deepEqual(r.onde, em(["fixtures/avisos.tsx", "01 / Dados"]));
  assert.deepEqual(r.severidades, ["aviso"]);
});

test("uma sombra grande sozinha é uma camada; três ou mais no conjunto são «sombra em tudo»", () => {
  const sozinha = correr(["--json", "fixtures/avisos.module.css"]).json.achados.map((a) => a.regra);
  assert.ok(!sozinha.includes("sombra-grande"), "uma só sombra grande não é tique");
  const tres = correr(["--json", "fixtures/avisos.tsx"]).json.achados.filter((a) => a.regra === "sombra-grande");
  assert.equal(tres.length, 3);
});

// -----------------------------------------------------------------------------
// Escapes
// -----------------------------------------------------------------------------

test("escape com motivo (na linha anterior ou na própria) cala o achado", () => {
  const r = correr(["--json", "fixtures/escape-valido.tsx"]);
  assert.equal(r.codigo, 0);
  assert.deepEqual(r.json.achados, []);
});

test("escape sem motivo é ele próprio um bloqueio e não cala nada", () => {
  const f = "fixtures/escape-sem-motivo.tsx";
  assert.deepEqual(
    achados(f),
    esperado(f, [
      ["// slop-ok", "escape-sem-motivo"],
      ["🚀", "emoji"],
      ["slop-ok: ok", "escape-sem-motivo"],
      ["text-[9px]", "letra-pequena"]
    ])
  );
  assert.equal(correr([f]).codigo, 1);
});

// -----------------------------------------------------------------------------
// Pastas, testes e extensões
// -----------------------------------------------------------------------------

test("numa pasta, os ficheiros de teste e as extensões não suportadas ficam de fora", () => {
  const r = correr(["--json", "fixtures/pasta-com-testes"]);
  assert.equal(r.codigo, 0);
  assert.equal(r.json.resumo.ficheiros, 1, "só o ok.tsx: o .test.tsx, o .spec.tsx e o .md não se analisam");
});

test("--json traz resumo por regra e cada achado com ficheiro, linha, severidade e sugestão", () => {
  const r = correr(["--json", "fixtures/bloqueios.tsx"]);
  assert.equal(r.json.resumo.porRegra["gradiente-roxo"], 2);
  for (const a of r.json.achados) {
    assert.equal(a.ficheiro, path.join("fixtures", "bloqueios.tsx"));
    assert.ok(a.linha > 0 && a.sugestao.length > 10 && ["bloqueio", "aviso"].includes(a.severidade));
  }
});

test("saída legível: ficheiro:linha, severidade, regra e a sugestão por baixo", () => {
  const r = correr(["fixtures/escape-sem-motivo.tsx"]);
  assert.match(r.out, /^fixtures\/escape-sem-motivo\.tsx:3 {2}bloqueio {2}emoji /m);
  assert.match(r.out, /^ {4}→ /m);
  assert.match(r.out, /4 bloqueio\(s\), 0 aviso\(s\)\.$/m);
});

// -----------------------------------------------------------------------------
// Falha fechada: sai 2
// -----------------------------------------------------------------------------

test("argumentos inválidos saem 2 com mensagem", () => {
  for (const args of [[], ["--nao-existe", "fixtures"], ["--diff"], ["--diff", "--json"], ["fixtures/nao-existe.tsx"]]) {
    const r = correr(args);
    assert.equal(r.codigo, 2, `args ${JSON.stringify(args)} deviam sair 2`);
    assert.match(r.err, /detetar-slop: /);
  }
});

test("ficheiro ilegível sai 2 (nunca «limpo» sobre o que não leu)", (t) => {
  if (process.getuid?.() === 0) return t.skip("root lê tudo");
  const dir = mkdtempSync(path.join(tmpdir(), "slop-ilegivel-"));
  const f = path.join(dir, "fechado.tsx");
  writeFileSync(f, "export const A = () => <p>ok</p>;\n");
  chmodSync(f, 0o000);
  try {
    const r = correr([f]);
    assert.equal(r.codigo, 2);
    assert.match(r.err, /não consegui ler/);
  } finally {
    chmodSync(f, 0o644);
    rmSync(dir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// --diff num repositório git temporário
// -----------------------------------------------------------------------------

test("--diff <ref> analisa só o que mudou (alterado e novo), não o que já estava", () => {
  const repo = realpathSync(mkdtempSync(path.join(tmpdir(), "slop-diff-")));
  const git = (...a) => execFileSync("git", a, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  try {
    git("init", "-q", "-b", "main");
    git("config", "user.email", "teste@exemplo.invalid");
    git("config", "user.name", "Teste");
    mkdirSync(path.join(repo, "src"));
    writeFileSync(path.join(repo, "src", "antigo.tsx"), "export const A = () => <h1>✨ antigo</h1>;\n");
    writeFileSync(path.join(repo, "src", "base.tsx"), "export const B = () => <p>ok</p>;\n");
    writeFileSync(path.join(repo, "src", "apagar.tsx"), "export const C = () => <p>ok</p>;\n");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    writeFileSync(path.join(repo, "src", "base.tsx"), "export const B = () => <p>🚀 ok</p>;\n");
    writeFileSync(path.join(repo, "src", "novo.module.css"), ".x {\n  font-size: 9px;\n}\n");
    writeFileSync(path.join(repo, "src", "notas.md"), "✨\n");
    rmSync(path.join(repo, "src", "apagar.tsx"));

    const r = correr(["--json", "--diff", "HEAD"], repo);
    assert.equal(r.codigo, 1);
    assert.equal(r.json.resumo.ficheiros, 2, "base.tsx (alterado) e novo.module.css (novo); o apagado e o .md não");
    assert.deepEqual(r.json.achados.map((a) => `${a.ficheiro}:${a.linha} ${a.regra}`).sort(), ["src/base.tsx:1 emoji", "src/novo.module.css:2 letra-pequena"]);

    const filtrado = correr(["--json", "--diff", "HEAD", "src/novo.module.css"], repo);
    assert.equal(filtrado.json.resumo.ficheiros, 1, "caminhos depois da ref filtram o diff");

    const ref = correr(["--diff", "ref-que-nao-existe"], repo);
    assert.equal(ref.codigo, 2);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("--diff fora de um repositório git sai 2", () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "slop-sem-git-")));
  try {
    const r = spawnSync(process.execPath, [SCRIPT, "--diff", "HEAD"], { cwd: dir, encoding: "utf8", env: { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(dir) } });
    assert.equal(r.status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// HTML em JS/TS, ficheiros de tradução e o que não se lê
// -----------------------------------------------------------------------------

test("HTML num template string de .js conta como interface (também o <style> lá dentro)", () => {
  const f = "fixtures/render.js";
  assert.deepEqual(
    achados(f),
    esperado(f, [
      ["font-size: 10px", "letra-pequena"],
      ["🚀", "emoji"],
      ["Desbloqueie", "microcopia-marketing"],
      ["font-size: 9px", "letra-pequena"]
    ])
  );
  assert.equal(correr([f]).codigo, 1);
});

test("ficheiro de tradução: só regras de texto; em JSON o escape é uma linha \"//\" antes da chave", () => {
  const f = "fixtures/locales/pt.json";
  const r = correr(["--json", f]);
  assert.deepEqual(
    r.json.achados.map((a) => `${a.linha} ${a.regra}`).sort(),
    esperado(f, [
      ["Bem-vindo de volta", "emoji"],
      ["Bem-vindo de volta", "microcopia-marketing"],
      ["Sem dados", "sem-dados"],
      ["✨ Novidades", "emoji"]
    ]),
    "o escape cala só a linha seguinte (🎂), não a outra (✨)"
  );
  assert.equal(r.json.escapes.length, 1);
  assert.deepEqual(r.json.escapes[0].cala, [`${linhaCom(f, "🎂")} emoji`]);
  assert.deepEqual(
    r.json.permitidos.map((p) => `${p.linha} ${p.regra}`).sort(),
    esperado(f, [["👍", "emoji"], ["❤️", "emoji"]]),
    "um valor só de emoji (as reações) é dado: não bloqueia e lista-se"
  );
});

test("escape em bloco cala o bloco e lista-se; bloco sem fim é bloqueio e não cala nada", () => {
  const f = "fixtures/escape-bloco.tsx";
  const r = correr(["--json", f]);
  assert.deepEqual(
    r.json.achados.map((a) => `${a.linha} ${a.regra}`).sort(),
    esperado(f, [
      ["✨ Reações", "emoji"],
      ["bloco que nunca fecha", "escape-sem-fim"],
      ["🚀 Lançar", "emoji"]
    ])
  );
  assert.equal(r.json.escapes[0].motivo, "seletor de reações com emoji no rótulo, aprovado pelo dono (DESIGN.md)");
  assert.equal(r.json.escapes[0].cala.length, 3);
});

// -----------------------------------------------------------------------------
// Escape legítimo sem comentário: emoji como dado e gradiente de marca declarado
// -----------------------------------------------------------------------------

test("emoji como dado (valor só de emoji numa lista/objeto, ou chave de conteúdo) não bloqueia e lista-se; como ícone bloqueia", () => {
  const f = "fixtures/emoji-dado.tsx";
  const r = correr(["--json", f]);
  assert.equal(r.codigo, 1);
  assert.deepEqual(
    r.json.achados.map((a) => `${a.linha} ${a.regra}`).sort(),
    esperado(f, [
      ["✨ Novidades", "emoji"],
      ["🚀", "emoji"],
      ["📊", "emoji"],
      ["⭐", "emoji"],
      ["👋 Olá", "emoji"],
      ["🔥", "emoji"],
      ["🎯", "emoji"]
    ]),
    "literal no JSX, atributo, chave de ícone/rótulo, constante solta ou HTML num template: ícone"
  );
  assert.deepEqual(
    r.json.permitidos.map((p) => `${p.linha} ${p.regra}`).sort(),
    esperado(f, [
      ['["👍", "😂", "🎉"]', "emoji"],
      ['emoji: "👍"', "emoji"],
      ['reacao: "🎉"', "emoji"],
      ['"❤️"', "emoji"],
      ['"😮"', "emoji"],
      ["Adorei o concerto", "emoji"]
    ])
  );
  assert.ok(r.json.permitidos.every((p) => /dado/.test(p.motivo)));
  assert.equal(r.json.resumo.permitidos, 6, "também numa lista partida em várias linhas");
  assert.match(correr([f]).out, /^Permitidos sem escape/m);
});

test("gradiente de marca: bloqueia sem declaração; com .agentic/ui.json só o token declarado passa (e lista-se)", () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "slop-marca-")));
  try {
    writeFileSync(path.join(dir, "tokens.css"), ":root {\n  --grad-marca: linear-gradient(135deg, #6d28d9, #2563eb);\n  --grad-outro: linear-gradient(135deg, #7c3aed, #4f46e5);\n}\n");
    writeFileSync(path.join(dir, "hero.module.css"), ".hero {\n  background-image: linear-gradient(to bottom, transparent, var(--superficie)), var(--grad-marca);\n}\n.hero-b {\n  background: linear-gradient(90deg, var(--marca-1), var(--marca-2));\n}\n");
    writeFileSync(path.join(dir, "tailwind.config.js"), 'export default {\n  theme: { extend: { backgroundImage: { "grad-marca": "linear-gradient(135deg, #6d28d9, #2563eb)" } } }\n};\n');
    writeFileSync(path.join(dir, "Hero.tsx"), 'export const Hero = () => <section className="bg-grad-marca">Agenda de hoje</section>;\nexport const Outro = () => <section className="bg-gradient-to-r from-violet-600 to-indigo-600">Agenda</section>;\n');
    const ver = () => correr(["--json", "."], dir).json;
    const regras = (lista) => lista.map((a) => `${a.ficheiro}:${a.linha} ${a.regra}`).sort();

    const antes = ver();
    assert.deepEqual(regras(antes.achados.filter((a) => a.severidade === "bloqueio")), [
      "Hero.tsx:2 gradiente-roxo",
      "hero.module.css:2 gradiente-de-fundo",
      "hero.module.css:5 gradiente-de-fundo",
      "tailwind.config.js:2 gradiente-roxo",
      "tokens.css:2 gradiente-roxo",
      "tokens.css:3 gradiente-roxo"
    ]);

    mkdirSync(path.join(dir, ".agentic"));
    writeFileSync(path.join(dir, ".agentic", "ui.json"), JSON.stringify({ gradientes_marca: ["--grad-marca"] }));
    const depois = ver();
    assert.deepEqual(
      regras(depois.achados.filter((a) => a.severidade === "bloqueio")),
      ["Hero.tsx:2 gradiente-roxo", "hero.module.css:5 gradiente-de-fundo", "tokens.css:3 gradiente-roxo"],
      "o token não declarado, o gradiente escrito à mão no hero e as classes Tailwind continuam a bloquear"
    );
    assert.deepEqual(regras(depois.permitidos), ["hero.module.css:2 gradiente-de-fundo", "tailwind.config.js:2 gradiente-roxo", "tokens.css:2 gradiente-roxo"]);
    assert.ok(depois.permitidos.every((p) => p.motivo.includes("--grad-marca") && p.motivo.includes(path.join(".agentic", "ui.json"))));

    writeFileSync(path.join(dir, ".agentic", "ui.json"), '{ "gradientes_marca": "--grad-marca" }');
    const invalido = correr(["--json", "."], dir);
    assert.equal(invalido.codigo, 2, "declaração inválida: falha fechada");
    assert.match(invalido.err, /ui\.json/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("os escapes usados aparecem na saída legível, com o motivo e o que calam", () => {
  const r = correr(["fixtures/escape-valido.tsx"]);
  assert.equal(r.codigo, 0);
  assert.match(r.out, /^Escapes usados/m);
  assert.match(r.out, /escape-valido\.tsx:3-4 {2}«aviso de perda de dados/);
  assert.match(r.out, /2 escape\(s\) usado\(s\)/);
});

test("caminho explícito que não se lê, ou pasta sem nada analisável, sai 2 (nunca «0 ficheiros, limpo»)", () => {
  const md = correr(["--json", "fixtures/pasta-com-testes/notas.md"]);
  assert.equal(md.codigo, 2);
  assert.equal(JSON.parse(md.out).resumo.naoAnalisados, 1);
  const dir = mkdtempSync(path.join(tmpdir(), "slop-vazia-"));
  try {
    writeFileSync(path.join(dir, "notas.md"), "✨\n");
    const r = correr([dir]);
    assert.equal(r.codigo, 2);
    assert.match(r.out, /Nada analisado: isto não é prova de limpo/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// --diff: linhas alteradas, ficheiros novos, pré-existentes, repo dentro de test/
// -----------------------------------------------------------------------------

function repoTemporario(sub = "") {
  const topo = realpathSync(mkdtempSync(path.join(tmpdir(), "slop-linhas-")));
  const repo = path.join(topo, sub);
  mkdirSync(path.join(repo, "src"), { recursive: true });
  const git = (...a) => execFileSync("git", a, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "teste@exemplo.invalid");
  git("config", "user.name", "Teste");
  return { topo, repo, git };
}

test("--diff conta só as linhas alteradas; o bloqueio antigo do mesmo ficheiro é pré-existente e não bloqueia", () => {
  const { topo, repo, git } = repoTemporario();
  try {
    writeFileSync(path.join(repo, "src", "agenda.tsx"), "export const A = () => (\n  <div>\n    <h2>✨ Agenda</h2>\n    <p>Hoje</p>\n  </div>\n);\n");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    writeFileSync(path.join(repo, "src", "agenda.tsx"), "export const A = () => (\n  <div>\n    <h2>✨ Agenda</h2>\n    <p>Hoje e amanhã</p>\n  </div>\n);\n");
    const limpo = correr(["--json", "--diff", "HEAD"], repo);
    assert.equal(limpo.codigo, 0, "só a linha 4 mudou e está limpa");
    assert.deepEqual(limpo.json.preexistentes.map((a) => `${a.linha} ${a.regra}`), ["3 emoji"]);
    assert.match(correr(["--diff", "HEAD"], repo).out, /^Pré-existentes/m);

    writeFileSync(path.join(repo, "src", "agenda.tsx"), "export const A = () => (\n  <div>\n    <h2>✨ Agenda</h2>\n    <p>Hoje 🚀</p>\n  </div>\n);\n");
    const sujo = correr(["--json", "--diff", "HEAD"], repo);
    assert.equal(sujo.codigo, 1);
    assert.deepEqual(sujo.json.achados.map((a) => `${a.linha} ${a.regra}`), ["4 emoji"]);
  } finally {
    rmSync(topo, { recursive: true, force: true });
  }
});

test("--diff: ficheiro novo não seguido conta inteiro, mesmo num repo dentro de uma pasta test/", () => {
  const { topo, repo, git } = repoTemporario("test/app");
  try {
    writeFileSync(path.join(repo, "src", "base.tsx"), "export const B = () => <p>ok</p>;\n");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    writeFileSync(path.join(repo, "src", "Novo.tsx"), "export const N = () => (\n  <h1>Bem-vindo de volta! 🚀</h1>\n);\n");
    const r = correr(["--json", "--diff", "HEAD"], repo);
    assert.equal(r.codigo, 1);
    assert.deepEqual(r.json.achados.map((a) => `${a.ficheiro}:${a.linha} ${a.regra}`).sort(), ["src/Novo.tsx:2 emoji", "src/Novo.tsx:2 microcopia-marketing"]);
    assert.equal(correr(["--json", repo]).json.resumo.ficheiros, 2, "por caminho, também: o «test/» de fora não conta");
  } finally {
    rmSync(topo, { recursive: true, force: true });
  }
});

test("--diff: tradução alterada analisa-se; marcação numa extensão que não se lê sai 2 e lista-se", () => {
  const { topo, repo, git } = repoTemporario();
  try {
    mkdirSync(path.join(repo, "src", "i18n"));
    writeFileSync(path.join(repo, "src", "i18n", "pt.json"), '{\n  "ok": "Guardar"\n}\n');
    writeFileSync(path.join(repo, "src", "email.py"), 'CORPO = "ok"\n');
    git("add", ".");
    git("commit", "-q", "-m", "base");
    writeFileSync(path.join(repo, "src", "i18n", "pt.json"), '{\n  "ok": "Desbloqueie todo o potencial ✨"\n}\n');
    const traducao = correr(["--json", "--diff", "HEAD"], repo);
    assert.equal(traducao.codigo, 1);
    assert.deepEqual(traducao.json.achados.map((a) => a.regra).sort(), ["emoji", "microcopia-marketing"]);

    git("checkout", "-q", "--", "src/i18n/pt.json");
    writeFileSync(path.join(repo, "src", "email.py"), 'CORPO = """<p style="font-size: 9px">Olá</p>"""\n');
    const py = correr(["--json", "--diff", "HEAD"], repo);
    assert.equal(py.codigo, 2, "0 ficheiros lidos e um com marcação por ler: nunca limpo");
    assert.deepEqual(JSON.parse(py.out).naoAnalisados.map((n) => n.ficheiro), ["src/email.py"]);
  } finally {
    rmSync(topo, { recursive: true, force: true });
  }
});

test("chamado por uma ligação simbólica com outro nome (a instalação --ligar) dá o mesmo resultado que pelo caminho real", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "slop-ligacao-"));
  // A ligação sai primeiro: o rmSync recursivo nunca chega ao repo para onde aponta.
  const ligacao = path.join(dir, "slop.mjs");
  try {
    symlinkSync(SCRIPT, ligacao, "file");
    const f = path.join(AQUI, "fixtures", "bloqueios.tsx");
    const real = spawnSync(process.execPath, [SCRIPT, "--json", f], { encoding: "utf8" });
    const pela = spawnSync(process.execPath, [ligacao, "--json", f], { encoding: "utf8" });
    assert.equal(real.status, 1);
    assert.equal(pela.status, 1, `pela ligação saiu ${pela.status} com ${JSON.stringify(pela.stdout + pela.stderr)}`);
    assert.equal(pela.stdout, real.stdout);
  } finally {
    rmSync(ligacao, { force: true });
    rmSync(dir, { recursive: true, force: true });
  }
});
