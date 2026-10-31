// Valida o frontmatter e as referências de cada SKILL.md (node --test, a partir da raiz
// do repo). O `claude plugin validate .` só olha para os manifestos: um SKILL.md com o
// frontmatter partido passa lá e falha aqui.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = path.join(RAIZ, "skills");

// Lê o frontmatter simples que estas skills usam: «chave: valor» numa linha, ou «chave: >-»
// seguido de linhas indentadas (texto dobrado). Devolve { campos, erro }.
export function lerFrontmatter(texto) {
  const linhas = texto.split("\n");
  if (linhas[0] !== "---") return { erro: "não começa com ---" };
  const fim = linhas.indexOf("---", 1);
  if (fim < 0) return { erro: "frontmatter sem --- de fecho" };
  const campos = {};
  let atual = null;
  for (const l of linhas.slice(1, fim)) {
    const m = /^([A-Za-z][\w-]*):(?: (.*))?$/.exec(l);
    if (m) {
      const valor = (m[2] ?? "").trim();
      if (valor === ">-" || valor === ">" || valor === "|") {
        atual = m[1];
        campos[atual] = "";
      } else {
        if (/^[[{]/.test(valor) && !/[\]}]$/.test(valor)) return { erro: `${m[1]}: valor YAML por fechar` };
        if (/^["']/.test(valor) && valor.at(-1) !== valor[0]) return { erro: `${m[1]}: aspas por fechar` };
        campos[m[1]] = valor;
        atual = null;
      }
    } else if (atual && /^\s+\S/.test(l)) {
      campos[atual] += (campos[atual] ? " " : "") + l.trim();
    } else if (l.trim() !== "") {
      return { erro: `linha inesperada no frontmatter: ${l}` };
    }
  }
  return { campos };
}

const pastas = readdirSync(SKILLS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

test("há as dez skills, cada uma com SKILL.md", () => {
  assert.deepEqual(pastas.sort(), [
    "agentic-analysis-optimization",
    "agentic-architecture",
    "agentic-ci-audit",
    "agentic-code-review",
    "agentic-design",
    "agentic-feature",
    "agentic-fix",
    "agentic-implement",
    "agentic-project",
    "agentic-tool-design",
  ]);
  for (const p of pastas) assert.ok(existsSync(path.join(SKILLS, p, "SKILL.md")), `${p} sem SKILL.md`);
});

// Todos os .md de uma skill (SKILL.md, references/, assets/), para as citações entre ficheiros.
function mdsDe(pasta) {
  const fora = [];
  const anda = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) anda(p);
      else if (e.name.endsWith(".md")) fora.push(p);
    }
  };
  anda(path.join(SKILLS, pasta));
  return fora;
}

// Citações `references/x.md`, `assets/y.md` e `<agentic-…>/references|assets/…md` (outra skill).
const CITACAO = /(?:<(agentic-[a-z-]+)>\/)?(references|assets)\/([\w./-]+\.md)/g;
function citacoesEmFalta(texto, dona) {
  const em_falta = [];
  for (const m of texto.matchAll(CITACAO)) {
    const quem = m[1] ?? dona;
    if (!existsSync(path.join(SKILLS, quem, m[2], m[3]))) em_falta.push(`${quem}/${m[2]}/${m[3]}`);
  }
  return em_falta;
}

// Um marcador `<agentic-…>` só se preenche se o SKILL.md da skill que o usa disser onde procurar
// essa irmã, a começar pela variável `$AGENTIC_…_DIR`.
export function irmasSemRegra(textos, skillMd, dona) {
  const usadas = new Set();
  for (const t of textos) for (const m of t.matchAll(/<(agentic-[a-z-]+)>/g)) if (m[1] !== dona) usadas.add(m[1]);
  const variavel = (n) => `$AGENTIC_${n.slice("agentic-".length).toUpperCase().replaceAll("-", "_")}_DIR`;
  const paragrafos = skillMd.split(/\n\s*\n/);
  return [...usadas].sort().filter((n) => !paragrafos.some((p) => p.includes(variavel(n)) && p.includes(`<${n}>`)));
}

for (const p of pastas) {
  const texto = readFileSync(path.join(SKILLS, p, "SKILL.md"), "utf8");

  test(`${p}: frontmatter só com name e description, válidos para a especificação`, () => {
    const { campos, erro } = lerFrontmatter(texto);
    assert.equal(erro, undefined, erro);
    assert.deepEqual(Object.keys(campos).sort(), ["description", "name"]);
    assert.equal(campos.name, p, "name diferente do nome da pasta");
    assert.match(campos.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(campos.name.length <= 64);
    assert.ok(campos.description.length > 0 && campos.description.length <= 1024, `description com ${campos.description.length} caracteres`);
    assert.doesNotMatch(campos.description, /[<>]/, "description com < ou >");
  });

  test(`${p}: cada references/… e assets/….md citado nos .md da skill existe`, () => {
    const em_falta = [];
    for (const f of mdsDe(p)) {
      for (const c of citacoesEmFalta(readFileSync(f, "utf8"), p)) em_falta.push(`${path.relative(SKILLS, f)} → ${c}`);
    }
    assert.deepEqual(em_falta, []);
  });

  test(`${p}: cada irmã <agentic-…> que os .md da skill usam tem no SKILL.md um parágrafo com o marcador e a $AGENTIC_…_DIR`, () => {
    assert.deepEqual(irmasSemRegra(mdsDe(p).map((f) => readFileSync(f, "utf8")), texto, p), []);
  });

  test(`${p}: SKILL.md com 500 linhas ou menos (recomendação da especificação)`, () => {
    const n = texto.split("\n").length - (texto.endsWith("\n") ? 1 : 0);
    assert.ok(n <= 500, `SKILL.md com ${n} linhas`);
  });
}

test("as citações de outra skill resolvem para a pasta dela (controlo)", () => {
  assert.deepEqual(citacoesEmFalta("`<agentic-code-review>/assets/brief-revisor.template.md`", "agentic-feature"), []);
  assert.deepEqual(citacoesEmFalta("`assets/brief-revisor.template.md`", "agentic-feature"), ["agentic-feature/assets/brief-revisor.template.md"]);
});

test("irmasSemRegra aponta a irmã sem regra e aceita a regra completa ou a própria skill (controlo)", () => {
  const brief = "`<agentic-implement>/references/gostos.md` e `<agentic-code-review>/assets/x.md`";
  const regra = "A irmã `<agentic-implement>` é a primeira pasta entre `$AGENTIC_IMPLEMENT_DIR` e a pasta ao lado.";
  assert.deepEqual(irmasSemRegra([brief], "`$AGENTIC_DESIGN_DIR`", "agentic-code-review"), ["agentic-implement"]);
  // A variável escrita longe do marcador não é regra.
  assert.deepEqual(irmasSemRegra([brief], "Nunca uses `$AGENTIC_IMPLEMENT_DIR`.\n\nUsa `<agentic-implement>`.", "agentic-code-review"), ["agentic-implement"]);
  assert.deepEqual(irmasSemRegra([brief], regra, "agentic-code-review"), []);
});

test("os modelos da revisão vivem só na agentic-code-review (sem cópias que divergem)", () => {
  assert.ok(!existsSync(path.join(SKILLS, "agentic-feature", "assets", "brief-revisor.template.md")));
  assert.ok(!existsSync(path.join(SKILLS, "agentic-project", "assets", "REVIEW.template.md")));
  for (const f of ["brief-revisor.template.md", "REVIEW.template.md"])
    assert.ok(existsSync(path.join(SKILLS, "agentic-code-review", "assets", f)), `falta ${f}`);
});

// Espelhos que se leem um ao outro: o formato e o sítio da linha de lição vivem no aprendizagem.md
// da agentic-code-review (a agentic-feature e a agentic-fix apontam para lá), o formato é criado no
// cabeçalho de docs/licoes.md pela agentic-project e lido como caso de avaliação pela agentic-code-review; os
// modelos têm orçamento em bytes.
const LINHA_LICAO = /`- <aaaa-mm-dd> · <área> · tipo: [^`\n]+`/g;

test("a linha de docs/licoes.md tem o mesmo formato, com tipo, nas skills que a escrevem", () => {
  const formato = (...partes) => readFileSync(path.join(SKILLS, ...partes), "utf8").match(LINHA_LICAO) ?? [];
  const passo7 = readFileSync(path.join(SKILLS, "agentic-feature", "SKILL.md"), "utf8").split("## Passo 7")[1];
  assert.match(passo7, /a linha de lição no sítio e no formato de\s+`<agentic-code-review>\/references\/aprendizagem\.md`/);
  for (const f of mdsDe("agentic-feature")) assert.deepEqual(readFileSync(f, "utf8").match(LINHA_LICAO), null, `${path.relative(SKILLS, f)} copia o formato`);
  const sitios = {
    "agentic-project/SKILL.md": formato("agentic-project", "SKILL.md"),
    "aprendizagem.md": formato("agentic-code-review", "references", "aprendizagem.md"),
    "caso-de-avaliacao.template.md": formato("agentic-code-review", "assets", "caso-de-avaliacao.template.md"),
  };
  for (const [nome, achados] of Object.entries(sitios)) {
    assert.equal(achados.length, 1, `${nome} sem o formato (ou com mais de um)`);
    assert.match(achados[0], /tipo: <escapou\|repetido>/, `${nome} sem os dois tipos`);
  }
  const [primeiro, ...resto] = Object.values(sitios).map((a) => a[0]);
  for (const outro of resto) assert.equal(outro, primeiro);
});

// As regras da revisão (rondas, rebase, verificador, consolidação) vivem só na agentic-code-review:
// as outras duas apontam para ela. Uma cópia colada de volta diverge na mudança seguinte.
const SO_DA_REVISAO = /range-diff|veredicto|deduplic/i;
export function copiasDaRevisao(ficheiros) {
  const fora = [];
  for (const f of ficheiros) {
    readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      if (SO_DA_REVISAO.test(l)) fora.push(`${path.relative(SKILLS, f)}:${i + 1}`);
    });
  }
  return fora;
}

test("a agentic-feature e a agentic-project não repetem as regras da revisão", () => {
  assert.deepEqual(copiasDaRevisao([...mdsDe("agentic-feature"), ...mdsDe("agentic-project")]), []);
  assert.ok(copiasDaRevisao(mdsDe("agentic-code-review")).length > 0, "marcas ausentes da própria revisão (controlo)");
});

test("a agentic-feature chama a agentic-code-review no passo 6, e o projeto aponta para ela", () => {
  const ler = (...partes) => readFileSync(path.join(SKILLS, ...partes), "utf8");
  const feature = ler("agentic-feature", "SKILL.md");
  const passo6 = feature.slice(feature.indexOf("## Passo 6"), feature.indexOf("## Passo 7"));
  assert.match(passo6, /skill irmã `agentic-code-review`/);
  assert.match(passo6, /<agentic-code-review>\/SKILL\.md/);
  assert.match(ler("agentic-feature", "references", "revisao-e-entrega.md"), /<agentic-code-review>\/references\/painel-e-rondas\.md/);
  assert.match(ler("agentic-project", "references", "mapa-de-skills.md"), /^\| Rever código.*`agentic-code-review`/m);
  assert.match(ler("agentic-project", "assets", "AGENTS.template.md"), /`agentic-code-review` \(lê `REVIEW\.md`\)/);
});

// O método de UI vive só na agentic-design: a agentic-feature chama-a
// nos passos 2, 3, 5 e 6 e não repete as regras (bloqueios, escapes em bloco, lista B1–B2x).
const SO_DO_DESIGN = /Reconhece-se|slop-ok-bloco|\bB1–B2\d\b/;
export function copiasDoDesign(ficheiros) {
  const fora = [];
  for (const f of ficheiros) {
    readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      if (SO_DO_DESIGN.test(l)) fora.push(`${path.relative(SKILLS, f)}:${i + 1}`);
    });
  }
  return fora;
}

test("a agentic-feature chama a agentic-design nos passos 2, 3, 5 e 6 e não repete as regras de UI", () => {
  const ler = (...partes) => readFileSync(path.join(SKILLS, ...partes), "utf8");
  const feature = ler("agentic-feature", "SKILL.md");
  const passo = (n) => feature.slice(feature.indexOf(`## Passo ${n}`), feature.indexOf(`## Passo ${n + 1}`));
  assert.match(passo(2), /<agentic-design>\/references\/perguntas-de-ui\.md/);
  assert.match(passo(3), /skill irmã `agentic-design`, no modo «variantes»/);
  assert.match(passo(3), /<agentic-design>\/SKILL\.md/);
  assert.match(passo(5), /`agentic-design`, no modo «construir»/);
  assert.match(passo(6), /modo «rever» dela/);
  assert.match(ler("agentic-feature", "assets", "brief-agente.template.md"), /node <agentic-design>\/scripts\/detetar-slop\.mjs --diff/);
  assert.ok(!existsSync(path.join(SKILLS, "agentic-feature", "scripts")), "o detetor vive só na agentic-design");
  assert.deepEqual(copiasDoDesign(mdsDe("agentic-feature")), []);
  assert.ok(copiasDoDesign(mdsDe("agentic-design")).length > 0, "marcas ausentes da própria agentic-design (controlo)");
});

