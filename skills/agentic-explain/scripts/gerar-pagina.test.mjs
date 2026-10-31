// Testes do gerar-pagina.mjs — `node --test skills/agentic-explain/scripts/` a partir da raiz do repo das skills.
// Cada regra do validador (esquema 2) e cada regra estática da cena tem um controlo negativo (o caso que ela
// recusa) e há documentos bons que passam; o escape do JSON na página, a posição da cena, os códigos de saída
// da linha de comandos e a lista de endereços aprovados do modelo provam o resto do contrato.
// Os casos de escrita usam um modelo mínimo de fixture, não o modelo real (que é reescrito noutra faixa).

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { gerarPagina, validar, validarCena } from "./gerar-pagina.mjs";

const AQUI = import.meta.dirname;
const SCRIPT = path.join(AQUI, "gerar-pagina.mjs");
const MODELO = path.join(AQUI, "..", "assets", "visualizador.html");

// O modelo mínimo: só os marcadores do contrato com o modelo real (os dados, o título e o lugar da cena).
const MODELO_FIXTURE = [
  "<!doctype html><html><head><title>{{titulo}}</title></head><body>",
  '<script type="application/json" id="dados">{}</script>',
  '<script id="cena-codigo"></script>',
  "</body></html>",
  "",
].join("\n");
const MODELO_SEM_CENA = MODELO_FIXTURE.replace('<script id="cena-codigo"></script>\n', "");

const SHA = "25966db61e104971e48aad9b6cf48594e24cf542";

// Um documento bom, escrito à mão e sem passar pelo código: o valor esperado vem do esquema da spec.
// Cinco nós, uma vista grafo e uma de sequência, um passo e um conceito.
function no(id, tipo = "codigo") {
  return { id, curto: id, tipo, simples: `O ${id}, por palavras simples.`, tecnico: `O ${id}, com o detalhe técnico.` };
}
function bom(extra = {}) {
  return {
    versao: 2,
    titulo: "Gerador de páginas",
    pergunta: "O que acontece quando se corre o gerador",
    tema: "codigo",
    area: "skills/agentic-explain/scripts",
    base: SHA,
    perfil: "B",
    granularidade: "componentes",
    objetivo: "perceber",
    intro: { simples: "Uma introdução simples.", tecnico: "Uma introdução técnica." },
    tipos: [{ id: "codigo", nome: "Código" }, { id: "dados", nome: "Dados" }],
    nos: [no("lê"), no("valida"), no("escreve"), no("modelo", "dados"), no("página", "dados")],
    vistas: [
      {
        id: "v1", tipo: "grafo", titulo: "As peças", nos: ["lê", "valida", "escreve", "modelo"],
        ligacoes: [{ de: "lê", para: "valida", tipo: "entrega a", ref: "scripts/gerar-pagina.mjs:40" }],
      },
      {
        id: "v2", tipo: "sequencia", titulo: "Quem fala com quem", participantes: ["lê", "valida", "escreve"],
        mensagens: [
          { id: "m1", de: "lê", para: "valida", texto: "Os dados lidos" },
          { id: "m2", de: "valida", para: "escreve", texto: "Dados válidos" },
        ],
      },
    ],
    passos: [{ titulo: "Lê os dados", vista: "v1", realca: ["lê", "valida"], citacoes: ["scripts/gerar-pagina.mjs:10-20"], simples: "Primeiro lê.", tecnico: "Primeiro lê o JSON." }],
    conceitos: [{ termo: "modelo", simples: "Uma página já feita.", tecnico: "Um HTML com um bloco de dados." }],
    ...extra,
  };
}

// Uma vista de cada tipo do catálogo, sobre os mesmos cinco nós, e o que um passo pode realçar nela.
const VISTAS = {
  grafo: () => ({ id: "v1", tipo: "grafo", titulo: "As peças", nos: ["lê", "valida", "escreve", "modelo"], ligacoes: [{ de: "lê", para: "valida", tipo: "entrega a" }] }),
  camadas: () => ({
    id: "v1", tipo: "camadas", titulo: "As camadas",
    camadas: [{ nome: "Entrada", nos: ["lê"] }, { nome: "Regras", nos: ["valida"] }, { nome: "Saída", nos: ["escreve", "página"] }],
    ligacoes: [{ de: "lê", para: "valida", tipo: "entrega a" }],
  }),
  sequencia: () => ({
    id: "v1", tipo: "sequencia", titulo: "Quem fala com quem", participantes: ["lê", "valida", "escreve"],
    mensagens: [{ id: "m1", de: "lê", para: "valida", texto: "Os dados lidos" }, { id: "m2", de: "valida", para: "escreve", texto: "Dados válidos" }],
  }),
  estados: () => ({
    id: "v1", tipo: "estados", titulo: "O ciclo", estados: ["lê", "valida", "escreve"], inicial: "lê",
    transicoes: [{ de: "lê", para: "valida", evento: "dados lidos" }, { de: "valida", para: "valida", evento: "regra a regra" }, { de: "valida", para: "escreve", evento: "sem erros" }],
  }),
  "linha-do-tempo": () => ({ id: "v1", tipo: "linha-do-tempo", titulo: "Por ordem", eventos: [{ no: "lê", quando: "primeiro" }, { no: "escreve", quando: "no fim" }] }),
  cena: () => ({ id: "v1", tipo: "cena", titulo: "A cena", nos: ["modelo", "página"] }),
};
const REALCA = { grafo: ["lê"], camadas: ["lê"], sequencia: ["lê", "m1"], estados: ["lê"], "linha-do-tempo": ["lê"], cena: ["modelo"] };

// Uma cena boa: uma só função, sem palavras proibidas nem cores literais.
const CENA_BOA = [
  "function cena(ctx) {",
  "  const { THREE, cores } = ctx;",
  "  const caixa = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: cores.neutro }));",
  "  ctx.cena.add(caixa);",
  '  ctx.elemento("modelo", caixa);',
  '  ctx.elemento("página", caixa);',
  "}",
].join("\n");

// Um documento com uma só vista, do tipo dado; `mexe` ajusta-o antes de voltar.
function comVista(tipo, mexe) {
  const d = bom({ vistas: [VISTAS[tipo]()] });
  d.passos[0].vista = "v1";
  d.passos[0].realca = [...REALCA[tipo]];
  mexe?.(d);
  return d;
}
// O perfil C, com risco nos nós e modo nas ligações e nas mensagens.
function bomC() {
  const d = bom({ perfil: "C", granularidade: "detalhe" });
  d.nos.forEach((n, i) => { n.risco = ["baixo", "medio", "alto"][i % 3]; });
  d.vistas[0].ligacoes[0].modo = "sincrona";
  d.vistas[1].mensagens[0].modo = "assincrona";
  return d;
}
// O tema geral: sem area nem base, com fontes, e o passo a citar uma delas.
const FONTE = "https://developer.example.org/dns";
function bomGeral(mexe) {
  const d = bom({ tema: "geral", perfil: "A" });
  delete d.area;
  delete d.base;
  d.fontes = [{ url: FONTE, titulo: "Como funciona o DNS", lido_em: "2026-10-31" }];
  d.passos[0].citacoes = [FONTE];
  mexe?.(d);
  return d;
}

const linhas = (dados, cena = null) => validar(dados, cena);
// Recusa o documento e mostra, no mínimo, uma linha que começa pelo campo e diz o que falha.
function recusa(dados, campo, padrao = /\S/, cena = null) {
  const r = linhas(dados, cena);
  assert.ok(r.length > 0, `devia recusar (${campo})`);
  const achada = r.find((l) => l.startsWith(`${campo}: `) && padrao.test(l.slice(campo.length + 2)));
  assert.ok(achada, `nenhuma linha «${campo}: …» com ${padrao}; vieram:\n${r.join("\n")}`);
}
const copia = (o) => structuredClone(o);

test("um documento bom passa, nos três perfis e nos dois temas", () => {
  assert.deepEqual(linhas(bom()), []);
  assert.deepEqual(linhas(bom({ perfil: "A", granularidade: "blocos" })), []);
  assert.deepEqual(linhas(bomC()), []);
  assert.deepEqual(linhas(bomGeral()), []);
});

test("cada tipo de vista do catálogo passa com os seus campos (a cena com a sua cena)", () => {
  for (const tipo of Object.keys(VISTAS)) {
    assert.deepEqual(linhas(comVista(tipo), tipo === "cena" ? CENA_BOA : null), [], tipo);
  }
});

test("sem conceitos também passa (de 0 a 6)", () => {
  const d = bom();
  delete d.conceitos;
  assert.deepEqual(linhas(d), []);
  assert.deepEqual(linhas(bom({ conceitos: [] })), []);
});

test("a raiz tem de ser um objeto", () => {
  recusa([], "dados", /objeto/);
  recusa(null, "dados", /objeto/);
});

// --- listas fechadas

test("versao tem de ser 2: um JSON do esquema 1 é recusado por ela", () => {
  recusa(bom({ versao: 1 }), "versao", /2/);
  recusa(bom({ versao: "2" }), "versao", /2/);
  const d = bom();
  delete d.versao;
  recusa(d, "versao");
  const antigo = { versao: 1, titulo: "Gerador de páginas", pergunta: "x", area: "a", base: "b", perfil: "A", granularidade: "blocos", objetivo: "perceber", nos: [], ligacoes: [], passos: [] };
  recusa(antigo, "versao", /2/);
});

test("tema, perfil, granularidade e objetivo vêm das listas", () => {
  recusa(bom({ tema: "outro" }), "tema", /codigo ou geral/);
  recusa(bom({ perfil: "D" }), "perfil", /A, B ou C/);
  recusa(bom({ granularidade: "linhas" }), "granularidade", /blocos, componentes ou detalhe/);
  recusa(bom({ granularidade: "funcoes" }), "granularidade", /blocos, componentes ou detalhe/);
  recusa(bom({ objetivo: "refatorar" }), "objetivo", /perceber, resolver ou mudar/);
  recusa(bom({ objetivo: "debug" }), "objetivo", /perceber, resolver ou mudar/);
  for (const campo of ["tema", "perfil", "granularidade", "objetivo"]) {
    const d = bom();
    delete d[campo];
    recusa(d, campo);
  }
});

// --- título e pergunta

test("o título tem de 2 a 4 palavras", () => {
  recusa(bom({ titulo: "Gerador" }), "titulo", /2 a 4 palavras/);
  recusa(bom({ titulo: "Um gerador de páginas simples" }), "titulo", /2 a 4 palavras/);
  recusa(bom({ titulo: "   " }), "titulo");
  assert.deepEqual(linhas(bom({ titulo: "Gerador de páginas web" })), []);
  assert.deepEqual(linhas(bom({ titulo: "  Gerador   de  páginas " })), []);
});

test("a pergunta é texto não vazio", () => {
  recusa(bom({ pergunta: "" }), "pergunta");
  const d = bom();
  delete d.pergunta;
  recusa(d, "pergunta");
});

// --- tema, área, base e fontes

test("tema codigo exige area e base", () => {
  for (const campo of ["area", "base"]) {
    const d = bom();
    delete d[campo];
    recusa(d, campo, /codigo/);
    recusa(bom({ [campo]: "  " }), campo, /codigo/);
  }
});

