#!/usr/bin/env node
// validar-relatorio.mjs: confere um relatório de revisão da agentic-code-review antes de ir ao
// autor ou ao humano. Só lê; não sabe se os achados são verdadeiros, só se têm a forma que a
// skill exige (contagem na 1.ª linha, ficheiro:linha, Nits limitados, Pré-existentes numa linha).
//
// Uso: node validar-relatorio.mjs [--json] <relatorio.md | ->
//   -        lê da entrada padrão
//   --json   resultado em JSON ({ ok, problemas: [{ linha, msg }], cabecalho })
// Saída: 0 = relatório conforme; 1 = não conforme (lista do que falha); 2 = uso (sem ficheiro,
// ficheiro ilegível).
//
// Formato (assets/relatorio.template.md):
//   Revisão <sha> · <via> · [lente <lente> · ]ronda <n>/<limite> · <i> Importantes · <n> Nits · <p> Pré-existentes
//   0 Importantes — nada a corrigir                     (só e sempre quando i = 0, logo a seguir)
//   [Importante] <ficheiro:linha> — <efeito> — reproduz: <como> — classe: <classe>
//   [Nit] <ficheiro:linha> — <o quê>                    (no máximo 3, depois dos Importantes)
//   Pré-existentes: <ficheiro:linha · classe; …> | nenhum   (uma só linha)

import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NADA = "0 Importantes — nada a corrigir";
const MAX_NITS = 3;
// Limite de rondas dos níveis desta skill; os níveis de um REVIEW.md com outros nomes não se conferem.
const LIMITE_DO_NIVEL = [[/^Rápida\b/, 1], [/^Padrão\b/, 2], [/^Completa\b/, 3]];
// Uma etiqueta que não começa a linha («- [Importante]», «1. [Nit]», «**[Importante]**») não se
// conta e esconderia um achado: recusa-se.
const ETIQUETA_SOLTA = /\[(Importante|Nit|Pré-existentes?)\]/;

const CABECALHO =
  /^Revisão ([0-9a-f]{7,40}) · ([^·]+?) · (?:lentes? ([^·]+?) · )?ronda (\d+)\/(\d+) · (\d+) Importantes? · (\d+) Nits? · (\d+) Pré-existentes?$/;

// ficheiro:linha (também ficheiro:início-fim e ficheiro:linha:coluna). O caminho tem «/» ou «.»,
// ou é um destes nomes sem extensão; assim «localhost:3000», horas e «https://…» não contam.
const SEM_EXTENSAO = /^(Makefile|Dockerfile|Containerfile|Justfile|Gemfile|Procfile|Rakefile|Brewfile|Caddyfile|Jenkinsfile|Vagrantfile)$/;
const FICHEIRO_LINHA = /(?<![\w/.@~+-])(\/?(?:[\w.@~+-]+\/)*[\w.@~+-]+):(\d+)(?:-\d+|:\d+)?(?![\w:])/g;
const DOC = /\.(md|mdx|markdown|txt|rst|adoc)$/i;

const fichLinhas = (texto) =>
  [...texto.matchAll(FICHEIRO_LINHA)]
    .filter((m) => /[/.]/.test(m[1]) || SEM_EXTENSAO.test(m[1]))
    .map((m) => `${m[1]}:${m[2]}`);