// O circuito da agentic-feature: o humano para no grill e nas
// variantes de UI e só dá o «avança» na via Completa; na Padrão a spec chega-lhe como aviso.
const ler = (...partes) => readFileSync(path.join(SKILLS, ...partes), "utf8");
const linhas = (texto) => texto.split("\n").length - (texto.endsWith("\n") ? 1 : 0);
// Os SKILL.md com cartão gerado (tools/cartoes.mjs). No repo de trabalho a lista é a do tools/cartoes.json;
// a árvore pública não leva o gerador e usa a lista fixa, que um teste confere com o json.
const CARTAO_FIXO = ["agentic-feature/SKILL.md", "agentic-fix/SKILL.md"];
const CARTOES_JSON = path.join(RAIZ, "tools", "cartoes.json");
const DECLARADOS_NO_JSON = existsSync(CARTOES_JSON)
  ? Object.values(JSON.parse(readFileSync(CARTOES_JSON, "utf8")).cartoes).map((c) => c.ficheiro.replace(/^skills\//, "")).sort()
  : null;
const COM_CARTAO = DECLARADOS_NO_JSON ?? CARTAO_FIXO;
const temCartao = (f) => COM_CARTAO.includes(path.relative(SKILLS, f).split(path.sep).join("/"));
// As linhas de um texto fora do cartão gerado, com o seu número: de `<!-- cartao:inicio` a
// `<!-- cartao:fim -->`, mais a linha vazia que o separa do resto. O cartão copia regras que vivem
// noutra fonte, por isso as guardas «esta regra só vive na fonte» e o teto de linhas olham só para o que
// se escreve à mão. A isenção é só do primeiro cartão (`comCartao`, de um SKILL.md declarado): em
// qualquer outro sítio o bloco conta como texto. Um cartão sem fim é erro: não deixa um buraco nas guardas.
export function linhasForaDoCartao(texto, comCartao = false) {
  const fora = [];
  let estado = comCartao ? "antes" : "sem";
  let separador = false;
  texto.split("\n").forEach((l, i) => {
    if (estado === "dentro") { if (l.trim() === "<!-- cartao:fim -->") { estado = "depois"; separador = true; } return; }
    if (estado === "antes" && l.startsWith("<!-- cartao:inicio")) { estado = "dentro"; return; }
    if (separador && l.trim() === "") { separador = false; return; }
    separador = false;
    fora.push([l, i + 1]);
  });
  assert.ok(estado !== "dentro", "cartão sem `<!-- cartao:fim -->`");
  return fora;
}
const passoDaFeature = (n) => {
  const feature = ler("agentic-feature", "SKILL.md");
  return feature.slice(feature.indexOf(`## Passo ${n}`), feature.indexOf(n === 7 ? "\n## " : `## Passo ${n + 1}`, feature.indexOf(`## Passo ${n}`) + 1));
};

test("agentic-feature: SKILL.md com 300 linhas ou menos, sem contar o cartão gerado", () => {
  const foraDoCartao = (texto) => linhasForaDoCartao(texto, true).length - (texto.endsWith("\n") ? 1 : 0);
  const n = foraDoCartao(ler("agentic-feature", "SKILL.md"));
  assert.ok(n <= 300, `SKILL.md com ${n} linhas fora do cartão`);
  assert.equal(foraDoCartao("a\n\n<!-- cartao:inicio -->\nx\n<!-- cartao:fim -->\n\nb\n"), 3, "o cartão e a linha vazia a seguir não contam");
  assert.throws(() => linhasForaDoCartao("a\n<!-- cartao:inicio -->\nx\n", true), /sem `<!-- cartao:fim -->`/);
});

test("agentic-feature: o humano para no grill e nas variantes; o «avança» só na Completa, a Padrão recebe um aviso", () => {
  const feature = ler("agentic-feature", "SKILL.md");
  const tabela = feature.split("\n").filter((l) => /^\| [0-7] \|/.test(l));
  assert.equal(tabela.length, 8, "a tabela tem os passos 0 a 7");
  assert.match(tabela[2], /momento 1/);
  assert.match(tabela[3], /momento 2/);
  assert.match(tabela[4], /Completa.*«avança».*Padrão.*aviso/);
  for (const i of [0, 1, 5, 6]) assert.doesNotMatch(tabela[i], /momento|«avança»/, `passo ${i} sem paragem`);
  const passo4 = passoDaFeature(4);
  assert.match(passo4, /\*\*Completa: gate\.\*\*/);
  assert.match(passo4, /\*\*Padrão: aviso\.\*\*[^]*caminho da spec[^]*parar/);
});

// O modelo, o esforço e a escolha entre Claude e Codex têm uma fonte só: o escolher-o-agente.md da
// agentic-implement. Uma tabela de modelos colada na agentic-feature diverge na mudança seguinte.
const TABELA_DE_MODELOS = /Sonnet|Opus|Haiku|gpt-\d|model_reasoning_effort|esforço (xhigh|max|medium)/i;
export function modelosFora(ficheiros) {
  const fora = [];
  for (const f of ficheiros) {
    for (const [l, n] of linhasForaDoCartao(readFileSync(f, "utf8"), temCartao(f))) {
      if (TABELA_DE_MODELOS.test(l)) fora.push(`${path.relative(SKILLS, f)}:${n}`);
    }
  }
  return fora;
}

test("agentic-feature: aponta para o escolher-o-agente.md (§1–§4) e não tem tabela de modelos própria", () => {
  const passo5 = passoDaFeature(5);
  assert.match(passo5, /<agentic-implement>\/references\/escolher-o-agente\.md` §1–§3/);
  assert.match(passo5, /§4 desse ficheiro[^]*subagente Claude[^]*job Codex[^]*lançador[^]*`codex exec`/);
  assert.deepEqual(modelosFora(mdsDe("agentic-feature")), []);
  assert.ok(modelosFora([path.join(SKILLS, "agentic-implement", "references", "escolher-o-agente.md")]).length > 0, "tabela ausente da própria fonte (controlo)");
});

test("agentic-feature: o brief do agente manda carregar a agentic-implement e não repete o processo dela", () => {
  const brief = ler("agentic-feature", "assets", "brief-agente.template.md");
  assert.match(brief, /Carrega a `agentic-implement` \(no Codex, `\$agentic-implement`\)/);
  assert.match(brief.replace(/^<!--[\s\S]*?-->\n*/, ""), /^<cabeçalho do lançador/, "o brief começa pelo cabeçalho do lançador, quando o há");
  for (const processo of [/estado: concluido/, /## Relatório final/, /git add/, /--no-verify/, /## Dúvidas de âmbito/])
    assert.doesNotMatch(brief, processo, `o brief repete o processo da agentic-implement (${processo})`);
});

// Quem escreve o código só faz push, deploy ou produção com a ordem do humano no brief, e nunca
// reescreve o histórico: a regra vive no passo 7 da agentic-implement, igual para um subagente
// Claude e um job Codex, e o brief traz a linha da ordem.
test("agentic-implement: o passo 7 só deixa push, deploy e produção com a ordem do humano, proíbe --no-verify e reescrever o histórico; o push do AGENTS.md modelo é de quem orquestra", () => {
  const passo7 = ler("agentic-implement", "SKILL.md").split("## 7. ")[1].split("\n## ")[0];
  assert.doesNotMatch(passo7, /[Nn]unca push\b/);
  assert.match(passo7, /[Pp]ush, deploy\s+ou acesso à produção, só quando a linha `ordem do humano:` do brief o pede, e só nessa tarefa/);
  assert.match(passo7, /mesma regra para um subagente Claude e para um job Codex/);
  // Num job cujo lançador regista a ordem e a junta ao prompt, há um canal só: o bloco do lançador
  // (a linha do brief e o bloco seriam dois canais para a mesma ordem).
  assert.match(passo7, /lançador do job regista a ordem\s+e a junta ao prompt[^]*vale a ordem\s+desse bloco, e só ela/);
  const brief = ler("agentic-feature", "assets", "brief-agente.template.md");
  assert.match(brief, /^ordem do humano: </m, "o brief não traz a linha da ordem");
  assert.match(brief, /O processo, os limites e a entrega\s+são os dela/, "os limites apontam para a agentic-implement");
  assert.doesNotMatch(brief, /Sem ordem, os commits ficam no ramo/, "a regra de autorização não se copia para o brief");
  // O brief da correção é gémeo do da feature: o mesmo canal para a ordem e o mesmo limite.
  const correcao = ler("agentic-fix", "assets", "brief-correcao.template.md");
  assert.match(correcao, /^ordem do humano: \{\{/m, "o brief da correção não traz a linha da ordem");
  assert.match(correcao, /Sem ordem, os commits ficam no\s+ramo e o push, o deploy e a produção são de quem orquestra/);
  assert.match(ler("agentic-fix", "SKILL.md"), /zona sensível \(sim ou não\), a ordem do humano/, "o passo 2 da agentic-fix não pede a ordem");
  assert.match(passo7, /[Nn]unca `--no-verify`/);
  assert.match(passo7, /nunca reescrever o histórico \([^)]*rebase[^)]*amend[^)]*force-push[^)]*\)/);
  assert.match(passo7, /quem orquestra[^.]*integra|integra[^.]*quem orquestra/);
  const push = ler("agentic-project", "assets", "AGENTS.template.md").split("\n").filter((l) => /\bpush\b/.test(l) && /no fim/.test(l));
  assert.equal(push.length, 1, "uma só linha diz quem faz o push no fim da sessão");
  assert.match(push[0], /quem orquestra/);
});

// A regra dos tempos limite e dos processos filhos é de quem escreve os testes: vive no testes.md da
// agentic-implement (o passo 3 aponta para lá) e a armadilha da agentic-feature, que é do
// orquestrador, remete para ela em vez de a repetir.
test("agentic-implement: o testes.md tem a regra dos tempos e dos processos filhos; a armadilha da agentic-feature aponta para lá", () => {
  const testes = ler("agentic-implement", "references", "testes.md");
  assert.match(testes, /tempo limite[^.]*pelo menos 2×/i);
  assert.match(testes, /processo filho[^.]*registad[^.]*antes de arrancar/i);
  assert.match(testes, /teardown/);
  assert.match(testes, /filho órfão pendura a suite/);
  assert.match(ler("agentic-implement", "SKILL.md"), /processos filhos[^`]*`references\/testes\.md`/, "o passo 3 não aponta para a regra");
  const armadilha = ler("agentic-feature", "references", "revisao-e-entrega.md").match(/^9\. \*\*Timeouts[^]*?(?=^10\. )/m)?.[0] ?? "";
  assert.match(armadilha, /<agentic-implement>\/references\/testes\.md/);
  assert.doesNotMatch(armadilha, /≥ 2×|teardown/, "a armadilha repete a regra em vez de apontar para ela");
});

// O prompt de um job é o brief e, quando o lançador do projeto tem regras que vão por cima de cada
// job, os apontadores para essas regras mais o brief; as regras não se copiam.
test("agentic-feature: o prompt do job é as regras do lançador mais o brief", () => {
  const implementacao = ler("agentic-feature", "references", "implementacao.md").replace(/\s+/g, " ");
  assert.match(implementacao, /regras do lançador que vão por cima de cada job[^.]*o prompt é essas regras mais o brief/);
  assert.match(implementacao, /`AGENTS\.md` ou o `CLAUDE\.md`[^.]*diz quais/);
  assert.match(implementacao, /regras mais o brief, por apontador/);
  const brief = ler("agentic-feature", "assets", "brief-agente.template.md");
  assert.match(brief, /Regras do projeto: `[^`]*(?:AGENTS|CLAUDE)\.md[^`]*`/, "apontador para as regras do projeto");
  assert.match(brief, /regras do lançador:\s*`<caminho, ou nenhuma>`/i, "apontador para as regras do lançador");
  assert.match(brief, /por apontador; não copies regras comuns/);
  assert.match(ler("agentic-feature", "assets", "brief-agente.template.md"), /regras do lançador[^]*por cima de cada job[^]*regras mais este brief/i);
});

// Quando o lançador regista cada job no quadro, o brief traz as linhas que ele lê e o agente não se
// regista; o título do brief admite o formato do lançador.
test("agentic-feature: o brief admite o quadro do lançador e o título que ele lê", () => {
  const brief = ler("agentic-feature", "assets", "brief-agente.template.md");
  assert.match(brief, /^<título da faixa[^\n]*Tarefa <n> — <nome>/m, "o título do brief admite o formato do lançador");
  const quadro = brief.split("\n## Quadro")[1];
  assert.match(quadro, /lançador que regista cada job no quadro[^]*o agente não\s+se\s+regista/);
  assert.match(quadro, /^item: <id[^>]*>$/m, "a linha que o lançador lê");
  assert.match(quadro, /Senão[^]*regista-se como diz o `README\.md`/);
  assert.ok(quadro.indexOf("agente sinal") > quadro.indexOf("Senão"), "o agente só regista no caso sem lançador");
  // O caso escolhe-se pela forma como a faixa é lançada, e não pelo projeto: no mesmo projeto, um
  // subagente não passa pelo lançador que regista os jobs e tem de se registar ele próprio.
  assert.match(quadro, /pela forma como esta faixa é lançada/, "o caso escolhe-se por lançamento");
  assert.match(quadro, /Senão\*\* \(um subagente, ou um lançador que não regista\)/, "o subagente regista-se");
});

// O AGENTS.md preenchido tem ~4 KB (até ~5 KB com regras do projeto): o texto fixo do modelo, sem o
// comentário inicial nem os {{…}}, fica em ~3 200 B para deixar margem ao que o projeto acrescenta.
export function textoFixo(modelo) {
  return modelo.replace(/^<!--[\s\S]*?-->\n?/, "").replace(/\{\{[\s\S]*?\}\}/g, "");
}

test("os modelos de AGENTS.md e REVIEW.md cabem no orçamento", () => {
  const ler = (...partes) => readFileSync(path.join(SKILLS, ...partes), "utf8");
  const fixo = Buffer.byteLength(textoFixo(ler("agentic-project", "assets", "AGENTS.template.md")));
  assert.ok(fixo <= 3200, `texto fixo de AGENTS.template.md com ${fixo} bytes`);
  const review = Buffer.byteLength(ler("agentic-code-review", "assets", "REVIEW.template.md"));
  assert.ok(review <= 3000, `REVIEW.template.md com ${review} bytes`);
});

test("o texto fixo tira o comentário e os {{…}} (controlo)", () => {
  assert.equal(textoFixo("<!-- nota\nlonga -->\n# A\n{{x}} b {{y\nz}}c\n"), "# A\n b c\n");
});

test("o leitor recusa um frontmatter partido (controlo)", () => {
  assert.ok(lerFrontmatter("---\nname: [partido\ndescription: x\n---\n").erro);
  assert.ok(lerFrontmatter("---\nname: a\ndescription: x\n").erro);
  assert.ok(lerFrontmatter("name: a\n").erro);
  assert.equal(lerFrontmatter("---\nname: a\ndescription: >-\n  um\n  dois\n---\n").campos.description, "um dois");
});

// As preferências por omissão (código e texto do produto) vivem num ficheiro
// só, o gostos.md da agentic-implement: quem escreve lê-o no
// passo 6 e a lente normas da revisão confere o diff pelo mesmo ficheiro.
test("agentic-implement: o gostos.md existe, só com as secções Código e Texto do produto", () => {
  const f = path.join(SKILLS, "agentic-implement", "references", "gostos.md");
  assert.ok(existsSync(f), "falta agentic-implement/references/gostos.md");
  const seccoes = readFileSync(f, "utf8").split("\n").filter((l) => l.startsWith("## "));
  assert.deepEqual(seccoes, ["## Código", "## Texto do produto"]);
  // Quem revê lê este ficheiro sem o SKILL.md da agentic-implement: o marcador diz-se aqui.
  assert.match(readFileSync(f, "utf8"), /`<agentic-design>` é a skill irmã/);
});

// A profundidade da pesquisa acompanha o tamanho; numa alteração trivial bastam 1 a 2
// minutos.
test("agentic-feature: a pesquisa de uma alteração trivial é uma verificação de 1 a 2 minutos", () => {
  const quando = ler("agentic-feature", "references", "pesquisa-moderna.md").split("## Quando, até onde e onde fica")[1].split("\n## ")[0];
  assert.match(quando, /alteração trivial[^]*?1 a 2 minutos/);
  assert.match(passoDaFeature(1), /numa alteração trivial, só uma linha na Leitura, sem `pesquisa\.md`/);
  assert.match(ler("agentic-feature", "references", "revisao-e-entrega.md"), /numa alteração trivial, a linha da Leitura/);
});

test("agentic-implement: o passo 6 aponta para o gostos.md, o design system e o AGENTS.md do projeto", () => {
  const passo6 = ler("agentic-implement", "SKILL.md").split("## 6. ")[1].split("\n## ")[0];
  assert.match(passo6, /`references\/gostos\.md`/);
  assert.match(passo6, /design system do projeto/);
  assert.match(passo6, /`AGENTS\.md`/);
});

test("agentic-code-review: a lente normas confere o diff pelo gostos.md da agentic-implement", () => {
  const brief = ler("agentic-code-review", "assets", "brief-revisor.template.md");
  const normas = brief.match(/^- \*\*Normas\*\*:[^]*?(?=^- \*\*)/m)?.[0] ?? "";
  assert.ok(normas, "o brief não tem a lente normas");
  assert.match(normas, /`<agentic-implement>\/references\/gostos\.md`/);
  assert.match(brief.split("-->")[0], /`<agentic-implement>`/, "o comentário do modelo não diz o que é <agentic-implement>");
});

// A agentic-architecture: o método do Matt Pocock em seis passos,
// cada um com critério de fim; prova medida nos candidatos; grill de uma pergunta de cada vez; a
// execução vai para a agentic-feature.
test("agentic-architecture: seis passos com «Feito quando», prova medida, grill de uma pergunta de cada vez e execução pela agentic-feature", () => {
  const passos = ler("agentic-architecture", "SKILL.md").split(/^## (?=\d\. )/m).slice(1).map((p) => p.split("\n## ")[0]);
  assert.deepEqual(passos.map((p) => p.slice(0, 2)), ["1.", "2.", "3.", "4.", "5.", "6."]);
  for (const p of passos) assert.match(p, /\nFeito quando /, `passo ${p.slice(0, 2)} sem critério de fim`);
  const [, prova, relatorio, , grill, execucao] = passos;
  for (const marca of [/git log/, /`ficheiro:linha`/, /\*\*teste de apagar\*\*/, /nunca estimada/]) assert.match(prova, marca);
  assert.match(relatorio, /`references\/relatorio\.md`[^]*ferramenta Artifact/);
  assert.match(grill, /`references\/grill\.md`: uma pergunta de cada vez/);
  assert.match(grill, /`references\/desenhar-duas-vezes\.md`/);
  assert.match(execucao, /<agentic-feature>\/SKILL\.md/);
  assert.match(ler("agentic-architecture", "references", "grill.md"), /^## Uma pergunta de cada vez$/m);
});

test("agentic-architecture: o vocabulário define os termos do método", () => {
  const vocab = ler("agentic-architecture", "references", "vocabulario.md");
  for (const termo of ["Módulo", "Interface", "Implementação", "Profundidade", "Costura", "Adaptador", "Porta", "Alavancagem", "Localidade", "Aprofundar", "Atrito", "Glossário do domínio"])
    assert.match(vocab, new RegExp(`^\\*\\*${termo}\\*\\*`, "m"), `falta ${termo}`);
  for (const principio of ["O teste de apagar.", "A interface é a superfície de teste.", "Um adaptador é uma costura hipotética; dois são uma costura real."])
    assert.ok(vocab.includes(`**${principio}**`), `falta o princípio «${principio}»`);
});

// O vocabulário de arquitetura vive só na agentic-architecture: onde a agentic-feature, a
// agentic-implement e a agentic-project desenham módulos ou interfaces, apontam para ele, e o
// `mattpocock-skills:codebase-design` só aparece ao lado desse ponteiro, como alternativa opcional
// (antes era a única via, e só existia onde o plugin está instalado).
const VOCABULARIO = "<agentic-architecture>/references/vocabulario.md";
export function codebaseDesignSemPonteiro(texto) {
  // Um bloco é um parágrafo; numa tabela, cada linha conta como bloco próprio.
  const blocos = texto.split(/\n\s*\n/).flatMap((p) => (/^\|/m.test(p) ? p.split("\n") : [p]));
  return blocos.filter((b) => b.includes("codebase-design") && !b.includes(VOCABULARIO)).map((b) => b.trim().slice(0, 80));
}

test("o vocabulário de arquitetura é da agentic-architecture: a agentic-feature, a agentic-implement e a agentic-project apontam para ele", () => {
  const passo3 = ler("agentic-implement", "SKILL.md").split("## 3. ")[1].split("\n## ")[0];
  const costuras = ler("agentic-implement", "references", "testes.md").split("## Costuras")[1].split("\n## ")[0];
  const plan = ler("agentic-feature", "references", "spec-kit.md").split("**`speckit-plan`**")[1].split("\n4. ")[0];
  const modulos = ler("agentic-feature", "assets", "spec-leve.template.md").split("\n").find((l) => l.startsWith("**Módulos tocados**"));
  const fase3 = ler("agentic-project", "references", "arquitetura.md").split("## 4. Módulos profundos")[1].split("\n## ")[0];
  const mapa = ler("agentic-project", "references", "mapa-de-skills.md").split("\n").find((l) => l.startsWith("| Desenhar módulos, interfaces, costuras |"));
  for (const [onde, texto] of Object.entries({ passo3, costuras, plan, modulos, fase3, mapa }))
    assert.ok(texto?.includes(VOCABULARIO), `${onde} sem o ponteiro para o vocabulário`);
  const fora = ["agentic-feature", "agentic-implement", "agentic-project"].flatMap((s) =>
    mdsDe(s).flatMap((f) => codebaseDesignSemPonteiro(readFileSync(f, "utf8")).map((b) => `${path.relative(SKILLS, f)}: ${b}`)));
  assert.deepEqual(fora, []);
});

test("codebaseDesignSemPonteiro aponta o codebase-design sem o vocabulário ao lado (controlo)", () => {
  assert.equal(codebaseDesignSemPonteiro("Usa o `mattpocock-skills:codebase-design`.\n\nOutro parágrafo.").length, 1);
  assert.deepEqual(codebaseDesignSemPonteiro(`Usa \`${VOCABULARIO}\`; o \`codebase-design\` é alternativa.`), []);
  assert.equal(codebaseDesignSemPonteiro(`| a | \`codebase-design\` |\n| b | \`${VOCABULARIO}\` |`).length, 1, "a linha da tabela sem ponteiro");
});

// Cada número do passo 2 traz o comando que o mede (a frequência conta
// commits, porque somar a contagem por ficheiro conta duas vezes o commit que toca vários; a
// mudança conjunta tem comando) e a janela do histórico declara-se também com uma direção do humano.
test("agentic-architecture: a frequência e a mudança conjunta têm comando, e a janela declara-se sempre", () => {
  const passo2 = ler("agentic-architecture", "SKILL.md").split("## 2. ")[1].split("\n## ")[0];
  assert.ok(passo2.includes("`git log --since=<data> --format=%H -- <ficheiros do candidato> | wc -l`"), "frequência sem o comando por candidato");
  assert.ok(passo2.includes("`git log --since=<data> --full-diff --name-only --format= -- <ficheiros do candidato> | grep . | sort | uniq -c | sort -rn`"), "mudança conjunta sem comando");
  assert.match(passo2, /janela do histórico[^]*?declara-a[^]*?também quando o humano deu uma direção/);
});

// O relatório é um ecrã que o humano lê: segue as regras de UI da agentic-design, onde vivem os
// gostos de UI, e o esqueleto e os exemplos passam o detetor dela.
test("agentic-architecture: o relatório segue as regras de UI da agentic-design e os blocos HTML passam o detetor", (t) => {
  const relatorio = ler("agentic-architecture", "references", "relatorio.md");
  const estilo = relatorio.split("## Estilo")[1].split("\n## ")[0];
  assert.match(estilo, /`<agentic-design>\/references\/ui-sem-slop\.md`/);
  assert.match(estilo, /`node <agentic-design>\/scripts\/detetar-slop\.mjs <ficheiro do relatório>`/);
  assert.doesNotMatch(relatorio, /\buppercase\b|tracking-wid|linear-gradient|bg-gradient|border-l-\d/, "o modelo pede o que a agentic-design proíbe");
  const blocos = [...relatorio.matchAll(/```html\n([^]*?)```/g)].map((m) => m[1]);
  assert.ok(blocos.length >= 2, "o esqueleto e o exemplo do Mermaid");
  const pasta = mkdtempSync(path.join(tmpdir(), "relatorio-"));
  t.after(() => rmSync(pasta, { recursive: true, force: true }));
  blocos.forEach((b, i) => writeFileSync(path.join(pasta, `bloco-${i}.html`), b));
  const r = spawnSync(process.execPath, [path.join(SKILLS, "agentic-design", "scripts", "detetar-slop.mjs"), pasta], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, new RegExp(`${blocos.length} ficheiro\\(s\\) analisado\\(s\\): 0 bloqueio\\(s\\), 0 aviso\\(s\\)`));
});

// Regras dos agentes: cada uma vive no ficheiro que a executa
// e os outros sítios apontam para ele. Cada teste pina a fonte e procura fora dela as marcas
// literais da regra (as perguntas do nível, «matriz completa», «número de cobertura») ou, no teste de aceitação do revisor, as
// frases antigas e a condição «na Completa» nos sítios que já a diziam. Uma paráfrase passa: apanha-se
// na revisão.
const todosOsMds = () => pastas.flatMap(mdsDe);
// Os cartões gerados (tools/cartoes.mjs) copiam a regra de propósito: as linhas do cartão de um SKILL.md declarado não contam.
export function marcasNoTexto(re, texto, comCartao = false) {
  return linhasForaDoCartao(texto, comCartao).filter(([l]) => re.test(l)).map(([, n]) => n);
}
export function marcasFora(re, fonte) {
  const fora = [];
  for (const f of todosOsMds()) {
    if (path.relative(SKILLS, f) === fonte) continue;
    for (const n of marcasNoTexto(re, readFileSync(f, "utf8"), temCartao(f))) fora.push(`${path.relative(SKILLS, f)}:${n}`);
  }
  return fora;
}
test("marcasFora ignora as linhas dentro de um cartão gerado, e só essas", () => {
  const re = /Passos por enumerar\?/;
  const texto = [
    "Passos por enumerar? (fora, antes)",
    "<!-- cartao:inicio — gerado por tools/cartoes.mjs; edita as fontes -->",
    "## Cartão",
    "3. **Passos por enumerar?** (dentro)",
    "<!-- cartao:fim -->",
    "",
    "Passos por enumerar? (fora, depois)",
  ].join("\n");
  assert.deepEqual(marcasNoTexto(re, texto, true), [1, 7], "a marca fora do cartão, antes e depois, é apanhada");
  assert.deepEqual(marcasNoTexto(re, "<!-- cartao:nivel-1 -->\nPassos por enumerar?\n<!-- /cartao:nivel-1 -->"), [2], "o marcador de uma fonte não esconde nada");
  // A isenção é só do primeiro cartão de um SKILL.md que o tools/cartoes.json declara.
  assert.deepEqual(marcasNoTexto(re, texto, true), [1, 7], "num SKILL.md declarado, o cartão não conta");
  assert.deepEqual(marcasNoTexto(re, texto, false), [1, 4, 7], "um bloco de cartão escrito à mão fora dos declarados é apanhado");
  const doisCartoes = [texto, "<!-- cartao:inicio — outro -->", "Passos por enumerar? (2.º cartão)", "<!-- cartao:fim -->"].join("\n");
  assert.deepEqual(marcasNoTexto(re, doisCartoes, true), [1, 7, 9], "o segundo cartão de um ficheiro declarado é apanhado");
  // Nos ficheiros reais: os cartões trazem a marca (copiada de propósito) e o marcasFora não a conta.
  const fonte = "agentic-implement/references/escolher-o-agente.md";
  for (const skill of ["agentic-fix", "agentic-feature"]) assert.match(ler(skill, "SKILL.md"), re, `o cartão da ${skill} traz a marca`);
  assert.deepEqual(marcasFora(re, fonte), []);
  assert.ok(marcasFora(re, "").length > 0, "marca ausente da própria fonte (controlo)");
});

// Onde há cartão: só nos SKILL.md que o tools/cartoes.json declara, e um só em cada. Um cartão escrito à
// mão numa referência, ou um segundo cartão, esconderia uma cópia da regra das guardas que a procuram fora da fonte.
export function problemasDeCartao(rel, texto, declarado) {
  const linhasDoTexto = texto.split("\n");
  const inicios = linhasDoTexto.filter((l) => l.startsWith("<!-- cartao:inicio")).length;
  const fins = linhasDoTexto.filter((l) => l.trim() === "<!-- cartao:fim -->").length;
  if (declarado) return inicios === 1 && fins === 1 ? [] : [`${rel}: ${inicios} início(s) e ${fins} fim(ns) de cartão, e devia ter 1 de cada`];
  return inicios || fins ? [`${rel}: tem marcadores de cartão (${inicios} início, ${fins} fim) e não está em tools/cartoes.json`] : [];
}

test("só os SKILL.md que tools/cartoes.json declara têm cartão, e um só cada", () => {
  assert.deepEqual(COM_CARTAO, ["agentic-feature/SKILL.md", "agentic-fix/SKILL.md"]);
  const achados = todosOsMds().flatMap((f) => {
    const rel = path.relative(SKILLS, f);
    return problemasDeCartao(rel, readFileSync(f, "utf8"), COM_CARTAO.includes(rel));
  });
  assert.deepEqual(achados, []);
  const cartao = "<!-- cartao:inicio — x -->\n## Cartão\n<!-- cartao:fim -->\n";
  assert.ok(problemasDeCartao("agentic-fix/references/x.md", `a\n\n${cartao}`, false).length > 0, "um cartão escrito à mão numa referência é apanhado (controlo)");
  assert.ok(problemasDeCartao("agentic-fix/SKILL.md", `${cartao}\n${cartao}`, true).length > 0, "um segundo cartão num ficheiro declarado é apanhado (controlo)");
  assert.ok(problemasDeCartao("agentic-fix/SKILL.md", "sem cartão\n", true).length > 0, "um ficheiro declarado sem cartão é apanhado (controlo)");
  assert.deepEqual(problemasDeCartao("agentic-fix/SKILL.md", `a\n\n${cartao}`, true), []);
});

const seccao = (texto, inicio) => texto.split(inicio)[1].split("\n## ")[0].replace(/\s+/g, " ");

// O nível mede o que o agente ainda tem de decidir ou descobrir que o brief não diz. O
// orquestrador fecha o que puder antes; desenho novo, lógica delicada ou várias áreas já decididos no
// brief não fazem a tarefa complexa; a zona sensível pesa na revisão.
test("agentic-implement: o nível mede o que o brief deixa por decidir; quatro perguntas por ordem; o decidido no brief não faz complexa", () => {
  const fonte = "agentic-implement/references/escolher-o-agente.md";
  const nivel = seccao(ler("agentic-implement", "references", "escolher-o-agente.md"), "## 1. ");
  assert.match(nivel, /O nível mede o que o agente ainda tem de decidir ou descobrir que o brief não diz/);
  assert.match(nivel, /Antes de chamar uma tarefa complexa, fecha o que puderes/);
  const posicoes = ["Causa por descobrir?", "Desenho que só aparece no código?", "Passos por enumerar?", "Já falhou?"].map((p) => nivel.indexOf(`**${p}**`));
  assert.ok(posicoes.every((i, k) => i >= 0 && (k === 0 || i > posicoes[k - 1])), `as quatro perguntas, por ordem: ${posicoes}`);
  assert.match(nivel, /pára na primeira que manda para \*\*complexa\*\*/);
  assert.match(nivel, /Passou nas quatro: \*\*bem-definida\*\*\. Desenho novo, lógica delicada[^.]*não fazem a tarefa complexa quando o brief já os decidiu/);
  assert.match(nivel, /a correção de um Importante que o orquestrador reproduziu e cuja regra escreveu/);
  assert.match(nivel, /O humano pode forçar o nível/);
  assert.match(nivel, /Zona sensível \(tenant, sessão, faturação, dados pessoais\) não sobe o nível[^.]*pesa no nível da revisão/);
  assert.doesNotMatch(nivel, /Caminhos sempre altos|niveis-de-risco/, "a lista da revisão não entra no nível de quem escreve");
  assert.doesNotMatch(nivel, /\*\*Desenho novo\?\*\*|\*\*Lógica delicada\?\*\*|\*\*Várias áreas\?\*\*/, "as perguntas antigas mandavam para complexa o que o brief já decidira");
  // A linha `nível:` tem rótulos fixos, que a guarda do lançamento lê: cada rótulo da complexa é a
  // pergunta em minúsculas e sem «?». Os dois briefs-modelo mostram-nos.
  const rotulos = ["causa por descobrir", "desenho que só aparece no código", "passos por enumerar", "já falhou"];
  assert.match(nivel, /`nível: bem-definida — decisões fechadas: <quais>`/, "a bem-definida diz as decisões fechadas");
  assert.match(nivel, /`nível: complexa — <rótulo>: <detalhe>`, com o rótulo igual a uma das quatro perguntas, em minúsculas e sem «\?»/);
  for (const r of rotulos) assert.ok(nivel.includes(`\`${r}\``), `falta o rótulo \`${r}\``);
  assert.match(nivel, /`nível: <nível> — forçado pelo humano: <as palavras dele>`/, "o humano forçou o nível");
  assert.match(nivel, /a guarda do lançamento lê-a/);
  assert.match(nivel, /`nível: complexa — causa por descobrir: [^`]+`/, "exemplo de uma complexa");
  for (const modelo of [["agentic-fix", "assets", "brief-correcao.template.md"], ["agentic-feature", "assets", "brief-agente.template.md"]]) {
    const linha = ler(...modelo).split("\n").find((l) => l.startsWith("nível: "));
    assert.ok(linha, `${modelo.join("/")} sem linha nível:`);
    // As três formas, com o mesmo aspeto nos dois modelos: uma lista de rótulos em prosa lê-se como texto a copiar.
    for (const forma of ["bem-definida — decisões fechadas: <quais>", `complexa — <${rotulos.join("|")}>: <detalhe>`, "<nível> — forçado pelo humano: <as palavras dele>"]) {
      assert.ok(linha.includes(forma), `${modelo.join("/")}: a linha nível: não tem a forma «${forma}»`);
    }
  }
  assert.deepEqual(marcasFora(/Causa por descobrir\?|Desenho que só aparece no código\?|Passos por enumerar\?/, fonte), []);
  assert.ok(marcasFora(/Passos por enumerar\?/, "").length > 0, "marca ausente da própria fonte (controlo)");
});

// O agente é o do orquestrador; o outro fornecedor só com pedido explícito do humano, também nas
// revisões e no verificador. A regra vive no §3 do escolher-o-agente.md; o painel aponta para lá.
test("agentic-implement: o agente é o do orquestrador e o outro só entra com pedido explícito; a folga não troca de fornecedor", () => {
  const fonte = "agentic-implement/references/escolher-o-agente.md";
  const agente = seccao(ler("agentic-implement", "references", "escolher-o-agente.md"), "## 3. ");
  assert.match(agente, /O agente é o do orquestrador\. O outro só entra com pedido explícito do humano para esse trabalho/);
  assert.match(agente, /não muda o agente: diz ao humano a folga que resta e pergunta/);
  assert.doesNotMatch(agente, /vai para o outro|mais folga nos limites/, "a regra antiga trocava de fornecedor pela folga");
  assert.match(seccao(ler("agentic-code-review", "references", "painel-e-rondas.md"), "## §3 "), /O fornecedor é o do orquestrador; o outro só com pedido explícito do humano \(`<agentic-implement>\/references\/escolher-o-agente\.md` §3\)/);
  assert.deepEqual(marcasFora(/O outro só entra com pedido explícito/, fonte), []);
});

// A tarefa curta: o orquestrador fá-la sem brief nem agente. A regra vive no §1 do
// escolher-o-agente.md; a agentic-fix (passo 2) e a agentic-feature (passo 5) apontam para lá, e a
// revisão continua a ser de contexto novo.
test("agentic-implement: a tarefa curta faz-a o orquestrador, sem brief; a agentic-fix e a agentic-feature apontam para o §1", () => {
  const fonte = "agentic-implement/references/escolher-o-agente.md";
  const nivel = seccao(ler("agentic-implement", "references", "escolher-o-agente.md"), "## 1. ");
  assert.match(nivel, /\*\*curta\*\* quando cabe numa faixa só, com 1 ficheiro de código e o seu teste, até ~50 linhas/);
  assert.match(nivel, /fora das zonas sensíveis[^]*?e fora de hooks, CI e instaladores/);
  assert.match(nivel, /faz-a o orquestrador, com a `agentic-implement`, sem brief nem agente/);
  assert.match(nivel, /quem escreveu não revê/);
  assert.match(nivel, /`nível: curta — <porquê>`/);
  assert.match(seccao(ler("agentic-fix", "SKILL.md"), "## Passo 2"), /§1 de `<agentic-implement>\/references\/escolher-o-agente\.md`\. Numa \*\*curta\*\* não há brief nem agente/);
  assert.match(seccao(ler("agentic-feature", "SKILL.md"), "## Passo 5"), /escolher-o-agente\.md` §1–§3[^]*Uma faixa curta \(§1\) fazes tu, sem brief/);
  assert.deepEqual(marcasFora(/1 ficheiro de código e o seu teste/, fonte), []);
});

// A prova de UI de uma correção é proporcional; a matriz completa é de um ecrã novo ou de um
// redesenho. A fonte é o prova.md da agentic-design; a agentic-fix aponta para lá.
test("agentic-design: numa correção, a captura do ecrã apontado antes e depois; a matriz completa só num ecrã novo ou num redesenho; a agentic-fix aponta para lá", () => {
  const fonte = "agentic-design/references/prova.md";
  const capturar = seccao(ler("agentic-design", "references", "prova.md"), "## 2. Capturar");
  assert.match(capturar, /Numa correção[^.]*captura do ecrã apontado, antes e depois, no tema e na resolução do report/);
  assert.match(capturar, /com e sem dados só se a correção mexe nesse estado/);
  assert.match(capturar, /A matriz completa \(estados, resoluções, temas, teclado\) só num ecrã novo ou num redesenho/);
  // A matriz é o parágrafo dos estados (e o teclado do §3); o resto do §2 vale também numa correção.
  assert.match(capturar, /\*\*A matriz completa\.\*\* Captura com dados cheios/);
  assert.match(capturar, /O resto do §2 vale também para as capturas de uma correção/);
  const passo3 = seccao(ler("agentic-fix", "SKILL.md"), "## Passo 3");
  assert.match(passo3, /Num defeito visual[^]*`<agentic-design>\/references\/prova\.md` §2/);
  assert.doesNotMatch(passo3, /resolu|\btema|matriz|vazios/i, "o passo 3 repete a regra em vez de apontar para ela");
  assert.deepEqual(marcasFora(/matriz completa/i, fonte), []);
  assert.ok(marcasFora(/matriz completa/i, "").length > 0, "marca ausente da própria fonte (controlo)");
});

// O teste de aceitação do revisor (Completa escreve e corre; Padrão descreve; Rápida não tem)
// vive no §3 do painel-e-rondas.md; o modelo do brief, o do relatório e as skills que falam do
// revisor apontam para lá.
test("agentic-code-review: o teste de aceitação do revisor vive no §3 do painel-e-rondas.md; os outros sítios apontam para lá", () => {
  const lentes = seccao(ler("agentic-code-review", "references", "painel-e-rondas.md"), "## §3 ");
  assert.match(lentes, /Completa[^.]*o revisor escreve e corre um teste de aceitação seu, fora do repo, a partir da intenção/);
  assert.match(lentes, /Padrão[^.]*descreve-o/);
  assert.match(lentes, /Rápida[^.]*não há/);
  const ponteiro = /painel-e-rondas\.md` §3/;
  const antigo = /descreve ou entrega|[Dd]escreve pelo menos um teste de aceitação|acrescenta pelo menos um teste de aceitação|confirma ou acrescenta|entrega-se fora do repo/;
  const brief = ler("agentic-code-review", "assets", "brief-revisor.template.md");
  const sitios = {
    "brief-revisor.template.md (lente Spec)": brief.match(/^- \*\*Spec\*\*[^]*?(?=^- \*\*)/m)?.[0],
    "relatorio.template.md": ler("agentic-code-review", "assets", "relatorio.template.md").match(/^- \*\*Teste de aceitação\*\*[^]*?(?=^- )/m)?.[0],
    "metodologia.md (papéis)": ler("agentic-project", "references", "metodologia.md").split("\n").find((l) => l.startsWith("| Revisor |")),
    "metodologia.md (armadilha)": ler("agentic-project", "references", "metodologia.md").match(/^- \*\*O teste do autor[^]*?(?=^- \*\*Provar)/m)?.[0],
    "revisao-e-entrega.md (armadilha)": ler("agentic-feature", "references", "revisao-e-entrega.md").match(/^2\. \*\*O teste do autor[^]*?(?=^3\. )/m)?.[0],
  };
  for (const [onde, texto] of Object.entries(sitios)) {
    assert.ok(texto, `${onde}: não encontrei o sítio`);
    const plano = texto.replace(/\s+/g, " ");
    assert.match(plano, ponteiro, `${onde} não aponta para o §3`);
    assert.doesNotMatch(plano, antigo, `${onde} repete a regra antiga`);
  }
  assert.doesNotMatch(brief, /entrega-se fora do repo/);
  // O ficheiro só existe na Completa (na Padrão o revisor descreve-o): onde se diz que o autor o
  // integra, diz-se a condição.
  const integra = {
    "revisao-e-entrega.md (passo 3)": ler("agentic-feature", "references", "revisao-e-entrega.md").match(/^3\. \*\*O teste de aceitação do revisor[^]*?(?=^4\. )/m)?.[0],
    "metodologia.md (Agentes)": ler("agentic-project", "references", "metodologia.md").split("\n").find((l) => l.startsWith("| Agentes |")),
  };
  for (const [onde, texto] of Object.entries(integra)) {
    assert.ok(texto, `${onde}: não encontrei o sítio`);
    assert.match(texto.replace(/\s+/g, " "), /na Completa/, `${onde} diz que o autor integra o teste do revisor sem a condição «na Completa»`);
  }
});

// Revisores por nível: na Padrão as lentes do nível vão num só revisor; na Completa cada lente tem o
// seu, a segurança também, e o verificador à parte. A regra vive no §3 do painel-e-rondas.md; o
// SKILL.md e a tabela dos níveis apontam para lá.
test("agentic-code-review: na Padrão, as lentes do nível num só revisor (§3 do painel-e-rondas.md); a tabela dos níveis e o SKILL.md apontam para lá", () => {
  const fonte = "agentic-code-review/references/painel-e-rondas.md";
  const lentes = seccao(ler("agentic-code-review", "references", "painel-e-rondas.md"), "## §3 ");
  assert.match(lentes, /na \*\*Padrão\*\*, as lentes do nível \(correção, spec e normas, ou as que o `REVIEW\.md` lhe dá\) vão num só revisor de contexto novo, com um brief só/);
  assert.match(lentes, /Na \*\*Completa\*\*, cada lente tem o seu revisor, a segurança também, e o verificador corre à parte/);
  const padrao = ler("agentic-code-review", "references", "niveis-de-risco.md").split("\n").find((l) => l.startsWith("| Padrão |"));
  assert.match(padrao, /num só revisor \(`painel-e-rondas\.md` §3\)/);
  assert.match(ler("agentic-code-review", "SKILL.md").replace(/\s+/g, " "), /com as lentes que o `references\/painel-e-rondas\.md` §3 lhe dá pelo nível/);
  assert.deepEqual(marcasFora(/lentes do nível \(correção, spec e normas/, fonte), []);
});

// Sem número de cobertura como gate da revisão. A regra vive só no §3 do painel-e-rondas.md.
test("agentic-code-review: sem número de cobertura como gate, e um número em falta não é achado (§3 do painel-e-rondas.md, só lá)", () => {
  const fonte = "agentic-code-review/references/painel-e-rondas.md";
  const lentes = seccao(ler("agentic-code-review", "references", "painel-e-rondas.md"), "## §3 ");
  assert.match(lentes, /sem número de cobertura como gate/i);
  assert.match(lentes, /teste que falha na base[^.]*integridade das asserções[^.]*mutações nas guardas/);
  assert.match(lentes, /número de cobertura em falta não é achado/);
  assert.deepEqual(marcasFora(/número de cobertura/i, fonte), []);
  assert.ok(marcasFora(/número de cobertura/i, "").length > 0, "marca ausente da própria fonte (controlo)");
});

// Cada regra vive num ficheiro; os testes pinam a fonte e
// procuram fora dela as marcas literais ou os caminhos fixos que a regra tirou.

// As lições vão para onde o REVIEW.md do projeto indica; docs/licoes.md só por omissão. A regra
// vive no aprendizagem.md, «Onde fica»; quem escreve ou procura lições aponta para lá, e a agentic-fix
// lê o REVIEW.md no passo 8.
test("as lições vão para onde o REVIEW.md indica, docs/licoes.md só por omissão (aprendizagem.md, «Onde fica»)", () => {
  const fonte = "agentic-code-review/references/aprendizagem.md";
  const regra = ler("agentic-code-review", "references", "aprendizagem.md").replace(/\s+/g, " ");
  assert.match(regra, /\*\*Onde fica\.\*\* No sítio que o `REVIEW\.md` do projeto indicar/);
  assert.match(regra, /sem indicação, em `docs\/licoes\.md`/);
  const passo8 = seccao(ler("agentic-fix", "SKILL.md"), "## Passo 8");
  assert.match(passo8, /`REVIEW\.md`/, "o passo 8 da agentic-fix não lê o REVIEW.md");
  assert.match(passo8, /aprendizagem\.md` \(«Onde fica»\)/);
  const permitidos = [fonte, "agentic-code-review/assets/caso-de-avaliacao.template.md", "agentic-code-review/assets/REVIEW.template.md"];
  const fixos = [...mdsDe("agentic-feature"), ...mdsDe("agentic-fix"), ...mdsDe("agentic-code-review")]
    .filter((f) => !permitidos.includes(path.relative(SKILLS, f)))
    .flatMap((f) => readFileSync(f, "utf8").split("\n").map((l, i) => [l, `${path.relative(SKILLS, f)}:${i + 1}`]))
    .filter(([l]) => /docs\/licoes\.md/.test(l))
    .map(([, onde]) => onde);
  assert.deepEqual(fixos, [], "caminho das lições fixo fora da regra");
  assert.match(ler("agentic-code-review", "assets", "REVIEW.template.md"), /^Lições e casos de avaliação: /m, "o modelo do REVIEW.md não tem onde dizer o destino");
  assert.deepEqual(marcasFora(/No sítio que o `REVIEW\.md` do projeto indicar/, fonte), []);
});

// O worktree e o teste de aceitação do revisor vão para a pasta temporária do §2 do
// painel-e-rondas.md (a das regras do projeto ou do utilizador, o scratchpad, e só depois $TMPDIR);
// no macOS o $TMPDIR é /var/folders, fora das pastas autorizadas.
test("agentic-code-review: os temporários do revisor seguem o <tmp> do §2 do painel-e-rondas.md, sem ${TMPDIR:-/tmp} fixo", () => {
  const fonte = "agentic-code-review/references/painel-e-rondas.md";
  const wt = seccao(ler("agentic-code-review", "references", "painel-e-rondas.md"), "## §2 ");
  assert.match(wt, /`<tmp>` é, por ordem: a pasta que as regras do projeto ou do utilizador dão para temporários; o scratchpad da sessão/);
  assert.match(wt, /\/var\/folders/);
  const fixos = mdsDe("agentic-code-review").filter((f) => /\$\{TMPDIR:-\/tmp\}\/(revisao|aceitacao)|\/tmp\/aceitacao/.test(readFileSync(f, "utf8")));
  assert.deepEqual(fixos.map((f) => path.relative(SKILLS, f)), [], "caminho temporário fixo");
  assert.match(ler("agentic-code-review", "SKILL.md").replace(/\s+/g, " "), /"<tmp>\/revisao-<tema>-<lente>"[^.]*`references\/painel-e-rondas\.md` §2/);
  assert.match(ler("agentic-code-review", "assets", "brief-revisor.template.md"), /<tmp-aceitacao>/);
  assert.deepEqual(marcasFora(/`<tmp>` é, por ordem/, fonte), []);
});

// Um só nome para o campo de reversão, «Como desfazer»; o sítio é o commit de integração
// (§10 do painel-e-rondas.md, onde o repo também pode dar outro nome), e a agentic-fix aponta para lá
// em vez de o pedir no commit da faixa.
test("um só nome, «Como desfazer:», no commit de integração (§10 do painel-e-rondas.md); a agentic-fix aponta para lá", () => {
  const base = todosOsMds().filter((f) => /^agentic-(feature|fix|implement|code-review|design|project|architecture)\//.test(path.relative(SKILLS, f)));
  const outrosNomes = base.filter((f) => /Como reverter|\bReverter:/.test(readFileSync(f, "utf8"))).map((f) => path.relative(SKILLS, f));
  assert.deepEqual(outrosNomes, [], "outro nome para o «Como desfazer»");
  const fix = ler("agentic-fix", "SKILL.md");
  assert.doesNotMatch(seccao(fix, "## Passo 5"), /`Risco:`/, "o commit da faixa não é o sítio do risco nem do desfazer");
  assert.match(seccao(fix, "## Passo 7"), /`Como desfazer:`[^]*painel-e-rondas\.md` §10/);
  assert.match(seccao(ler("agentic-code-review", "references", "painel-e-rondas.md"), "## §10 "), /outros nomes ou outro sítio, valem os do repo/);
});

// Três escalas (nível da revisão, via da feature, nível do agente) com uma só tabela de
// equivalências, no niveis-de-risco.md. O brief do revisor escreve «Nível da revisão»; a linha
// `nível:` dos briefs de quem escreve, a que os lançadores leem, é só a do agente.
test("três escalas, uma tabela (niveis-de-risco.md, «Três escalas»); o brief do revisor diz «Nível da revisão»", () => {
  const fonte = "agentic-code-review/references/niveis-de-risco.md";
  const escalas = seccao(ler("agentic-code-review", "references", "niveis-de-risco.md"), "## Três escalas");
  for (const v of ["Rápida, Padrão, Completa", "curta, bem-definida, complexa", "Rápida, Normal, Profunda"]) assert.ok(escalas.includes(v), `falta «${v}»`);
  assert.match(escalas, /`nível:` no brief de quem escreve/);
  assert.match(escalas, /o da revisão leva sempre «da revisão»/);
  const brief = ler("agentic-code-review", "assets", "brief-revisor.template.md");
  assert.match(brief, /^- Nível da revisão: /m);
  assert.doesNotMatch(brief, /^- Nível: /m);
  assert.match(ler("agentic-implement", "references", "escolher-o-agente.md").split("## 1. ")[0].replace(/\s+/g, " "), /niveis-de-risco\.md`, «Três escalas»/);
  assert.deepEqual(marcasFora(/Rápida, Normal, Profunda|mapeiam 1:1/, fonte), []);
});

// Um job sem subagentes (o Codex com os multiagentes desligados pelo lançador) carrega a
// agentic-implement e só os passos de quem escreve de outra skill; faixas, painéis e verificadores
// não lhe cabem. A regra vive no §4 do escolher-o-agente.md; a revisão num job desses segue
// «Noutros agentes» da agentic-code-review (um job por revisor, ou «revisão não independente»).
test("agentic-implement: um job sem subagentes não recebe faixas nem painéis (§4); na revisão, um job por revisor ou «não independente»", () => {
  const fonte = "agentic-implement/references/escolher-o-agente.md";
  const lancar = seccao(ler("agentic-implement", "references", "escolher-o-agente.md"), "## 4. ");
  assert.match(lancar, /\*\*Job sem subagentes\*\*/);
  assert.match(lancar, /nunca uma skill de quem orquestra a correr inteira \(a `agentic-feature`, o painel da `agentic-code-review`\)/);
  assert.match(lancar, /«Noutros agentes» de `<agentic-code-review>\/SKILL\.md`/);
  const outros = seccao(ler("agentic-code-review", "SKILL.md"), "## Noutros agentes");
  assert.match(outros, /job lançado sem subagentes[^.]*é um job seu[^.]*; um job que junta o que o nível separa marca o relatório «revisão não independente»/);
  assert.match(ler("agentic-feature", "assets", "brief-agente.template.md").replace(/\s+/g, " "), /não pede faixas, painéis nem verificadores: §4 de escolher-o-agente\.md/);
  assert.deepEqual(marcasFora(/\*\*Job sem subagentes\*\*/, fonte), []);
});

// O CLI do quadro tem uma fonte (o scrum.mjs da agentic-project) e as cópias dos projetos são
// instalações dela. Qual correr e onde está o URL vivem só no README do quadro («Fonte e cópias»):
// primeiro o que o AGENTS.md ou o CLAUDE.md nomeia; a agentic-feature aponta para lá.
test("agentic-project: o README do quadro diz a fonte do CLI e qual correr («Fonte e cópias»); a agentic-feature aponta para lá", () => {
  const fonte = "agentic-project/assets/quadro/README.md";
  const readme = ler("agentic-project", "assets", "quadro", "README.md").replace(/\s+/g, " ");
  assert.match(readme, /\*\*Fonte e cópias\.\*\* O código do CLI tem uma fonte: este `scrum\.mjs` da `agentic-project`/);
  assert.match(readme, /\*\*Qual correr\*\*: o que o `AGENTS\.md` ou o `CLAUDE\.md` \(do projeto ou do utilizador\) nomear/);
  const quadro = seccao(ler("agentic-feature", "SKILL.md"), "## Quadro");
  assert.match(quadro, /«Fonte e cópias» do `README\.md` de `<agentic-project>\/assets\/quadro\/`/);
  assert.doesNotMatch(quadro, /O CLI é `<repo>\/\.agentic\/quadro\/scrum\.mjs`/, "a agentic-feature fixa o CLI do projeto");
  assert.deepEqual(marcasFora(/\*\*Fonte e cópias\.\*\*|\*\*Qual correr\*\*/, fonte), []);
});

// O `<cli>` passou a ser o que «Qual correr» manda (um `scrum.sh`, ou o
// `scrum.mjs` da pasta), e a agentic-feature ainda mandava `node <cli> ajuda`, que com o `scrum.sh`
// rebenta (SyntaxError). O 1.º comando do Quadro corre-se tal como está escrito, com cada CLI.
test("agentic-feature: o 1.º comando do Quadro corre com o scrum.sh e com o scrum.mjs do asset", () => {
  const quadro = seccao(ler("agentic-feature", "SKILL.md"), "## Quadro");
  const m = /corre `([^`]*<cli>[^`]*)`/.exec(quadro);
  assert.ok(m, "a secção Quadro não tem o comando com <cli>");
  for (const nome of ["scrum.sh", "scrum.mjs"]) {
    const cli = path.join(SKILLS, "agentic-project", "assets", "quadro", nome);
    const [cmd, ...args] = m[1].split(" ").map((t) => (t === "<cli>" ? cli : t));
    const r = spawnSync(cmd, args, { encoding: "utf8", cwd: RAIZ });
    assert.equal(r.status, 0, `«${m[1]}» com o ${nome}: ${r.stderr}`);
    assert.match(r.stdout, /quadro de desenvolvimento/);
  }
});

// Com várias skills de UI instaladas, a agentic-design é a dona do método e ganha-lhes; as
// outras só entram para uma técnica que ela não cobre. A regra vive no §1 dela e na descrição (que
// é o que decide qual se carrega).
test("agentic-design: ganha às outras skills de UI, que só entram para uma técnica que ela não cobre (§1 e descrição)", () => {
  const precedencia = seccao(ler("agentic-design", "SKILL.md"), "## 1. Precedência");
  assert.match(precedencia, /\*\*Outras skills de UI\.\*\*[^]*não substituem esta/);
  assert.match(precedencia, /Entram só para uma técnica que esta não cobre/);
  const { campos } = lerFrontmatter(ler("agentic-design", "SKILL.md"));
  assert.match(campos.description, /Ganha às outras skills de UI instaladas/);
  assert.deepEqual(marcasFora(/\*\*Outras skills de UI\.\*\*/, "agentic-design/SKILL.md"), []);
});

// O ui-sem-slop.md (40 KB) lê-se pelas secções do modo, não inteiro em cada chamada (a regra
// vive no §5 da agentic-design; a agentic-implement aponta para lá); e o revisor lê o brief, as
// regras do projeto e as secções para que o brief aponta, não o SKILL.md da revisão (§4 do
// painel-e-rondas.md; o brief aponta para lá).
test("agentic-design: o ui-sem-slop.md lê-se pelas secções do modo (§5); o revisor não lê o SKILL.md da revisão (painel §4)", () => {
  const fonte = "agentic-design/SKILL.md";
  const antiSlop = seccao(ler("agentic-design", "SKILL.md"), "## 5. Anti-slop");
  assert.match(antiSlop, /lê-se pelas secções do modo, não inteiro/);
  assert.match(antiSlop, /\*\*variantes\*\*[^;]*§1, §2, §3 e §5/);
  assert.match(antiSlop, /\*\*rever\*\*[^;]*o detetor e o §5/);
  assert.doesNotMatch(ler("agentic-design", "SKILL.md"), /ui-sem-slop\.md` inteiro/);
  assert.match(ler("agentic-implement", "SKILL.md").replace(/\s+/g, " "), /modo «construir» \(`<agentic-design>\/SKILL\.md` §5\)/);
  assert.match(seccao(ler("agentic-code-review", "references", "painel-e-rondas.md"), "## §4 "), /o `SKILL\.md` é o processo de quem orquestra/);
  assert.match(ler("agentic-code-review", "assets", "brief-revisor.template.md").replace(/\s+/g, " "), /o `SKILL\.md` da revisão é de quem orquestra \(`painel-e-rondas\.md` §4\)/);
  assert.deepEqual(marcasFora(/lê-se pelas secções do modo/, fonte), []);
  assert.deepEqual(marcasFora(/o `SKILL\.md` é o processo de quem orquestra/, "agentic-code-review/references/painel-e-rondas.md"), []);
});

// A receita de refactor (fixar o comportamento, mudar a estrutura, provar que
// ficou igual) vive no testes.md da agentic-implement; o passo 3, o brief e o aprofundar.md da
// agentic-architecture (que manda apagar os testes dos módulos rasos) apontam para lá.
test("agentic-implement: a receita de refactor vive no testes.md; o aprofundar.md só apaga os testes antigos depois dela", () => {
  const fonte = "agentic-implement/references/testes.md";
  const testes = ler("agentic-implement", "references", "testes.md");
  const receita = seccao(testes, "## Refactor: fixar, mudar, provar igual");
  assert.match(receita, /\*\*Fixar\.\*\*[^]*caracterização[^]*diferencial/);
  assert.match(receita, /consegue falhar/);
  assert.match(receita, /\*\*Provar igual\.\*\*[^]*na base e no HEAD/);
  assert.match(receita, /`bloqueado: <a diferença>`/);
  assert.doesNotMatch(testes, /^- Refactor fica fora do ciclo: é da revisão\.$/m, "a regra antiga deixava o refactor sem prova");
  assert.match(seccao(ler("agentic-implement", "SKILL.md"), "## 3. "), /«Refactor» de `references\/testes\.md`/);
  assert.match(ler("agentic-architecture", "references", "aprofundar.md").replace(/\s+/g, " "), /só depois de o comportamento ficar fixado e provado igual[^.]*`<agentic-implement>\/references\/testes\.md`, «Refactor»/);
  assert.match(ler("agentic-feature", "assets", "brief-agente.template.md").replace(/\s+/g, " "), /Num refactor, a coluna «Teste vermelho na base» leva o comando que fixa o comportamento/);
  assert.deepEqual(marcasFora(/\*\*Provar igual\.\*\*|fixar, mudar, provar igual/i, fonte), []);
});

// Duas tentativas que falham o mesmo gate pela mesma razão param a terceira;
// o agente escreve a premissa comum e ataca-a. Vive no passo 5 da agentic-implement; o «Já falhou?»
// do escolher-o-agente.md leva a premissa para o brief novo.
test("agentic-implement: à 2.ª falha no mesmo gate, pára, escreve a premissa e ataca-a (passo 5)", () => {
  const passo5 = seccao(ler("agentic-implement", "SKILL.md"), "## 5. ");
  assert.match(passo5, /\*\*Duas falhas no mesmo gate\.\*\*/);
  assert.match(passo5, /não tentes a terceira com a mesma ideia/);
  assert.match(passo5, /`bloqueado: premissa <a frase> — <o que viste>`/);
  assert.match(seccao(ler("agentic-implement", "references", "escolher-o-agente.md"), "## 1. "), /\*\*Já falhou\?\*\*[^]*premissa que o agente devolveu/);
  assert.deepEqual(marcasFora(/Duas falhas no mesmo gate|não tentes a terceira/, "agentic-implement/SKILL.md"), []);
});

// Antes de devolver spec-em-conflito, a triagem a três vias (código, spec ou
// teste), cada hipótese com a prova. Vive no passo 5 da agentic-implement; o passo 8 e o diagnóstico
// da agentic-fix apontam para lá.
test("agentic-implement: antes de spec-em-conflito, a triagem código, spec ou teste com prova (passo 5); a agentic-fix aponta para lá", () => {
  const passo5 = seccao(ler("agentic-implement", "SKILL.md"), "## 5. ");
  assert.match(passo5, /\*\*Código, spec ou teste\.\*\*/);
  assert.match(passo5, /Antes de devolver `spec-em-conflito`, escreve as três hipóteses, cada uma com a prova/);
  assert.match(passo5, /não se mudam para ficar verde/);
  assert.match(seccao(ler("agentic-implement", "SKILL.md"), "## 8. "), /«Código, spec ou teste», passo 5/);
  assert.match(ler("agentic-fix", "references", "diagnostico.md").replace(/\s+/g, " "), /«Código, spec ou teste», no passo 5 de `<agentic-implement>\/SKILL\.md`/);
  assert.deepEqual(marcasFora(/escreve as três hipóteses/, "agentic-implement/SKILL.md"), []);
});

// A lente correção procura nas linhas acrescentadas do diff o que cala o
// typecheck ou o lint; sem motivo é Importante no código de produção. Vive no §3 do
// painel-e-rondas.md; o brief do revisor aponta para lá. O comando escrito corre-se sobre um diff de
// exemplo: apanha o que se acrescentou e deixa o que se removeu.
test("agentic-code-review: a lente correção procura no diff o que cala o verificador (§3 do painel-e-rondas.md); o brief aponta", () => {
  const fonte = "agentic-code-review/references/painel-e-rondas.md";
  const lentes = seccao(ler("agentic-code-review", "references", "painel-e-rondas.md"), "## §3 ");
  assert.match(lentes, /\*\*Calar o verificador\*\* \(lente correção\)/);
  assert.match(lentes, /Sem motivo[^.]*é Importante no código de produção/);
  const correcao = ler("agentic-code-review", "assets", "brief-revisor.template.md").match(/^- \*\*Correção\*\*[^]*?(?=^- \*\*)/m)[0].replace(/\s+/g, " ");
  assert.match(correcao, /«Calar o verificador» de `<agentic-code-review>\/references\/painel-e-rondas\.md` §3/);
  assert.deepEqual(marcasFora(/@ts-ignore|Calar o verificador\*\*/, fonte), []);
  const padrao = /grep -nE '([^']+)'/.exec(lentes)?.[1];
  assert.ok(padrao, "o §3 não tem o comando grep");
  const grep = spawnSync("grep", ["-nE", padrao], { encoding: "utf8", input: ["+const a = b as any;", "+const c = d as anyThing;", "+// @ts-ignore", "-// @ts-expect-error removido", "+x = 1  # type: ignore", "+// eslint-disable-next-line no-x -- motivo", "+ok = 1"].join("\n") });
  assert.equal(grep.error, undefined, "grep em falta: o comando do §3 não se pode provar");
  assert.deepEqual(grep.stdout.trim().split("\n").map((l) => l.split(":")[0]), ["1", "3", "5", "6"]);
});

// Uma mudança mecânica em lote faz-se com um script (que reproduz byte a byte
// uma unidade feita à mão) e um playbook que o humano aprova antes do lote, e não com N faixas; fora
// das zonas sensíveis. Vive no §4 do implementacao.md da agentic-feature. A revisão desse diff é por
// classe e vive no manutencao.md da agentic-code-review («Lote mecânico»); o SKILL.md da revisão e o
// modelo do lote apontam para as duas.
test("agentic-feature: lote mecânico com script e playbook aprovado (implementacao.md §4); a revisão por classe vive no manutencao.md", () => {
  const lancar = seccao(ler("agentic-feature", "references", "implementacao.md"), "## 4. Lançar");
  assert.match(lancar, /\*\*Lote mecânico\*\*[^]*um script, não N faixas/);
  assert.match(lancar, /o humano aprova o playbook antes do lote/);
  assert.match(lancar, /reproduz byte a byte a unidade feita à mão/);
  assert.match(lancar, /Nas zonas sensíveis[^]*?o playbook não substitui a revisão por diff/);
  const classe = seccao(ler("agentic-code-review", "references", "manutencao.md"), "## Lote mecânico: rever por classe");
  assert.match(classe, /revê-se por classe e não ficheiro a ficheiro/);
  assert.match(classe, /correção, mínimo, ao jeito do ficheiro e manutenível/);
  assert.match(classe, /Uma instância errada reprova a classe/);
  assert.match(ler("agentic-code-review", "SKILL.md").replace(/\s+/g, " "), /revê-se por classe \(`references\/manutencao\.md`, «Lote mecânico»\)/);
  assert.match(ler("agentic-feature", "assets", "lote.template.md"), /^## Playbook \(só num lote mecânico\)/m);
  assert.deepEqual(marcasFora(/um script, não N faixas|reproduz byte a byte/, "agentic-feature/references/implementacao.md"), []);
  assert.deepEqual(marcasFora(/revê-se por classe e não ficheiro a ficheiro/, "agentic-code-review/references/manutencao.md"), []);
});

// A aprovação do playbook é uma paragem do humano no passo 5. A tabela
// «O circuito e as paragens do humano» diz-a e aponta para o §4 do implementacao.md, onde vive a
// regra; sem isso, «Fora destas paragens… o resto decides tu» mandava lançar o lote sem aprovação.
test("agentic-feature: a tabela das paragens diz a do playbook do lote mecânico no passo 5 e aponta para o implementacao.md", () => {
  const circuito = ler("agentic-feature", "SKILL.md").split("## O circuito e as paragens do humano")[1].split("\n## ")[0];
  const passo5 = /^\| 5 \|.*$/m.exec(circuito)?.[0] ?? "";
  assert.match(passo5, /lote mecânico: \*\*para no playbook\*\*/);
  assert.match(passo5, /`references\/implementacao\.md` §4/);
  assert.deepEqual(marcasFora(/o humano aprova o playbook/, "agentic-feature/references/implementacao.md"), []);
});