test("tema geral exige fontes não vazio, e dispensa area e base", () => {
  const sem = bomGeral((d) => { delete d.fontes; });
  recusa(sem, "fontes", /pelo menos uma/);
  recusa(bomGeral((d) => { d.fontes = []; }), "fontes", /pelo menos uma/);
  assert.deepEqual(linhas(bomGeral()), []);
  // No tema código, as fontes são opcionais.
  assert.deepEqual(linhas(bom()), []);
});

test("fontes: url https, titulo e lido_em com data AAAA-MM-DD", () => {
  const f = (mexe) => bomGeral((d) => mexe(d.fontes[0]));
  recusa(f((x) => { x.url = "http://developer.example.org/dns"; }), "fontes[0].url", /https/);
  recusa(f((x) => { x.url = "developer.example.org/dns"; }), "fontes[0].url", /https/);
  recusa(f((x) => { x.url = "https://"; }), "fontes[0].url", /https/);
  recusa(f((x) => { delete x.url; }), "fontes[0].url", /https/);
  recusa(f((x) => { x.titulo = ""; }), "fontes[0].titulo");
  recusa(f((x) => { delete x.lido_em; }), "fontes[0].lido_em", /AAAA-MM-DD/);
  for (const ma of ["31-10-2026", "2026-10-3", "2026-13-01", "2026-02-30", "hoje", 20261031]) {
    recusa(f((x) => { x.lido_em = ma; }), "fontes[0].lido_em", /AAAA-MM-DD/);
  }
  assert.deepEqual(linhas(f((x) => { x.lido_em = "2028-02-29"; })), []);
  recusa(bomGeral((d) => { d.fontes = "x"; }), "fontes", /lista/);
  recusa(bomGeral((d) => { d.fontes = ["x"]; }), "fontes[0]", /objeto/);
});

test("cada URL citado num passo existe em fontes", () => {
  recusa(bomGeral((d) => { d.passos[0].citacoes = ["https://outro.example.org/x"]; }), "passos[0].citacoes[0]", /fontes/);
  recusa(bomGeral((d) => { d.passos[0].citacoes = ["http://developer.example.org/dns"]; }), "passos[0].citacoes[0]", /fontes/);
  assert.deepEqual(linhas(bomGeral((d) => { d.passos[0].citacoes = [FONTE, "scripts/a.mjs:3"]; })), []);
  // No tema código também: um URL só vale se estiver em fontes.
  recusa(bom({ passos: [{ ...bom().passos[0], citacoes: ["scripts/a.mjs:3", "https://nao.example.org"] }] }), "passos[0].citacoes[1]", /fontes/);
});

// --- tipos e nós

test("tipos: de 1 a 6, com ids únicos", () => {
  recusa(bom({ tipos: [] }), "tipos", /1 a 6/);
  const sete = Array.from({ length: 7 }, (_, i) => ({ id: `t${i}`, nome: `Tipo ${i}` }));
  recusa(bom({ tipos: sete }), "tipos", /1 a 6/);
  const dup = bom({ tipos: [{ id: "codigo", nome: "Código" }, { id: "codigo", nome: "Outro" }] });
  recusa(dup, "tipos[1].id", /repetido/);
  recusa(bom({ tipos: [{ id: "codigo" }, { id: "dados", nome: "Dados" }] }), "tipos[0].nome");
  const seis = ["codigo", "dados", "t2", "t3", "t4", "t5"].map((id) => ({ id, nome: `Tipo ${id}` }));
  assert.deepEqual(linhas(bom({ tipos: seis })), []);
});

const NOS_MUITOS = Array.from({ length: 61 }, (_, i) => ({ id: `n${i}`, curto: `n${i}`, tipo: "codigo", simples: "s", tecnico: "t" }));
const SO_O_PRIMEIRO = { vistas: [{ id: "v1", tipo: "grafo", titulo: "Todos" }], passos: [{ titulo: "x", vista: "v1", realca: ["n0"], citacoes: ["a.mjs:1"], simples: "s", tecnico: "t" }] };

test("nos: de 1 a 60, com ids únicos, e o tipo existe em tipos", () => {
  recusa(bom({ nos: [] }), "nos", /1 a 60/);
  recusa(bom({ nos: NOS_MUITOS, ...SO_O_PRIMEIRO }), "nos", /1 a 60.*61/);
  assert.deepEqual(linhas(bom({ nos: NOS_MUITOS.slice(0, 60), ...SO_O_PRIMEIRO })), []);
  const d = bom();
  d.nos[2].id = "lê";
  recusa(d, "nos[2].id", /repetido/);
  const e = bom();
  e.nos[1].tipo = "inexistente";
  recusa(e, "nos[1].tipo", /não existe em tipos/);
});

test("com granularidade blocos, os nós são de 5 a 8", () => {
  const quatro = bom({ granularidade: "blocos" });
  quatro.nos = quatro.nos.slice(0, 4);
  quatro.vistas = [VISTAS.grafo()];
  quatro.vistas[0].nos = ["lê", "valida", "escreve", "modelo"];
  quatro.passos[0].vista = "v1";
  recusa(quatro, "nos", /blocos.*5 a 8.*4/);
  const nove = bom({ granularidade: "blocos", nos: NOS_MUITOS.slice(0, 9), ...SO_O_PRIMEIRO });
  recusa(nove, "nos", /blocos.*5 a 8.*9/);
  // O mesmo número de nós é válido noutra granularidade, e 8 é válido em blocos.
  const outra = copia(quatro);
  outra.granularidade = "componentes";
  assert.deepEqual(linhas(outra), []);
  assert.deepEqual(linhas(bom({ granularidade: "blocos", nos: NOS_MUITOS.slice(0, 8), ...SO_O_PRIMEIRO })), []);
  assert.deepEqual(linhas(bom({ granularidade: "blocos", nos: NOS_MUITOS.slice(0, 5), ...SO_O_PRIMEIRO })), []);
});

test("cada nó tem id e curto em texto", () => {
  const d = bom();
  delete d.nos[0].curto;
  recusa(d, "nos[0].curto");
  const e = bom();
  e.nos[0].id = "";
  recusa(e, "nos[0].id");
});

test("os ids de nos, de vistas e de mensagens não se repetem entre si", () => {
  const vistaComoNo = bom();
  vistaComoNo.vistas[0].id = "lê";
  vistaComoNo.passos[0].vista = "lê";
  recusa(vistaComoNo, "vistas[0].id", /repetido/);
  const mensagemComoNo = bom();
  mensagemComoNo.vistas[1].mensagens[0].id = "valida";
  recusa(mensagemComoNo, "vistas[1].mensagens[0].id", /repetido/);
  const mensagemComoVista = bom();
  mensagemComoVista.vistas[1].mensagens[1].id = "v1";
  recusa(mensagemComoVista, "vistas[1].mensagens[1].id", /repetido/);
  const duasMensagens = bom();
  duasMensagens.vistas[1].mensagens[1].id = "m1";
  recusa(duasMensagens, "vistas[1].mensagens[1].id", /repetido/);
  const duasVistas = bom();
  duasVistas.vistas[1].id = "v1";
  recusa(duasVistas, "vistas[1].id", /repetido/);
});

// --- textos simples e técnico

test("simples e tecnico não vazios: intro, cada nó, cada passo e cada conceito", () => {
  const casos = [
    ["intro.simples", (d) => { d.intro.simples = ""; }],
    ["intro.tecnico", (d) => { d.intro.tecnico = "   "; }],
    ["nos[3].simples", (d) => { d.nos[3].simples = ""; }],
    ["nos[0].tecnico", (d) => { delete d.nos[0].tecnico; }],
    ["passos[0].simples", (d) => { d.passos[0].simples = ""; }],
    ["passos[0].tecnico", (d) => { d.passos[0].tecnico = 3; }],
    ["conceitos[0].simples", (d) => { d.conceitos[0].simples = ""; }],
    ["conceitos[0].tecnico", (d) => { d.conceitos[0].tecnico = ""; }],
  ];
  for (const [campo, muda] of casos) {
    const d = bom();
    muda(d);
    recusa(d, campo, /texto|vazio/);
  }
  const semIntro = bom();
  delete semIntro.intro;
  recusa(semIntro, "intro");
});

// --- vistas: a lista e o catálogo

test("vistas: de 1 a 4, com tipo do catálogo, id e título", () => {
  recusa(bom({ vistas: [] }), "vistas", /1 a 4/);
  const quatro = [VISTAS.grafo(), VISTAS.sequencia(), VISTAS.estados(), VISTAS["linha-do-tempo"]()].map((v, i) => ({ ...v, id: `v${i + 1}` }));
  const cinco = [...quatro, { ...VISTAS.camadas(), id: "v5" }];
  recusa(bom({ vistas: cinco }), "vistas", /1 a 4.*5/);
  assert.deepEqual(linhas(bom({ vistas: quatro })), []);
  recusa(bom({ vistas: "v1" }), "vistas", /lista/);
  const d = bom();
  d.vistas[0].tipo = "mapa";
  recusa(d, "vistas[0].tipo", /grafo, camadas, sequencia, estados, linha-do-tempo ou cena/);
  const e = bom();
  e.vistas[0].titulo = "";
  recusa(e, "vistas[0].titulo");
  const f = bom();
  f.vistas[0].id = "";
  recusa(f, "vistas[0].id");
});

test("grafo: nos opcional (por omissão, todos); ligações com de e para diferentes e dentro da vista", () => {
  const sem = comVista("grafo", (d) => { delete d.vistas[0].nos; delete d.vistas[0].ligacoes; });
  assert.deepEqual(linhas(sem), []);
  recusa(comVista("grafo", (d) => { d.vistas[0].nos = ["lê", "fantasma"]; }), "vistas[0].nos[1]", /não existe em nos/);
  recusa(comVista("grafo", (d) => { d.vistas[0].nos = []; }), "vistas[0].nos", /pelo menos um/);
  const lig = (l, mexe) => comVista("grafo", (d) => { d.vistas[0].ligacoes = [l]; mexe?.(d); });
  recusa(lig({ de: "nada", para: "valida", tipo: "lê" }), "vistas[0].ligacoes[0].de", /não existe em nos/);
  recusa(lig({ de: "lê", para: "nada", tipo: "lê" }), "vistas[0].ligacoes[0].para", /não existe em nos/);
  recusa(lig({ de: "lê", para: "lê", tipo: "lê" }), "vistas[0].ligacoes[0].para", /diferente/);
  recusa(lig({ de: "lê", para: "valida" }), "vistas[0].ligacoes[0].tipo");
  // «página» existe em nos mas não está na vista.
  recusa(lig({ de: "lê", para: "página", tipo: "lê" }), "vistas[0].ligacoes[0].para", /fora desta vista/);
  // Sem `nos`, a vista tem todos, e a ligação a «página» passa.
  assert.deepEqual(linhas(lig({ de: "lê", para: "página", tipo: "lê" }, (d) => { delete d.vistas[0].nos; })), []);
  recusa(comVista("grafo", (d) => { d.vistas[0].ligacoes = "lê"; }), "vistas[0].ligacoes", /lista/);
});