export function validarRelatorio(texto) {
  const linhas = texto.replace(/\r\n/g, "\n").split("\n");
  const problemas = [];
  const falha = (n, msg) => problemas.push({ linha: n, msg });

  const cheias = linhas.map((l, i) => ({ n: i + 1, t: l.trim() })).filter((l) => l.t !== "");
  if (cheias.length === 0) {
    falha(1, "relatório vazio");
    return { ok: false, problemas, cabecalho: null };
  }

  // 1.ª linha
  const primeira = cheias[0];
  const m = CABECALHO.exec(primeira.t);
  let cabecalho = null;
  if (!m) {
    falha(
      primeira.n,
      "a 1.ª linha não segue «Revisão <sha> · <via> · [lente <lente> · ]ronda <n>/<limite> · <i> Importantes · <n> Nits · <p> Pré-existentes» (SHA com 7 a 40 caracteres hexadecimais)",
    );
  } else {
    const [, sha, via, lente, ronda, limite, i, n, p] = m;
    cabecalho = {
      sha,
      via: via.trim(),
      lente: lente?.trim() ?? null,
      ronda: Number(ronda),
      limite: Number(limite),
      importantes: Number(i),
      nits: Number(n),
      preexistentes: Number(p),
    };
    if (/[<>{}]/.test(cabecalho.via)) falha(primeira.n, `via por preencher: «${cabecalho.via}»`);
    if (cabecalho.lente && /[<>{}]/.test(cabecalho.lente)) falha(primeira.n, `lente por preencher: «${cabecalho.lente}»`);
    if (cabecalho.ronda < 1 || cabecalho.limite < 1) falha(primeira.n, "ronda e limite começam em 1");
    else if (cabecalho.ronda > cabecalho.limite)
      falha(primeira.n, `ronda ${cabecalho.ronda} acima do limite ${cabecalho.limite}: no limite pára e vai ao humano`);
    const nivel = LIMITE_DO_NIVEL.find(([re]) => re.test(cabecalho.via));
    if (nivel && cabecalho.limite > nivel[1])
      falha(primeira.n, `limite ${cabecalho.limite} acima do do nível «${cabecalho.via}» (${nivel[1]})`);
  }

  // Corpo
  const importantes = [];
  const nits = [];
  const pre = [];
  let viuNit = false;
  let nada = null;
  for (const { n, t } of cheias.slice(1)) {
    if (t === NADA) {
      nada = n;
      continue;
    }
    if (/^Pré-existentes?:/.test(t)) {
      pre.push({ n, t });
      continue;
    }
    const tag = /^\[([^\]]+)\]\s*(.*)$/.exec(t);
    if (!tag) {
      if (ETIQUETA_SOLTA.test(t)) falha(n, "etiqueta fora do início da linha: um achado começa por «[Importante]» ou «[Nit]», sem marcador nem negrito");
      continue;
    }
    const [, etiqueta, resto] = tag;
    if (etiqueta === "Importante") {
      if (viuNit) falha(n, "Importante depois de um Nit: os achados vão por gravidade");
      importantes.push(n);
      validarImportante(n, resto, falha);
    } else if (etiqueta === "Nit") {
      viuNit = true;
      nits.push(n);
      if (fichLinhas(resto.split(" — ")[0]).length === 0) falha(n, "Nit sem ficheiro:linha logo a seguir à etiqueta");
    } else if (/^Pré-existente/.test(etiqueta)) {
      falha(n, "os Pré-existentes vão todos numa linha «Pré-existentes: …», não como achados");
    } else {
      falha(n, `etiqueta desconhecida «${etiqueta}»: só [Importante] e [Nit] (os Pré-existentes vão numa linha)`);
    }
  }

  if (nits.length > MAX_NITS) falha(nits[MAX_NITS], `${nits.length} Nits: no máximo ${MAX_NITS} por relatório (a consolidação corta-os)`);

  // «nada a corrigir»
  if (importantes.length === 0 && (!cabecalho || cabecalho.importantes === 0)) {
    if (nada === null) falha(primeira.n, `sem Importantes, a linha a seguir à 1.ª é «${NADA}»`);
    else if (cheias[1]?.n !== nada) falha(nada, `«${NADA}» vem logo a seguir à 1.ª linha`);
  } else if (nada !== null) {
    falha(nada, `«${NADA}» num relatório onde há ${importantes.length} Importantes`);
  }

  // Pré-existentes
  let nPre = 0;
  if (pre.length === 0) falha(primeira.n, "falta a linha «Pré-existentes: …» (ou «Pré-existentes: nenhum»)");
  else if (pre.length > 1) falha(pre[1].n, "mais de uma linha «Pré-existentes:»: vão todos numa só");
  if (pre.length >= 1) {
    const valor = pre[0].t.replace(/^Pré-existentes?:/, "").trim();
    if (valor === "") falha(pre[0].n, "linha «Pré-existentes:» vazia: escreve «nenhum»");
    else if (!/^nenhum\.?$/i.test(valor)) {
      const itens = valor.split(";").map((s) => s.trim()).filter(Boolean);
      nPre = itens.length;
      for (const it of itens) {
        if (fichLinhas(it).length === 0) falha(pre[0].n, `Pré-existente sem ficheiro:linha: «${it}»`);
        else if (!/ · \S/.test(it)) falha(pre[0].n, `Pré-existente sem classe («ficheiro:linha · classe»): «${it}»`);
      }
    }
  }

  // Contagens
  if (cabecalho) {
    const conta = (nome, diz, ha) => {
      if (diz !== ha) falha(primeira.n, `${nome}: a 1.ª linha diz ${diz}, há ${ha}`);
    };
    conta("Importantes", cabecalho.importantes, importantes.length);
    conta("Nits", cabecalho.nits, nits.length);
    conta("Pré-existentes", cabecalho.preexistentes, nPre);
  }

  return { ok: problemas.length === 0, problemas, cabecalho };
}