test("camadas: de 2 a 6 camadas, cada nó numa só", () => {
  const cam = (n) => Array.from({ length: n }, (_, i) => ({ nome: `Camada ${i}`, nos: [["lê", "valida", "escreve", "modelo", "página"][i] ?? "lê"] }));
  recusa(comVista("camadas", (d) => { d.vistas[0].camadas = cam(1); }), "vistas[0].camadas", /2 a 6.*1/);
  recusa(comVista("camadas", (d) => { d.vistas[0].camadas = cam(7); }), "vistas[0].camadas", /2 a 6.*7/);
  assert.deepEqual(linhas(comVista("camadas", (d) => { d.vistas[0].camadas = cam(2); })), []);
  assert.deepEqual(linhas(comVista("camadas", (d) => { d.vistas[0].camadas = cam(5); d.vistas[0].ligacoes = []; })), []);
  const repetido = comVista("camadas", (d) => { d.vistas[0].camadas[1].nos = ["lê"]; });
  recusa(repetido, "vistas[0].camadas[1].nos[0]", /já está.*camadas\[0\]/);
  recusa(comVista("camadas", (d) => { d.vistas[0].camadas[0].nos = ["fantasma"]; }), "vistas[0].camadas[0].nos[0]", /não existe em nos/);
  recusa(comVista("camadas", (d) => { d.vistas[0].camadas[0].nome = ""; }), "vistas[0].camadas[0].nome");
  recusa(comVista("camadas", (d) => { d.vistas[0].camadas[0].nos = []; }), "vistas[0].camadas[0].nos", /pelo menos um/);
  // As ligações ficam dentro das camadas da vista.
  recusa(comVista("camadas", (d) => { d.vistas[0].ligacoes = [{ de: "lê", para: "modelo", tipo: "lê" }]; }), "vistas[0].ligacoes[0].para", /fora desta vista/);
});

test("sequencia: de 2 a 8 participantes e de 1 a 30 mensagens, entre os participantes", () => {
  recusa(comVista("sequencia", (d) => { d.vistas[0].participantes = ["lê"]; d.vistas[0].mensagens = [{ id: "m1", de: "lê", para: "lê", texto: "x" }]; }), "vistas[0].participantes", /2 a 8.*1/);
  const nove = Array.from({ length: 9 }, (_, i) => `p${i}`);
  const muitos = bom({ nos: nove.map((id) => no(id)), vistas: [{ id: "v1", tipo: "sequencia", titulo: "Muitos", participantes: nove, mensagens: [{ id: "m1", de: "p0", para: "p1", texto: "x" }] }], passos: [{ ...bom().passos[0], vista: "v1", realca: ["p0"] }] });
  recusa(muitos, "vistas[0].participantes", /2 a 8.*9/);
  const oito = copia(muitos);
  oito.vistas[0].participantes = nove.slice(0, 8);
  assert.deepEqual(linhas(oito), []);
  recusa(comVista("sequencia", (d) => { d.vistas[0].participantes = ["lê", "fantasma"]; }), "vistas[0].participantes[1]", /não existe em nos/);
  recusa(comVista("sequencia", (d) => { d.vistas[0].mensagens = []; }), "vistas[0].mensagens", /1 a 30.*0/);
  const msgs = (n) => Array.from({ length: n }, (_, i) => ({ id: `m${i + 1}`, de: "lê", para: "valida", texto: `Mensagem ${i + 1}` }));
  recusa(comVista("sequencia", (d) => { d.vistas[0].mensagens = msgs(31); }), "vistas[0].mensagens", /1 a 30.*31/);
  assert.deepEqual(linhas(comVista("sequencia", (d) => { d.vistas[0].mensagens = msgs(30); })), []);
  // `de` e `para` têm de ser participantes: «modelo» é um nó, mas não participa.
  recusa(comVista("sequencia", (d) => { d.vistas[0].mensagens[0].de = "modelo"; }), "vistas[0].mensagens[0].de", /participante/);
  recusa(comVista("sequencia", (d) => { d.vistas[0].mensagens[0].para = "nada"; }), "vistas[0].mensagens[0].para", /participante/);
  recusa(comVista("sequencia", (d) => { d.vistas[0].mensagens[0].texto = ""; }), "vistas[0].mensagens[0].texto");
  recusa(comVista("sequencia", (d) => { d.vistas[0].mensagens[0].id = ""; }), "vistas[0].mensagens[0].id");
});

test("estados: de 2 a 16 estados, inicial é um deles, transições entre eles", () => {
  const ids = Array.from({ length: 17 }, (_, i) => `e${i}`);
  const com = (n) => bom({
    nos: ids.slice(0, n).map((id) => no(id)),
    vistas: [{ id: "v1", tipo: "estados", titulo: "Ciclo", estados: ids.slice(0, n), inicial: "e0", transicoes: [{ de: "e0", para: "e1", evento: "avança" }] }],
    passos: [{ ...bom().passos[0], vista: "v1", realca: ["e0"] }],
  });
  recusa(com(1), "vistas[0].estados", /2 a 16.*1/);
  recusa(com(17), "vistas[0].estados", /2 a 16.*17/);
  assert.deepEqual(linhas(com(16)), []);
  recusa(comVista("estados", (d) => { d.vistas[0].inicial = "modelo"; }), "vistas[0].inicial", /um dos estados/);
  recusa(comVista("estados", (d) => { delete d.vistas[0].inicial; }), "vistas[0].inicial", /um dos estados/);
  recusa(comVista("estados", (d) => { d.vistas[0].estados = ["lê", "fantasma"]; }), "vistas[0].estados[1]", /não existe em nos/);
  recusa(comVista("estados", (d) => { d.vistas[0].transicoes[0].de = "modelo"; }), "vistas[0].transicoes[0].de", /estado/);
  recusa(comVista("estados", (d) => { d.vistas[0].transicoes[0].para = "nada"; }), "vistas[0].transicoes[0].para", /estado/);
  recusa(comVista("estados", (d) => { d.vistas[0].transicoes[0].evento = ""; }), "vistas[0].transicoes[0].evento");
  recusa(comVista("estados", (d) => { d.vistas[0].transicoes = "x"; }), "vistas[0].transicoes", /lista/);
  // `de` igual a `para` é permitido (já está no documento bom: valida → valida).
  assert.deepEqual(linhas(comVista("estados")), []);
});

test("linha-do-tempo: de 2 a 30 eventos, cada um com um nó e um quando", () => {
  const nos30 = Array.from({ length: 31 }, (_, i) => no(`t${i}`));
  const com = (n) => bom({
    nos: nos30,
    vistas: [{ id: "v1", tipo: "linha-do-tempo", titulo: "Tempo", eventos: nos30.slice(0, n).map((x, i) => ({ no: x.id, quando: `Dia ${i}` })) }],
    passos: [{ ...bom().passos[0], vista: "v1", realca: ["t0"] }],
  });
  recusa(com(1), "vistas[0].eventos", /2 a 30.*1/);
  recusa(com(31), "vistas[0].eventos", /2 a 30.*31/);
  assert.deepEqual(linhas(com(30)), []);
  assert.deepEqual(linhas(com(2)), []);
  recusa(comVista("linha-do-tempo", (d) => { d.vistas[0].eventos[0].no = "fantasma"; }), "vistas[0].eventos[0].no", /não existe em nos/);
  recusa(comVista("linha-do-tempo", (d) => { d.vistas[0].eventos[0].quando = ""; }), "vistas[0].eventos[0].quando");
  recusa(comVista("linha-do-tempo", (d) => { d.vistas[0].eventos = "x"; }), "vistas[0].eventos", /lista/);
});

test("cena: nos de 1 a 40, no máximo uma vista, e obriga a --cena (e --cena obriga a uma vista cena)", () => {
  const nos41 = Array.from({ length: 41 }, (_, i) => no(`c${i}`));
  const com = (n) => bom({
    nos: nos41,
    vistas: [{ id: "v1", tipo: "cena", titulo: "A cena", nos: nos41.slice(0, n).map((x) => x.id) }],
    passos: [{ ...bom().passos[0], vista: "v1", realca: ["c0"] }],
  });
  recusa(com(0), "vistas[0].nos", /1 a 40.*0/, CENA_BOA);
  recusa(com(41), "vistas[0].nos", /1 a 40.*41/, CENA_BOA);
  assert.deepEqual(linhas(com(40), CENA_BOA), []);
  recusa(comVista("cena", (d) => { d.vistas[0].nos = ["modelo", "fantasma"]; }), "vistas[0].nos[1]", /não existe em nos/, CENA_BOA);
  // Duas vistas cena.
  const duas = comVista("cena", (d) => { d.vistas.push({ ...VISTAS.cena(), id: "v2" }); });
  recusa(duas, "vistas[1]", /no máximo uma vista cena/, CENA_BOA);
  // Vista cena sem --cena.
  recusa(comVista("cena"), "vistas[0]", /obriga a --cena/);
  // --cena sem vista cena.
  recusa(bom(), "cena", /nenhuma vista/, CENA_BOA);
  assert.deepEqual(linhas(bom(), null), []);
});

// --- passos

test("passos: de 1 a 12, cada um com uma vista que existe e um realca com ids dessa vista", () => {
  recusa(bom({ passos: [] }), "passos", /1 a 12/);
  const p = bom().passos[0];
  recusa(bom({ passos: Array.from({ length: 13 }, () => copia(p)) }), "passos", /1 a 12.*13/);
  assert.deepEqual(linhas(bom({ passos: Array.from({ length: 12 }, () => copia(p)) })), []);
  const d = bom();
  d.passos[0].vista = "v9";
  recusa(d, "passos[0].vista", /não existe em vistas/);
  const e = bom();
  e.passos[0].realca = ["lê", "fantasma"];
  recusa(e, "passos[0].realca[1]", /não é um elemento da vista/);
  // «página» existe em nos mas não está na vista v1 (grafo com 4 nós): não se pode realçar nela.
  const f = bom();
  f.passos[0].realca = ["página"];
  recusa(f, "passos[0].realca[0]", /não é um elemento da vista/);
  recusa(bom({ passos: [{ ...p, realca: "lê" }] }), "passos[0].realca", /lista/);
  recusa(bom({ passos: [{ ...p, titulo: "" }] }), "passos[0].titulo");
});

test("o realca aceita nós e mensagens da vista, e só os dela", () => {
  const d = bom();
  d.passos[0].vista = "v2";
  d.passos[0].realca = ["lê", "m1", "m2", "escreve"];
  assert.deepEqual(linhas(d), []);
  // Uma mensagem da vista v2 não é elemento da vista v1.
  const e = bom();
  e.passos[0].realca = ["m1"];
  recusa(e, "passos[0].realca[0]", /não é um elemento da vista/);
  // Cada tipo de vista aceita o que realça (o que `REALCA` traz) e recusa um nó que não lhe pertence.
  for (const tipo of Object.keys(VISTAS)) {
    const x = comVista(tipo, (doc) => { doc.passos[0].realca = ["fantasma"]; });
    assert.ok(linhas(x, tipo === "cena" ? CENA_BOA : null).some((l) => l.startsWith("passos[0].realca[0]: ")), tipo);
  }
});

// --- citações

test("citacoes: pelo menos uma por passo, cada uma caminho:N, caminho:N-M (M a partir de N) ou URL de fontes", () => {
  const FORMA = /caminho:N ou caminho:N-M/;
  recusa(bom({ passos: [{ ...bom().passos[0], citacoes: [] }] }), "passos[0].citacoes", /pelo menos uma/);
  const semCampo = bom();
  delete semCampo.passos[0].citacoes;
  recusa(semCampo, "passos[0].citacoes", /lista/);
  recusa(bom({ passos: [{ ...bom().passos[0], citacoes: "a.mjs:1" }] }), "passos[0].citacoes", /lista/);
  for (const ruim of ["sem-linha", "ficheiro.mjs:", "ficheiro.mjs:abc", "ficheiro.mjs:0", "ficheiro.mjs:5-3", "ficheiro.mjs:1-", "ficheiro.mjs:1-2-3", ":10", "com espaço.mjs:10", 7]) {
    const d = bom();
    d.passos[0].citacoes = [ruim, "ok.mjs:1"];
    recusa(d, "passos[0].citacoes[0]", FORMA);
  }
  for (const boa of ["a.mjs:1", "pasta/a.mjs:12-30", "skills/agentic-explain/SKILL.md:7-7"]) {
    const d = bom();
    d.passos[0].citacoes = [boa];
    assert.deepEqual(linhas(d), [], boa);
  }
});

// O caminho de uma citação é relativo à raiz do que se leu: sem esquema, sem «/», «\» ou «~» no início e sem «..».
const CAMINHOS_FORA_DA_RAIZ = [
  "javascript:alert(1):1", "data:x:1", "/srv/x/a.js:1", "~/a.js:1", "../a.js:1", "a/../b.js:2", "C:\\a.js:1",
  "c:/x.mjs:4", "\\\\servidor\\a.js:1", "file:///etc/passwd:1", "a\\..\\b.js:3",
];
test("citacoes: o caminho é relativo à raiz (sem esquema, sem / \\ ~ no início, sem ..), em citacoes, ref e ficheiros", () => {
  const FORMA = /caminho:N ou caminho:N-M, com M a partir de N, com o caminho relativo à raiz \(sem esquema, sem \/ no início, sem \.\.\)/;
  for (const ruim of CAMINHOS_FORA_DA_RAIZ) {
    const a = bom();
    a.passos[0].citacoes = [ruim, "ok.mjs:1"];
    recusa(a, "passos[0].citacoes[0]", FORMA);
    const b = bom();
    b.vistas[0].ligacoes[0].ref = ruim;
    recusa(b, "vistas[0].ligacoes[0].ref", FORMA);
    const c = bom();
    c.nos[0].ficheiros = [ruim];
    recusa(c, "nos[0].ficheiros[0]", FORMA);
  }
  // Caracterização: o que é relativo continua a passar, e «..» só conta como segmento inteiro.
  for (const boa of ["src/a.ts:1-2", "a.js:3", "a/b..c.js:3", "..a.js:4", "a/~b.js:5", "pasta/.oculto/a.js:6"]) {
    const d = bom();
    d.passos[0].citacoes = [boa];
    d.vistas[0].ligacoes[0].ref = boa;
    d.nos[0].ficheiros = [boa];
    assert.deepEqual(linhas(d), [], boa);
  }
  // Os URLs de fontes continuam a ir pelo URL, e um URL nunca serve de caminho.
  assert.deepEqual(linhas(bomGeral()), []);
});

test("com tema codigo, cada passo cita pelo menos um caminho:N; com tema geral basta o URL", () => {
  const soUrl = bom({ passos: [{ ...bom().passos[0], citacoes: [FONTE] }], fontes: [{ url: FONTE, titulo: "DNS", lido_em: "2026-10-31" }] });
  recusa(soUrl, "passos[0].citacoes", /caminho:N/);
  const comUrlEcaminho = copia(soUrl);
  comUrlEcaminho.passos[0].citacoes = [FONTE, "a.mjs:3"];
  assert.deepEqual(linhas(comUrlEcaminho), []);
  assert.deepEqual(linhas(bomGeral()), []);
});

test("ref de uma ligação e ficheiros de um nó têm a forma caminho:N ou caminho:N-M", () => {
  const FORMA = /caminho:N ou caminho:N-M/;
  for (const ruim of ["sem-linha", "ficheiro.mjs:0", "ficheiro.mjs:5-3", "ficheiro.mjs:1-", "com espaço.mjs:10", 7, "https://example.org/x", "https://example.org:8080"]) {
    const a = bom();
    a.vistas[0].ligacoes[0].ref = ruim;
    recusa(a, "vistas[0].ligacoes[0].ref", FORMA);
    const b = bom();
    b.nos[0].ficheiros = [ruim];
    recusa(b, "nos[0].ficheiros[0]", FORMA);
  }
  for (const boa of ["a.mjs:1", "pasta/a.mjs:12-30"]) {
    const d = bom();
    d.vistas[0].ligacoes[0].ref = boa;
    d.nos[0].ficheiros = [boa, "b.mjs:2"];
    assert.deepEqual(linhas(d), [], boa);
  }
  const c = bom();
  c.nos[0].ficheiros = "a.mjs:1";
  recusa(c, "nos[0].ficheiros", /lista/);
});

// --- risco e modo

test("risco e modo só existem com perfil C", () => {
  const a = bom();
  a.nos[0].risco = "alto";
  recusa(a, "nos[0].risco", /só existe com perfil C/);
  const b = bom({ perfil: "A" });
  b.vistas[0].ligacoes[0].modo = "sincrona";
  recusa(b, "vistas[0].ligacoes[0].modo", /só existe com perfil C/);
  const m = bom({ perfil: "B" });
  m.vistas[1].mensagens[0].modo = "assincrona";
  recusa(m, "vistas[1].mensagens[0].modo", /só existe com perfil C/);
  // Com C, passam, e os valores vêm das listas.
  const c = bomC();
  const r = copia(c);
  r.nos[0].risco = "perigoso";
  recusa(r, "nos[0].risco", /baixo, medio ou alto/);
  const n = copia(c);
  n.vistas[0].ligacoes[0].modo = "paralela";
  recusa(n, "vistas[0].ligacoes[0].modo", /sincrona ou assincrona/);
  const o = copia(c);
  o.vistas[1].mensagens[0].modo = "paralela";
  recusa(o, "vistas[1].mensagens[0].modo", /sincrona ou assincrona/);
  assert.deepEqual(linhas(c), []);
});

// --- conceitos

test("conceitos: de 0 a 6", () => {
  const c = bom().conceitos[0];
  recusa(bom({ conceitos: Array.from({ length: 7 }, (_, i) => ({ ...c, termo: `t${i}` })) }), "conceitos", /0 a 6.*7/);
  assert.deepEqual(linhas(bom({ conceitos: Array.from({ length: 6 }, (_, i) => ({ ...c, termo: `t${i}` })) })), []);
  recusa(bom({ conceitos: [{ ...c, termo: "" }] }), "conceitos[0].termo");
  recusa(bom({ conceitos: "x" }), "conceitos", /lista/);
});

// --- segredos

test("sem segredos: recusa padrões óbvios de chave, em qualquer texto, e não os repete na saída", () => {
  const segredos = [
    "sk-test-abcdefghijkl",
    "ghp_abcdefghijklmnopqrstuvwxyz0123",
    "AKIA".padEnd(20, "X"),
    "-----BEGIN PRIVATE KEY",
    "-----BEGIN OPENSSH PRIVATE KEY",
    "github_pat_11ABCDEFG0abcdefghijkl",
    "xoxb-123456789-abcdef",
  ];
  const sitios = [
    ["intro.tecnico", (d, s) => { d.intro.tecnico = `Usa a chave ${s} no arranque.`; }],
    ["nos[0].simples", (d, s) => { d.nos[0].simples = s; }],
    ["passos[0].titulo", (d, s) => { d.passos[0].titulo = `Passo ${s}`; }],
    ["conceitos[0].termo", (d, s) => { d.conceitos[0].termo = s; }],
    ["pergunta", (d, s) => { d.pergunta = `Onde fica ${s}`; }],
    ["vistas[0].titulo", (d, s) => { d.vistas[0].titulo = s; }],
    ["vistas[1].mensagens[0].texto", (d, s) => { d.vistas[1].mensagens[0].texto = s; }],
  ];
  for (const s of segredos) {
    for (const [campo, poe] of sitios) {
      const d = bom();
      poe(d, s);
      recusa(d, campo, /chave ou um segredo/);
      assert.ok(linhas(d).every((l) => !l.includes(s)), "a saída repete o segredo");
    }
  }
});

test("um nome de campo com aspeto de chave dá um achado no objeto que o tem, sem o repetir nem descer por ele", () => {
  const MSG = "um nome de campo parece uma chave ou um segredo";
  const chaves = [
    "sk-test-ABCDEFGHIJKL",
    "ghp_abcdefghijklmnopqrstuvwxyz0123",
    "AKIA".padEnd(20, "X"),
    "-----BEGIN PRIVATE KEY",
    "github_pat_11ABCDEFG0abcdefghijkl",
    "xoxb-123456789-abcdef",
  ];
  const sitios = [
    ["nos[0]", (d, k, v) => { d.nos[0][k] = v; }],
    ["intro", (d, k, v) => { d.intro[k] = v; }],
    ["vistas[1].mensagens[0]", (d, k, v) => { d.vistas[1].mensagens[0][k] = v; }],
    ["conceitos[0]", (d, k, v) => { d.conceitos[0][k] = v; }],
    ["dados", (d, k, v) => { d[k] = v; }],
  ];
  for (const k of chaves) {
    for (const [campo, poe] of sitios) {
      const d = bom();
      poe(d, k, "um valor qualquer");
      assert.deepEqual(linhas(d), [`${campo}: ${MSG}`], `${campo} com a chave ${k.slice(0, 6)}…`);
      // Nenhum caminho de erro leva a chave, e o varrimento não desce por ela: o objeto de baixo fica por varrer.
      const fundo = bom();
      poe(fundo, k, { texto: "ghp_abcdefghijklmnopqrstuvwxyz0123", outro: { [k]: 1 } });
      assert.deepEqual(linhas(fundo), [`${campo}: ${MSG}`], `${campo}: desceu pela chave`);
    }
  }
  // Duas chaves suspeitas no mesmo objeto dão um só achado; as outras chaves do objeto continuam varridas.
  const duas = bom();
  duas.nos[0]["sk-test-ABCDEFGHIJKL"] = 1;
  duas.nos[0]["AKIA".padEnd(20, "X")] = 2;
  duas.nos[0].extra = "sk-test-abcdefghijkl";
  assert.deepEqual(linhas(duas), [`nos[0]: ${MSG}`, "nos[0].extra: parece conter uma chave ou um segredo; os dados levam só nomes de ficheiros, peças e explicações"]);
  // Caracterização: nomes de campo comuns, com hífen ou prefixo parecido, não são chaves.
  const comuns = bom();
  Object.assign(comuns.nos[0], { "risk-based": 1, "task-queue": 2, "sk-learn": 3, Akiapp: 4, ghp: 5, "x-ray": 6 });
  assert.deepEqual(linhas(comuns), []);
});

test("nenhuma outra mensagem repete um valor suspeito de segredo, e os valores repetidos vêm cortados", () => {
  const s = "sk-test-abcdefghijkl";
  // O valor suspeito cai numa regra que costuma repeti-lo («não existe em tipos», «repetido», «não existe em nos»).
  const casos = [
    (d) => { d.nos[1].tipo = s; },
    (d) => { d.nos[2].id = s; d.nos[3].id = s; },
    (d) => { d.vistas[0].ligacoes[0].de = s; },
    (d) => { d.passos[0].vista = s; },
    (d) => { d.passos[0].realca = [s]; },
    (d) => { d.passos[0].citacoes = [s]; },
    (d) => { d.vistas[0].nos = [s]; },
  ];
  for (const muda of casos) {
    const d = bom();
    muda(d);
    const r = linhas(d);
    assert.ok(r.length > 0);
    assert.ok(r.every((l) => !l.includes(s) && !l.includes("sk-test")), `repete o segredo:\n${r.join("\n")}`);
  }
  // Um valor comprido que não é segredo aparece cortado.
  const longo = bom();
  longo.nos[1].tipo = "x".repeat(300);
  const linha = linhas(longo).find((l) => l.startsWith("nos[1].tipo: "));
  assert.ok(linha && linha.length < 120, linha);
});