function validarImportante(n, resto, falha) {
  const local = resto.split(" — ")[0];
  const fl = fichLinhas(local);
  if (fl.length === 0) {
    falha(n, "Importante sem ficheiro:linha logo a seguir à etiqueta (um palpite pelo nome não é prova)");
    return;
  }
  const reproduz = / — reproduz: (.*?)(?= — classe:|$)/.exec(resto);
  if (!reproduz || reproduz[1].trim() === "") falha(n, "Importante sem «reproduz: <teste, comando ou captura>»");
  const classe = / — classe: (.+)$/.exec(resto);
  if (!classe || classe[1].trim() === "") falha(n, "Importante sem «classe: <classe>»");
  const prova = reproduz?.[1] ?? "";
  const ficheiro = fl[0].replace(/:\d+$/, "");
  if (DOC.test(ficheiro)) {
    const outras = fichLinhas(resto).filter((x) => x !== fl[0]);
    if (outras.length === 0 && !/ausente: \S+/.test(prova))
      falha(n, "Importante num doc: falta a linha que o desmente (outro ficheiro:linha, ou «ausente: <caminho>»)");
  }
  // Só a dependência fora da pesquisa aprovada pede a ausência na pesquisa; uma dependência
  // vulnerável (lente de segurança) prova-se como qualquer código.
  if (classe && /fora da pesquisa/i.test(classe[1]) && !/ausente em [^\s—]*[/.][^\s—]*/.test(prova))
    falha(n, "Importante de dependência fora da pesquisa: falta «ausente em <ficheiro da pesquisa aprovada>» na prova, além da linha do manifesto");
}

function principal(args) {
  const json = args.includes("--json");
  const resto = args.filter((a) => a !== "--json");
  if (resto.length !== 1 || resto[0] === "-h" || resto[0] === "--help") {
    process.stderr.write("uso: node validar-relatorio.mjs [--json] <relatorio.md | ->\n");
    return 2;
  }
  let texto;
  try {
    texto = resto[0] === "-" ? readFileSync(0, "utf8") : readFileSync(resto[0], "utf8");
  } catch (e) {
    process.stderr.write(`validar-relatorio: não consigo ler ${resto[0]}: ${e.code ?? e.message}\n`);
    return 2;
  }
  const r = validarRelatorio(texto);
  if (json) process.stdout.write(JSON.stringify(r, null, 2) + "\n");
  else if (r.ok) {
    const c = r.cabecalho;
    process.stdout.write(
      `ok: Revisão ${c.sha} · ${c.via} · ronda ${c.ronda}/${c.limite} · ${c.importantes} Importantes · ${c.nits} Nits · ${c.preexistentes} Pré-existentes\n`,
    );
  } else {
    process.stdout.write(`falha: ${r.problemas.length} problema(s)\n`);
    for (const p of r.problemas) process.stdout.write(`- linha ${p.linha}: ${p.msg}\n`);
  }
  return r.ok ? 0 : 1;
}

// O Node resolve a ligação simbólica do módulo principal (a instalação --ligar): compara-se o caminho real
// dos dois, ou o «main» nunca corria e o validador saía 0 mudo com qualquer ficheiro.
const real = (p) => {
  try {
    return realpathSync(p);
  } catch {
    return path.resolve(p);
  }
};

if (process.argv[1] && real(process.argv[1]) === real(fileURLToPath(import.meta.url))) {
  process.exitCode = principal(process.argv.slice(2));
}