test("palavras comuns que contêm «sk-» ou «AKIA» não são segredos", () => {
  const d = bom();
  d.intro.simples = "Uma lógica risk-based, num task-runner, com nomes como Akiapp e sk-learn.";
  d.nos[0].tecnico = "A flag --risk-level e a função task-queue não são chaves.";
  assert.deepEqual(linhas(d), []);
});

test("várias regras violadas dão uma linha por regra, cada uma a começar pelo campo", () => {
  const d = bom({ versao: 3, perfil: "Z", titulo: "Um", passos: [] });
  const r = linhas(d);
  for (const campo of ["versao", "perfil", "titulo", "passos"]) assert.ok(r.some((l) => l.startsWith(`${campo}: `)), `falta ${campo}`);
  assert.equal(new Set(r).size, r.length, "linhas repetidas");
  assert.ok(r.every((l) => /^[\w.[\]]+: \S/.test(l)), r.join("\n"));
});

// --- a cena: as regras estáticas

// A cena boa com uma linha posta no lugar do corpo (a linha 3), para ver o número da linha na saída.
const comLinha = (texto, n = 3) => {
  const l = CENA_BOA.split("\n");
  l.splice(n - 1, 0, texto);
  return l.join("\n");
};
const cenaLinhas = (codigo) => validarCena(codigo);

test("uma cena boa passa", () => {
  assert.deepEqual(cenaLinhas(CENA_BOA), []);
  assert.deepEqual(cenaLinhas(`${CENA_BOA}\n`), []);
  assert.deepEqual(linhas(comVista("cena"), CENA_BOA), []);
});

test("a cena tem até 40 KB (em bytes) e function cena( declarada uma vez", () => {
  const enche = (bytes) => {
    const resto = bytes - Buffer.byteLength(`//\n${CENA_BOA}`, "utf8");
    return `//${"a".repeat(resto)}\n${CENA_BOA}`;
  };
  assert.equal(Buffer.byteLength(enche(40 * 1024), "utf8"), 40 * 1024);
  assert.deepEqual(cenaLinhas(enche(40 * 1024)), []);
  const grande = cenaLinhas(enche(40 * 1024 + 1));
  assert.equal(grande.length, 1);
  assert.match(grande[0], /^cena:1: .*40 KB/);
  // Conta bytes e não caracteres: 20481 «é» são 40962 bytes.
  const acentos = cenaLinhas(`//${"é".repeat(20481)}\n${CENA_BOA}`);
  assert.ok(acentos.some((l) => /^cena:1: .*40 KB/.test(l)), acentos.join("\n"));
  // function cena( ausente, ou declarada duas vezes.
  assert.match(cenaLinhas("const x = 1;")[0], /^cena:1: .*function cena\(/);
  assert.match(cenaLinhas("function cenario(ctx) {}")[0], /^cena:1: .*function cena\(/);
  const duas = cenaLinhas(`${CENA_BOA}\nfunction cena(ctx) {}`);
  assert.equal(duas.length, 1);
  assert.match(duas[0], /^cena:8: .*mais de uma vez/);
});

const PALAVRAS = [
  ["import", 'import * as X from "x";'],
  ["export", "export const a = 1;"],
  ["require", 'const m = require("x");'],
  ["fetch", "fetch(ctx);"],
  ["XMLHttpRequest", "const r = new XMLHttpRequest();"],
  ["WebSocket", "const s = new WebSocket(ctx);"],
  ["EventSource", "const s = new EventSource(ctx);"],
  ["eval", 'eval("1");'],
  ["Function(", 'const f = new Function("return 1");'],
  ["setInterval", "setInterval(ctx.animar, 10);"],
  ["requestAnimationFrame", "requestAnimationFrame(ctx.animar);"],
  ["localStorage", 'localStorage.setItem("a", "b");'],
  ["sessionStorage", 'sessionStorage.getItem("a");'],
  ["indexedDB", 'indexedDB.open("a");'],
  ["cookie", "const c = ctx.cookie;"],
  ["innerHTML", 'ctx.rotulo("x").innerHTML = "y";'],
  ["outerHTML", "const h = ctx.cena.outerHTML;"],
  ["insertAdjacentHTML", 'ctx.cena.insertAdjacentHTML("beforeend", "y");'],
  ["document.write", 'document.write("x");'],
  ["window.open", 'window.open("x");'],
  ["location", "const l = location.href;"],
  ["navigator", "const n = navigator.userAgent;"],
  ["postMessage", 'postMessage("x");'],
  ["Worker", 'const w = new Worker("w");'],
];

// «document.write» e «window.open» levam também a palavra «document» ou «window», que é proibida por si.
const COM_PALAVRA_MAE = { "document.write": "document", "window.open": "window" };

test("cada palavra proibida na cena é recusada com a sua linha, e só ela", () => {
  assert.equal(PALAVRAS.length, 24, "a spec lista 24 palavras antigas");
  for (const [palavra, codigo] of PALAVRAS) {
    const r = cenaLinhas(comLinha(codigo));
    const esperadas = [palavra, COM_PALAVRA_MAE[palavra]].filter(Boolean);
    assert.equal(r.length, esperadas.length, `${palavra}:\n${r.join("\n")}`);
    assert.ok(r.every((l) => l.startsWith("cena:3: ")), r.join("\n"));
    for (const e of esperadas) assert.ok(r.some((l) => l.includes(`«${e}»`)), `${palavra}: falta «${e}» em\n${r.join("\n")}`);
  }
});

// As palavras acrescentadas à cena: o acesso à janela, ao documento e ao objeto global, e ao que chega ao construtor.
const PALAVRAS_NOVAS = [
  ["window", "const w = window;"],
  ["document", "const d = document;"],
  ["globalThis", "const g = globalThis;"],
  ["self", "const s = self;"],
  ["constructor", "const c = ctx.constructor;"],
  ["Reflect", "Reflect.get(ctx, 'x');"],
  ["opener", "const o = opener;"],
  ["frames", "const f = frames[0];"],
];

test("window, document, globalThis, self, constructor, Reflect, opener e frames são recusados, só como palavra inteira", () => {
  assert.equal(PALAVRAS_NOVAS.length, 8);
  for (const [palavra, codigo] of PALAVRAS_NOVAS) {
    const r = cenaLinhas(comLinha(codigo));
    assert.equal(r.length, 1, `${palavra}:\n${r.join("\n")}`);
    assert.match(r[0], /^cena:3: /);
    assert.ok(r[0].includes(`«${palavra}»`), `${palavra}: ${r[0]}`);
  }
  // Também nos comentários e nas cadeias, e ao fim de um ponto.
  assert.equal(cenaLinhas(comLinha("// a window não é da cena")).length, 1);
  assert.equal(cenaLinhas(comLinha('const t = "document";')).length, 1);
  assert.equal(cenaLinhas(comLinha("const w = ctx.window;")).length, 1);
  // Caracterização: parent, top e this ficam permitidos (o three.js usa obj.parent), e as palavras parecidas passam.
  const permitido = [
    "ctx.cena.add(caixa); caixa.parent.add(caixa); const topo = 1, top = 2; this.x = 1;",
    "const selfie = 1, windows = 2, documentos = 3, frame = 4, openers = 5, Reflection = 6, constructors = 7, globalThisArg = 8;",
  ];
  for (const codigo of permitido) assert.deepEqual(cenaLinhas(comLinha(codigo)), [], codigo);
  assert.deepEqual(cenaLinhas(readFileSync(path.join(AQUI, "..", "assets", "exemplos", "geral-a.cena.js"), "utf8")), []);
});

test("as sequências de escape \\u e \\x são recusadas em qualquer sítio do texto, sem repetir o que escondem", () => {
  const casos = [
    ["\\u", 'const s = "\\u0066etch";'],
    ["\\u", "const s = '\\u{66}etch';"],
    ["\\u", "const s = `\\u0077indow`;"],
    ["\\x", 'const s = "\\x66etch";'],
    ["\\u", "// um comentário com \\u0041"],
    ["\\x", "const re = /\\x41/;"],
    ["\\x", "const n = ctx.\\x66;"],
  ];
  for (const [escape, codigo] of casos) {
    const r = cenaLinhas(comLinha(codigo));
    assert.equal(r.length, 1, `${codigo}:\n${r.join("\n")}`);
    assert.match(r[0], /^cena:3: /);
    assert.ok(r[0].includes(`«${escape}»`), `${codigo}: ${r[0]}`);
    assert.ok(!r[0].includes("0066") && !r[0].includes("etch"), `repete o que achou: ${r[0]}`);
  }
  // Uma barra seguida de outra letra, e o «u» ou o «x» sem barra, passam.
  assert.deepEqual(cenaLinhas(comLinha('const s = "a\\nb\\tc", u = 1, x = 2, ux = "ux";')), []);
});

test("as regras estáticas correm sobre o texto todo: uma regra partida entre linhas é achada na linha onde começa", () => {
  const partidas = [
    ["window.open", 'function cena(ctx) {\n  window\n  .open("x");\n}', 2],
    ["document.write", 'function cena(ctx) {\n  document.\n  write("x");\n}', 2],
    ["Function(", 'function cena(ctx) {\n  new Function\n  ("return 1");\n}', 2],
    ["Function(", 'function cena(ctx) {\n\n  Function\n\n\n  (1);\n}', 3],
    ["Function(", 'function cena(ctx) {\r\n  Function\r\n  ("return 1");\r\n}', 2],
    ["cor literal", 'function cena(ctx) {\n  const c = rgb\n  (1, 2, 3);\n}', 2],
    ["cor literal", 'function cena(ctx) {\n  const c = hsla\n\n  (1, 2, 3, 1);\n}', 2],
  ];
  for (const [regra, codigo, linha] of partidas) {
    const r = cenaLinhas(codigo);
    assert.ok(r.length >= 1, `${regra}: não achou nada`);
    assert.ok(r.every((l) => l.startsWith(`cena:${linha}: `)), `${regra}: devia ser na linha ${linha}\n${r.join("\n")}`);
    assert.ok(r.some((l) => l.includes(regra === "cor literal" ? "ctx.cores" : `«${regra}»`)), `${regra}:\n${r.join("\n")}`);
  }
});

test("um achado por regra e por linha, ordenados por linha", () => {
  // Duas vezes a mesma regra na mesma linha dão uma só linha de saída.
  assert.equal(cenaLinhas(comLinha("fetch(a); fetch(b);")).length, 1);
  // Dois achados que começam na mesma linha, um deles partido a meio, também dão um só.
  const mesmaLinha = cenaLinhas(comLinha("window.open(1); window\n  .open(2);"));
  assert.deepEqual(mesmaLinha.filter((l) => l.includes("«window.open»")).map((l) => l.slice(0, 7)), ["cena:3:"]);
  // Regras diferentes na mesma linha dão uma linha cada; linhas diferentes saem por ordem.
  const codigo = ["function cena(ctx) {", "  eval(1);", "  window", "  .open(1);", '  const c = "#fff"; fetch(1);', "  eval(2);", "}"].join("\n");
  const r = cenaLinhas(codigo);
  const numeros = r.map((l) => Number(/^cena:(\d+): /.exec(l)[1]));
  assert.deepEqual(numeros, [...numeros].sort((a, b) => a - b), r.join("\n"));
  assert.deepEqual([...new Set(numeros)], [2, 3, 5, 6]);
  assert.equal(r.filter((l) => l.startsWith("cena:3: ")).length, 2, "window e window.open");
  assert.equal(r.filter((l) => l.startsWith("cena:5: ")).length, 2, "cor e fetch");
  assert.equal(new Set(r).size, r.length, "linhas repetidas");
});

test("as palavras proibidas valem também nos comentários e nas cadeias, mas só como palavra inteira", () => {
  assert.equal(cenaLinhas(comLinha("// o fetch não é permitido")).length, 1);
  assert.equal(cenaLinhas(comLinha('const t = "location";')).length, 1);
  const parecidas = "const importante = 1, evaluate = 2, relocation = 3, cookies = 4, exportar = 5, workers = 6, fetched = 7;";
  assert.deepEqual(cenaLinhas(comLinha(parecidas)), []);
  assert.deepEqual(cenaLinhas(comLinha("const Functions = 1; ctx.cores.realce;")), []);
});

test("</script, <!-- e os endereços http:// e https:// são recusados, sem repetir o endereço", () => {
  const casos = [
    ["</script", "const a = '</script>';"],
    ["</script", "const a = '</SCRIPT>';"],
    ["<!--", "const a = '<!-- x';"],
    ["http://", "const a = 'http://exemplo.invalido/x?token=abc';"],
    ["https://", "const a = 'https://exemplo.invalido/x?token=abc';"],
    ["https://", "const a = 'HTTPS://exemplo.invalido/x';"],
  ];
  for (const [marca, codigo] of casos) {
    const r = cenaLinhas(comLinha(codigo));
    assert.equal(r.length, 1, `${marca}:\n${r.join("\n")}`);
    assert.match(r[0], /^cena:3: /);
    assert.ok(!r[0].includes("exemplo.invalido") && !r[0].includes("token"), `repete o endereço: ${r[0]}`);
  }
});

test("as cores literais são recusadas (#rgb, #rrggbb, 0xrrggbb, rgb(, hsl(), e as de ctx.cores passam", () => {
  const literais = [
    'const a = "#fff";',
    'const a = "#1a2B3c";',
    'const a = "#abcd";',
    'const a = "#11223344";',
    "const a = 0xff0000;",
    "const a = 0XFF00aa;",
    'const a = "rgb(1, 2, 3)";',
    'const a = "rgba(1, 2, 3, .5)";',
    'const a = "hsl(10, 20%, 30%)";',
    'const a = "hsla(10, 20%, 30%, .5)";',
    "// a cor #fff está proibida até em comentários",
  ];
  for (const codigo of literais) {
    const r = cenaLinhas(comLinha(codigo));
    assert.equal(r.length, 1, `${codigo}:\n${r.join("\n")}`);
    assert.match(r[0], /^cena:3: .*ctx\.cores/);
  }
  // O que parece cor e não é: número hexadecimal curto, «#» com 2 ou 5 dígitos, e as cores do ctx.
  const passa = ['const a = 0xff, b = 0x12345, c = "#12", d = "#12345";', "const e = ctx.cores.serie[0], f = ctx.cores.risco.alto;"];
  for (const codigo of passa) assert.deepEqual(cenaLinhas(comLinha(codigo)), [], codigo);
});

test("cada violação dá uma linha cena:<linha>, em linhas diferentes, por ordem", () => {
  const codigo = comLinha('const b = "#fff"; fetch(ctx);', 2).replace("  ctx.cena.add(caixa);", "  ctx.cena.add(caixa); eval(1);");
  const r = cenaLinhas(codigo);
  assert.deepEqual(r.map((l) => l.split(":").slice(0, 2).join(":")), ["cena:2", "cena:2", "cena:5"]);
  assert.ok(r.every((l) => /^cena:\d+: \S/.test(l)));
  assert.deepEqual(cenaLinhas(42).length, 1);
});

// --- a página

const BLOCO = /(<script type="application\/json" id="dados">)([\s\S]*?)(<\/script>)/;
const CENA_CODIGO = /<script id="cena-codigo">([\s\S]*?)<\/script>/;
// O que o gerador escreve no <script id="cena-codigo">: o código da cena dentro de uma função estrita chamada sem this,
// para o topo do ficheiro não criar globais nem ver a janela no this.
const blocoDaCena = (cena) => `window.explainCena = (function () {\n"use strict";\n${cena}\nreturn cena;\n}).call(undefined);`;

test("um </script> num texto sai escapado na página e o JSON reparsa igual", () => {
  const d = bom();
  d.nos[0].tecnico = "Um comentário `// </script><script>alert(1)</script>` e `<!-- x -->` no código.";
  d.pergunta = "E se o texto tiver </script> e <b>HTML</b> & entidades &amp;?";
  assert.deepEqual(linhas(d), []);
  const pagina = gerarPagina(d, { modelo: MODELO_FIXTURE });
  const m = BLOCO.exec(pagina);
  assert.ok(m, "a página perdeu o bloco de dados");
  assert.ok(!m[2].includes("<"), "o bloco de dados leva um < sem escape");
  assert.ok(m[2].includes("\\u003c/script>"), "o </script> do texto devia sair como \\u003c/script>");
  assert.deepEqual(JSON.parse(m[2]), d);
  // O resto da página não ganhou nem perdeu nenhum fecho de script.
  assert.equal(pagina.split("</script>").length, MODELO_FIXTURE.split("</script>").length);
});

test("o título com < e & sai escapado no <title>, e o marcador desaparece", () => {
  const pagina = gerarPagina(bom({ titulo: "O <b> & 'c'" }), { modelo: MODELO_FIXTURE });
  assert.equal(/<title>([^]*?)<\/title>/.exec(pagina)[1], "O &lt;b&gt; &amp; &#39;c&#39;");
  assert.equal(/<title>([^]*?)<\/title>/.exec(gerarPagina(bom({ titulo: 'Um "dois"' }), { modelo: MODELO_FIXTURE }))[1], "Um &quot;dois&quot;");
  assert.equal(pagina.split("<title>").length, 2, "mais de um <title>");
  assert.ok(!pagina.includes("{{titulo}}"), "o marcador ficou na página");
});

test("os padrões de substituição do JavaScript ($&, $1) saem como estão, nos dados e na cena", () => {
  const d = bom({ titulo: "Custa $& e $1" });
  d.nos[0].simples = "O símbolo $& e $' e $` não mudam.";
  const cena = `${CENA_BOA}\n// custa $& e $' e $\``;
  const pagina = gerarPagina(d, { modelo: MODELO_FIXTURE, cena });
  assert.match(pagina, /<title>Custa \$&amp; e \$1<\/title>/);
  assert.deepEqual(JSON.parse(BLOCO.exec(pagina)[2]), d);
  assert.equal(CENA_CODIGO.exec(pagina)[1], blocoDaCena(cena));
});

test("a cena entra no <script id=\"cena-codigo\"> do modelo, dentro de uma função estrita, e window.explainCena recebe-a", () => {
  const pagina = gerarPagina(comVista("cena"), { modelo: MODELO_FIXTURE, cena: CENA_BOA });
  assert.equal(CENA_CODIGO.exec(pagina)[1], blocoDaCena(CENA_BOA));
  assert.equal(pagina.split('id="cena-codigo"').length, 2);
  // Sem cena, o lugar fica vazio.
  const sem = gerarPagina(bom(), { modelo: MODELO_FIXTURE });
  assert.equal(CENA_CODIGO.exec(sem)[1], "");
  // Um modelo sem lugar para a cena só serve sem cena.
  assert.doesNotThrow(() => gerarPagina(bom(), { modelo: MODELO_SEM_CENA }));
  assert.throws(() => gerarPagina(comVista("cena"), { modelo: MODELO_SEM_CENA, cena: CENA_BOA }), /o modelo não tem lugar para a cena/);
});

test("o topo da cena não cria globais nem vê a janela no this, e o código continua em modo estrito", () => {
  const cena = [
    "var solto = 1;",
    "const visto = this;",
    "function auxiliar() { return 2; }",
    "function cena(ctx) { return [solto + auxiliar(), visto, this]; }",
  ].join("\n");
  const pagina = gerarPagina(comVista("cena"), { modelo: MODELO_FIXTURE, cena });
  const janela = {};
  const contexto = vm.createContext({ window: janela });
  vm.runInContext(CENA_CODIGO.exec(pagina)[1], contexto);
  assert.equal(typeof janela.explainCena, "function");
  assert.deepEqual(Object.keys(contexto), ["window"], "o topo da cena criou globais");
  assert.deepEqual(Object.keys(janela), ["explainCena"], "a cena só entrega a função");
  // A moldura chama-a sem this: nem o topo nem a função veem a janela.
  const r = janela.explainCena.call(undefined, {});
  assert.equal(r[0], 3);
  assert.equal(r[1], undefined, "o this do topo do ficheiro");
  assert.equal(r[2], undefined, "o this dentro da cena");
  // Estrito: uma atribuição a um nome por declarar lança em vez de criar um global.
  const solta = gerarPagina(comVista("cena"), { modelo: MODELO_FIXTURE, cena: "function cena(ctx) { novo = 1; }" });
  const j2 = {};
  vm.runInContext(CENA_CODIGO.exec(solta)[1], vm.createContext({ window: j2 }));
  assert.throws(() => j2.explainCena.call(undefined, {}), (e) => e.name === "ReferenceError");
});

test("o modelo sem os marcadores de dados ou de título não gera nada", () => {
  assert.throws(() => gerarPagina(bom(), { modelo: MODELO_FIXTURE.replace('id="dados"', 'id="outro"') }), /bloco/);
  assert.throws(() => gerarPagina(bom(), { modelo: MODELO_FIXTURE.replace("{{titulo}}", "x") }), /<title>/);
});

// --- linha de comandos

function correr(args, { script = SCRIPT } = {}) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  return { status: r.status, out: r.stdout, err: r.stderr };
}
function pasta(t) {
  const p = mkdtempSync(path.join(tmpdir(), "gerar-pagina-"));
  t.after(() => rmSync(p, { recursive: true, force: true }));
  return p;
}
// Uma cópia do script ao lado de um modelo à escolha: o script procura o modelo em ../assets/visualizador.html.
function comModelo(t, modelo) {
  const raiz = pasta(t);
  mkdirSync(path.join(raiz, "scripts"));
  mkdirSync(path.join(raiz, "assets"));
  copyFileSync(SCRIPT, path.join(raiz, "scripts", "gerar-pagina.mjs"));
  writeFileSync(path.join(raiz, "assets", "visualizador.html"), modelo);
  return path.join(raiz, "scripts", "gerar-pagina.mjs");
}
const escreve = (p, nome, conteudo) => {
  const f = path.join(p, nome);
  writeFileSync(f, typeof conteudo === "string" ? conteudo : JSON.stringify(conteudo));
  return f;
};

test("sai 0 e escreve a página", (t) => {
  const p = pasta(t);
  const dados = escreve(p, "d.json", bom());
  const saida = path.join(p, "pagina.html");
  const script = comModelo(t, MODELO_FIXTURE);
  const r = correr([dados, "--saida", saida], { script });
  assert.equal(r.status, 0, r.err);
  const html = readFileSync(saida, "utf8");
  assert.match(html, /<title>Gerador de páginas<\/title>/);
  assert.deepEqual(JSON.parse(BLOCO.exec(html)[2]), bom());
  assert.equal(CENA_CODIGO.exec(html)[1], "", "sem --cena o lugar da cena fica vazio");
  // A ordem dos argumentos é livre.
  const outra = path.join(p, "outra.html");
  assert.equal(correr(["--saida", outra, dados], { script }).status, 0);
  assert.ok(existsSync(outra));
});

test("sai 0 com --cena e a cena entra na página", (t) => {
  const p = pasta(t);
  const dados = escreve(p, "d.json", comVista("cena"));
  const cena = escreve(p, "cena.js", CENA_BOA);
  const saida = path.join(p, "pagina.html");
  const r = correr([dados, "--cena", cena, "--saida", saida], { script: comModelo(t, MODELO_FIXTURE) });
  assert.equal(r.status, 0, r.err);
  assert.equal(CENA_CODIGO.exec(readFileSync(saida, "utf8"))[1], blocoDaCena(CENA_BOA));
  // Com a opção antes do ficheiro de dados.
  const outra = path.join(p, "outra.html");
  assert.equal(correr(["--cena", cena, dados, "--saida", outra], { script: comModelo(t, MODELO_FIXTURE) }).status, 0);
});

test("sai 0 com o modelo real e um documento sem cena", (t) => {
  const p = pasta(t);
  const saida = path.join(p, "pagina.html");
  const r = correr([escreve(p, "d.json", bom()), "--saida", saida]);
  assert.equal(r.status, 0, r.err);
  const html = readFileSync(saida, "utf8");
  assert.match(html, /<title>Gerador de páginas<\/title>/);
  assert.deepEqual(JSON.parse(BLOCO.exec(html)[2]), bom());
});

test("corre também por uma ligação simbólica (o install.sh --ligar), e não sai 0 sem escrever", (t) => {
  const p = pasta(t);
  const ligacao = path.join(p, "skill-ligada");
  symlinkSync(path.join(AQUI, ".."), ligacao);
  const saida = path.join(p, "pagina.html");
  const r = correr([escreve(p, "d.json", bom()), "--saida", saida], { script: path.join(ligacao, "scripts", "gerar-pagina.mjs") });
  assert.equal(r.status, 0, r.err);
  assert.ok(existsSync(saida), "saiu 0 e não escreveu a página");
  // E os dados inválidos continuam a sair 1 por essa ligação.
  assert.equal(correr([escreve(p, "mau.json", bom({ versao: 1 })), "--saida", path.join(p, "x.html")], { script: path.join(ligacao, "scripts", "gerar-pagina.mjs") }).status, 1);
});

test("sai 1 com uma linha por regra violada e não cria o ficheiro de saída", (t) => {
  const p = pasta(t);
  const dados = escreve(p, "d.json", bom({ versao: 3, titulo: "Um", passos: [] }));
  const saida = path.join(p, "pagina.html");
  const script = comModelo(t, MODELO_FIXTURE);
  const r = correr([dados, "--saida", saida], { script });
  assert.equal(r.status, 1);
  const l = r.err.trim().split("\n");
  assert.equal(l.length, 3, r.err);
  assert.ok(l.every((x) => /^[\w.[\]]+: \S/.test(x)), r.err);
  assert.ok(!existsSync(saida), "o ficheiro de saída foi criado");
  // E um ficheiro que já lá estava fica como estava.
  writeFileSync(saida, "antigo");
  assert.equal(correr([dados, "--saida", saida], { script }).status, 1);
  assert.equal(readFileSync(saida, "utf8"), "antigo");
});

test("sai 1 com as linhas cena:<linha> quando a cena viola uma regra, e não cria o ficheiro", (t) => {
  const p = pasta(t);
  const dados = escreve(p, "d.json", comVista("cena"));
  const cena = escreve(p, "cena.js", comLinha('const x = "#fff"; fetch(ctx);'));
  const saida = path.join(p, "pagina.html");
  const r = correr([dados, "--cena", cena, "--saida", saida], { script: comModelo(t, MODELO_FIXTURE) });
  assert.equal(r.status, 1);
  const l = r.err.trim().split("\n");
  assert.equal(l.length, 2, r.err);
  assert.ok(l.every((x) => /^cena:3: \S/.test(x)), r.err);
  assert.ok(!existsSync(saida));
});

test("sai 1 com --cena sem vista cena, e com vista cena sem --cena", (t) => {
  const p = pasta(t);
  const script = comModelo(t, MODELO_FIXTURE);
  const saida = path.join(p, "pagina.html");
  const cena = escreve(p, "cena.js", CENA_BOA);
  const semVista = correr([escreve(p, "a.json", bom()), "--cena", cena, "--saida", saida], { script });
  assert.equal(semVista.status, 1);
  assert.match(semVista.err, /^cena: .*nenhuma vista/m);
  const semCena = correr([escreve(p, "b.json", comVista("cena")), "--saida", saida], { script });
  assert.equal(semCena.status, 1);
  assert.match(semCena.err, /^vistas\[0\]: .*obriga a --cena/m);
  assert.ok(!existsSync(saida));
});

test("sai 2 em erro de uso ou de leitura", (t) => {
  const p = pasta(t);
  const d = escreve(p, "d.json", bom());
  const cena = escreve(p, "cena.js", CENA_BOA);
  const saida = path.join(p, "pagina.html");
  escreve(p, "mau.json", "{ não é json");
  const casos = [
    [[], "sem argumentos"],
    [[d], "sem --saida"],
    [["--saida", saida], "sem ficheiro de dados"],
    [[d, "--saida"], "--saida sem valor"],
    [[d, "--cena", "--saida", saida], "--cena sem valor"],
    [[d, "--saida", saida, "--cena"], "--cena no fim, sem valor"],
    [[d, "--cena", cena, "--cena", cena, "--saida", saida], "duas cenas"],
    [[d, "--saida", saida, "--extra"], "opção desconhecida"],
    [[d, "outro.json", "--saida", saida], "dois ficheiros de dados"],
    [[path.join(p, "nao-existe.json"), "--saida", saida], "ficheiro de dados em falta"],
    [[path.join(p, "mau.json"), "--saida", saida], "JSON inválido"],
    [[p, "--saida", saida], "dados é uma pasta"],
    [[d, "--cena", path.join(p, "nao-existe.js"), "--saida", saida], "ficheiro de cena em falta"],
    [[d, "--cena", p, "--saida", saida], "cena é uma pasta"],
  ];
  for (const [args, nome] of casos) {
    const r = correr(args);
    assert.equal(r.status, 2, `${nome}: saiu ${r.status}\n${r.err}`);
    assert.ok(r.err.trim().length > 0, `${nome}: sem mensagem`);
    assert.ok(!existsSync(saida), `${nome}: criou a saída`);
  }
});

test("sai 2 com um JSON inválido sem repetir nada do ficheiro, e um erro de leitura mantém o seu código", (t) => {
  const p = pasta(t);
  const saida = path.join(p, "pagina.html");
  // Um valor com cara de chave num JSON partido: o texto do JSON.parse citaria um bocado do ficheiro.
  const mau = escreve(p, "mau.json", '{"x": sk-test-ABCDEFGHIJKLMNOP}');
  const r = correr([mau, "--saida", saida]);
  assert.equal(r.status, 2, r.err);
  assert.equal(r.err.trim(), `gerar-pagina: ${mau} não é JSON válido`);
  assert.ok(!r.err.includes("ABCDEFGH") && !r.err.includes("sk-test") && !r.err.includes("Unexpected"), r.err);
  assert.ok(!existsSync(saida));
  // Também quando o JSON está truncado a meio de um texto com dados de pessoas.
  const truncado = escreve(p, "truncado.json", '{"intro": {"simples": "O utente Fulano de Tal, nif 123456789');
  const t2 = correr([truncado, "--saida", saida]);
  assert.equal(t2.status, 2);
  assert.equal(t2.err.trim(), `gerar-pagina: ${truncado} não é JSON válido`);
  // Um erro de leitura continua a dizer o código do erro (que não traz conteúdo).
  const falta = correr([path.join(p, "nao-existe.json"), "--saida", saida]);
  assert.equal(falta.status, 2);
  assert.match(falta.err, /ENOENT/);
  const pastaComoDados = correr([p, "--saida", saida]);
  assert.equal(pastaComoDados.status, 2);
  assert.match(pastaComoDados.err, /não consegui ler/);
});

test("sai 2 com «o modelo não tem lugar para a cena» quando o modelo não tem o <script id=\"cena-codigo\">", (t) => {
  const p = pasta(t);
  const dados = escreve(p, "d.json", comVista("cena"));
  const cena = escreve(p, "cena.js", CENA_BOA);
  const saida = path.join(p, "pagina.html");
  const r = correr([dados, "--cena", cena, "--saida", saida], { script: comModelo(t, MODELO_SEM_CENA) });
  assert.equal(r.status, 2, r.err);
  assert.match(r.err, /o modelo não tem lugar para a cena/);
  assert.ok(!existsSync(saida));
  // Sem cena, o mesmo modelo serve.
  assert.equal(correr([escreve(p, "b.json", bom()), "--saida", saida], { script: comModelo(t, MODELO_SEM_CENA) }).status, 0);
});

// --- o modelo real

// O CSP do modelo fecha a rede: só o jsDelivr carrega código, e nenhum pedido sai da página (nem fetch, nem imagens,
// nem frames, nem workers, nem formulários). Não cobre a navegação nem o WebRTC. Fixa-se o texto exato para que
// ninguém o alargue sem o teste o dizer.
const CSP = "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net ; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; base-uri 'none'; form-action 'none'";
const META_CSP = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/g;

test("o modelo real fecha a rede com o CSP aprovado, antes de qualquer <script> e <style>", () => {
  const m = readFileSync(MODELO, "utf8");
  const metas = [...m.matchAll(META_CSP)];
  assert.equal(metas.length, 1, "um só <meta> de CSP");
  assert.equal(metas[0][1], CSP);
  const primeiro = Math.min(...["<script", "<style"].map((t) => m.indexOf(t)).filter((i) => i >= 0));
  assert.ok(metas[0].index < primeiro, "o CSP vem antes do primeiro <script> ou <style>");
});

// O 3d-force-graph é um ficheiro só: carrega com a soma de verificação (SRI) e crossOrigin anónimo, e o browser
// recusa-o se o jsDelivr o servir diferente. Os módulos do three ficam sem hash: os +esm do jsDelivr são gerados
// pelo serviço e o hash não é garantido.
const SRI_GRAFO = "sha384-i98VDQKdpyVrtyuFn0fjUWJBLBmxnqHqOANcvYe9HLJUgT2wPixa4ZkLd7Dh3VEk";

test("o modelo real carrega o 3d-force-graph com integrity e crossOrigin, com o hash ao lado do endereço", () => {
  const m = readFileSync(MODELO, "utf8");
  const ao_lado = new RegExp(`grafo: 'https://cdn\\.jsdelivr\\.net/npm/3d-force-graph@1\\.80\\.1/dist/3d-force-graph\\.min\\.js',\\s*grafoSri: '${SRI_GRAFO}',`);
  assert.match(m, ao_lado);
  assert.match(m, /s\.src = URLS\.grafo;\s*s\.integrity = URLS\.grafoSri;\s*s\.crossOrigin = 'anonymous';/);
  assert.equal(m.split(SRI_GRAFO).length, 2, "o hash aparece uma só vez");
  // Os módulos do three não levam hash, e o modelo diz porquê.
  assert.doesNotMatch(m, /three:[^\n]*sha384|orbit:[^\n]*sha384|css2d:[^\n]*sha384/);
  assert.match(m, /\+esm[^\n]*gerados pelo serviço|gerados pelo serviço[^\n]*\+esm/);
});

test("cada endereço http(s) literal do modelo está na lista aprovada", () => {
  // A origem do jsDelivr dentro do CSP fica de fora: o teste do CSP fixa-a.
  const m = readFileSync(MODELO, "utf8").replace(META_CSP, "");
  const APROVADOS = [
    "https://cdn.jsdelivr.net/npm/3d-force-graph@1.80.1/dist/3d-force-graph.min.js",
    "https://cdn.jsdelivr.net/npm/three@0.186.1/+esm",
  ];
  const ADDONS = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.186\.1\/examples\/jsm\/[A-Za-z0-9/_.-]+\.js\/\+esm$/;
  const achados = [...m.matchAll(/https?:\/\/[^\s"'<>)`]+/g)].map((x) => x[0]);
  assert.ok(achados.length > 0, "o modelo devia carregar pelo menos uma biblioteca");
  const fora = achados.filter((u) => !APROVADOS.includes(u) && !ADDONS.test(u));
  assert.deepEqual(fora, [], "endereço externo fora da lista aprovada");
});

test("o modelo real tem um só bloco de dados e o marcador do título", () => {
  const m = readFileSync(MODELO, "utf8");
  assert.equal([...m.matchAll(/<script type="application\/json" id="dados">/g)].length, 1);
  assert.equal([...m.matchAll(/<title>\{\{titulo\}\}<\/title>/g)].length, 1);
});

// --- os exemplos de assets/exemplos/

// Os exemplos são dados já válidos: mostram o esquema 2 em acção e servem de ponto de partida. Se o esquema ou as
// regras mudarem e um exemplo deixar de passar, este é o teste que o diz. As citações dos exemplos de código estão
// fixadas no `base` que cada um traz; aqui só se confere que os caminhos existem no repo.
import vm from "node:vm"; // só os testes dos exemplos o usam

const EXEMPLOS = path.join(AQUI, "..", "assets", "exemplos");
const RAIZ_REPO = path.join(AQUI, "..", "..", "..");
const exemplo = (nome) => readFileSync(path.join(EXEMPLOS, nome), "utf8");
const dadosDe = (nome) => JSON.parse(exemplo(nome));
const CAMINHO_LINHAS = /^(.+?):(\d+)(?:-(\d+))?$/;

// Um objeto que aceita tudo (propriedades, chamadas e construtores): corre a cena sem o three.js, para provar o que
// ela regista e que o seu movimento não lança. O desenho em si vê-se no browser.
function qualquerCoisa() {
  const p = new Proxy(function () {}, {
    get: (_, k) => (k === Symbol.toPrimitive ? () => 0 : p),
    set: () => true,
    apply: () => p,
    construct: () => p,
  });
  return p;
}

function correrCena(codigo, { movimentoReduzido = false } = {}) {
  const janela = {};
  vm.runInNewContext(blocoDaCena(codigo), { window: janela }); // o bloco que o gerador escreve na página
  const funcao = janela.explainCena;
  const registados = [];
  const rotulos = [];
  const animacoes = [];
  const ctx = {
    THREE: qualquerCoisa(),
    cena: qualquerCoisa(),
    camara: qualquerCoisa(),
    cores: { fundo: "f", tinta: "t", fraca: "w", linha: "l", realce: "r", neutro: "n", serie: ["s0", "s1", "s2", "s3"], risco: { baixo: "b", medio: "m", alto: "a" } },
    elemento: (id) => { registados.push(id); },
    rotulo: (texto) => { rotulos.push(texto); return qualquerCoisa(); },
    animar: movimentoReduzido ? undefined : (fn) => { animacoes.push(fn); },
    movimentoReduzido,
    toque: false,
  };
  funcao(ctx);
  for (let i = 0; i < 300; i++) for (const fn of animacoes) fn(0.016);
  return { registados, rotulos, animacoes: animacoes.length };
}

test("os exemplos cobrem o tema código nos perfis B e C e o tema geral no perfil A", () => {
  const combinacoes = ["codigo-b.json", "codigo-c.json", "geral-a.json"].map((n) => {
    const d = dadosDe(n);
    return `${d.tema}/${d.perfil}/${d.granularidade}/${d.objetivo}`;
  });
  assert.deepEqual(combinacoes, ["codigo/B/componentes/perceber", "codigo/C/detalhe/mudar", "geral/A/blocos/perceber"]);
});

test("codigo-b.json passa no validador, é do perfil B e gera a página", () => {
  const d = dadosDe("codigo-b.json");
  assert.deepEqual(validar(d), []);
  assert.match(d.base, /^[0-9a-f]{40}$/);
  assert.deepEqual(d.vistas.map((v) => v.tipo), ["grafo", "sequencia"]);
  assert.ok(d.nos.length > 8 && d.nos.length <= 60, "componentes: mais do que os blocos");
  assert.ok(d.nos.every((n) => !("risco" in n)), "o risco é do perfil C");
  const html = gerarPagina(d, { modelo: MODELO_FIXTURE });
  assert.match(html, /<title>A skill agentic-explain<\/title>/);
});

test("codigo-c.json passa no validador, é do perfil C e traz o risco e o modo", () => {
  const d = dadosDe("codigo-c.json");
  assert.deepEqual(validar(d), []);
  assert.match(d.base, /^[0-9a-f]{40}$/);
  assert.deepEqual(d.vistas.map((v) => v.tipo), ["camadas", "estados"]);
  assert.ok(d.nos.every((n) => ["baixo", "medio", "alto"].includes(n.risco)), "cada nó leva o seu risco");
  const ligacoes = d.vistas.flatMap((v) => v.ligacoes ?? []);
  assert.ok(ligacoes.length > 0 && ligacoes.every((l) => ["sincrona", "assincrona"].includes(l.modo)), "cada ligação leva o modo");
  assert.ok(d.nos.some((n) => n.risco === "alto"), "um exemplo de risco mostra o risco alto");
  assert.match(gerarPagina(d, { modelo: MODELO_FIXTURE }), /<title>CLI do gerar-pagina<\/title>/);
});

test("geral-a.json passa no validador com a cena, é do perfil A e cita fontes lidas", () => {
  const d = dadosDe("geral-a.json");
  const cena = exemplo("geral-a.cena.js");
  assert.deepEqual(validar(d, cena), []);
  assert.deepEqual(validarCena(cena), []);
  assert.ok(d.nos.length >= 5 && d.nos.length <= 8, "blocos: de 5 a 8 nós");
  assert.ok(d.vistas.some((v) => v.tipo === "cena"), "traz a vista cena");
  assert.ok(!("area" in d) && !("base" in d), "o tema geral não tem área nem base");
  assert.ok(d.nos.every((n) => !("risco" in n)));
  const urls = new Set(d.fontes.map((f) => f.url));
  assert.ok(d.fontes.every((f) => f.lido_em === "2026-10-31"), "cada fonte com a data em que foi lida");
  assert.ok(d.passos.every((p) => p.citacoes.some((c) => urls.has(c))), "cada passo cita uma fonte");
  assert.ok(d.fontes.every((f) => d.passos.some((p) => p.citacoes.includes(f.url))), "nenhuma fonte fica por citar");
  const html = gerarPagina(d, { cena, modelo: MODELO_FIXTURE });
  assert.equal(CENA_CODIGO.exec(html)[1], blocoDaCena(cena));
});

test("a cena do geral-a regista exatamente os nós da sua vista e o seu movimento não lança", () => {
  const d = dadosDe("geral-a.json");
  const cena = exemplo("geral-a.cena.js");
  const vista = d.vistas.find((v) => v.tipo === "cena");
  const r = correrCena(cena);
  assert.deepEqual([...r.registados].sort(), [...vista.nos].sort());
  assert.ok(r.rotulos.length >= vista.nos.length && r.rotulos.every((t) => typeof t === "string" && t.trim() !== ""));
  assert.equal(r.animacoes, 1, "uma animação, só quando há movimento");
  // Com movimento reduzido a cena não pede animação e continua a registar tudo.
  const parada = correrCena(cena, { movimentoReduzido: true });
  assert.equal(parada.animacoes, 0);
  assert.deepEqual([...parada.registados].sort(), [...vista.nos].sort());
});

test("os exemplos geram pela linha de comandos (0), e o geral-a sem a sua cena sai 1", (t) => {
  const p = pasta(t);
  const script = comModelo(t, MODELO_FIXTURE);
  for (const nome of ["codigo-b", "codigo-c"]) {
    const saida = path.join(p, `${nome}.html`);
    const r = correr([path.join(EXEMPLOS, `${nome}.json`), "--saida", saida], { script });
    assert.equal(r.status, 0, `${nome}: ${r.err}`);
    assert.ok(existsSync(saida));
  }
  const saida = path.join(p, "geral-a.html");
  const r = correr([path.join(EXEMPLOS, "geral-a.json"), "--cena", path.join(EXEMPLOS, "geral-a.cena.js"), "--saida", saida], { script });
  assert.equal(r.status, 0, r.err);
  assert.match(readFileSync(saida, "utf8"), /window\.explainCena = \(function \(\) \{\n"use strict";\n/);
  // Sem a cena, o geral-a é recusado: a vista cena obriga a --cena.
  const sem = correr([path.join(EXEMPLOS, "geral-a.json"), "--saida", path.join(p, "sem.html")], { script });
  assert.equal(sem.status, 1);
  assert.match(sem.err, /cena/);
});

test("as citações dos exemplos de código apontam para ficheiros que existem e nunca para o modelo", () => {
  for (const nome of ["codigo-b.json", "codigo-c.json"]) {
    const d = dadosDe(nome);
    const citados = [
      ...d.nos.flatMap((n) => n.ficheiros ?? []),
      ...d.vistas.flatMap((v) => (v.ligacoes ?? []).map((l) => l.ref).filter(Boolean)),
      ...d.passos.flatMap((p) => p.citacoes),
    ];
    assert.ok(citados.length > 20, `${nome}: citações a menos`);
    for (const c of citados) {
      const m = CAMINHO_LINHAS.exec(c);
      assert.ok(m, `${nome}: ${c} não é caminho:N nem caminho:N-M`);
      assert.ok(existsSync(path.join(RAIZ_REPO, m[1])), `${nome}: ${m[1]} não existe no repo`);
      assert.ok(!m[1].endsWith("visualizador.html"), `${nome}: o modelo muda com a sua faixa, os exemplos não o citam por linhas`);
    }
    assert.ok(existsSync(path.join(RAIZ_REPO, d.area)), `${nome}: a área ${d.area} não existe`);
  }
});
