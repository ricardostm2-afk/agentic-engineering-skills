#!/usr/bin/env node
// =============================================================================
// detetar-slop.mjs — achados MECÂNICOS de «estética de IA» em ficheiros de UI.
//
// Só apanha o que um padrão de texto apanha com precisão. O resto (hierarquia,
// listas feias, vazio sem resposta, cartões dentro de cartões) é juízo e vive
// na checklist de `ui-sem-slop.md`. Um detetor que grita em todo o lado é
// desligado no dia seguinte: cada regra aqui foi afinada contra um produto bem
// desenhado até os bloqueios serem raros e reais.
//
// Uso:
//   node detetar-slop.mjs <ficheiro|pasta>...        analisa caminhos (ficheiros inteiros)
//   node detetar-slop.mjs --diff <ref> [caminhos]    só as linhas que mudaram desde <ref>
//   --json                                          saída para máquinas
//
// Com --diff, um achado numa linha que o diff não tocou é «pré-existente»:
// lista-se à parte e não conta para a saída. Um ficheiro novo (também não
// seguido pelo git) conta inteiro.
//
// Saída: 0 sem bloqueios (pode haver avisos), 1 com bloqueios, 2 se não
// conseguiu analisar (argumento inválido, ficheiro ilegível, git falhou, nenhum
// ficheiro analisado, ou ficheiros com interface que não sabe ler).
// Falha fechada: nunca diz «limpo» sobre o que não leu.
//
// Escape: `slop-ok: <motivo>` num comentário na linha do achado ou, sozinho
// numa linha, na anterior. Para um bloco (ex.: uma lista de emojis que são
// dados): `slop-ok-bloco: <motivo>` … `slop-ok-fim`. Sem motivo, o próprio
// escape é um bloqueio. Os escapes usados listam-se sempre.
//
// Permitidos sem escape (listam-se em «Permitidos», para o revisor julgar):
// - emoji como DADO: um literal só de emoji numa lista ou num objeto (as
//   reações que o utilizador escolhe), ou o valor de uma chave de conteúdo
//   (`mensagem`, `comentario`, `emoji`…). No JSX, num atributo, numa chave de
//   ícone/rótulo, numa constante solta ou ao lado de texto, é ícone: bloqueia.
// - gradiente de MARCA declarado em `.agentic/ui.json` na raiz do projeto:
//   {"gradientes_marca": ["--grad-marca"]}. Passa a definição desse token (CSS,
//   Sass ou chave de config) e a declaração que o usa com var(); um gradiente
//   escrito à mão, ou classes Tailwind de gradiente, continuam a bloquear.
// =============================================================================

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXT_JS = [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"];
const EXT_MARCACAO = [".html", ".htm", ".vue", ".svelte", ".astro", ".hbs", ".handlebars", ".njk", ".ejs", ".erb", ".liquid", ".twig", ".jinja", ".jinja2", ".j2"];
const EXTENSOES = [".css", ".scss", ".tsx", ".jsx", ...EXT_JS, ...EXT_MARCACAO];
// Ficheiros de tradução: só as regras de texto (emoji, marketing, «sem dados»).
const EXT_TRADUCAO_SEMPRE = [".po", ".pot", ".arb", ".xliff", ".xlf", ".strings"];
const EXT_TRADUCAO_SE_PASTA = [".json", ".yml", ".yaml", ".properties"];
const E_PASTA_TRADUCAO = /(^|[\\/])(locales?|i18n|l10n|lang|langs|languages|translations?|messages|intl)[\\/]/i;
const E_NOME_TRADUCAO = /^[a-z]{2,3}([-_][A-Za-z]{2,4})?\.(json|ya?ml|properties)$/;
// Não são interface: declarações de tipos e código minificado.
const E_FORA = /\.d\.[mc]?ts$|\.min\.(js|css)$/;
// Documentação e dados que não se procuram por marcação no --diff.
const EXT_SEM_INTERFACE = new Set([".md", ".mdx", ".txt", ".rst", ".adoc", ".svg", ".lock", ".map", ".csv", ".sql", ".snap"]);
const E_MARCACAO = /<(html|body|div|span|p|a|button|section|header|footer|main|nav|aside|h[1-6]|ul|ol|li|table|tr|td|th|form|input|label|select|textarea|img|style)\b[^>]*>/i;
const PASTAS_IGNORADAS = new Set(["node_modules", ".git", ".next", "dist", "build", "out", "coverage", ".turbo", ".svelte-kit", ".nuxt", "vendor"]);
const E_TESTE = /(^|[\\/])(__tests__|__mocks__|tests?|e2e)[\\/]|\.(test|spec|stories)\.[^.\\/]+$/;
// Ficheiros onde os literais de cor SÃO o sistema (definição de tokens).
const E_FICHEIRO_DE_TOKENS = /(tokens?|theme|tema|palette|paleta|colou?rs?|cores|variables|globals|brand|marca|tailwind)[^\\/]*$/i;

const REGRAS = {
  "gradiente-roxo": { severidade: "bloqueio", sugestao: "Tirar o gradiente. Cor chapada dos tokens do projeto; se a marca pede profundidade, um degrau de luminosidade da MESMA matiz. Se é o gradiente da marca, aprovado pelo dono: defini-lo num token, declarar o token em .agentic/ui.json (\"gradientes_marca\") e usá-lo com var()." },
  "gradiente-de-fundo": { severidade: "bloqueio", sugestao: "Fundo de secção chapado (token de superfície). Se é o gradiente da marca: um token declarado em .agentic/ui.json (\"gradientes_marca\"), usado com var(); outra decisão registada leva `slop-ok: <motivo>`." },
  emoji: { severidade: "bloqueio", sugestao: "Tirar o emoji. Se a ideia precisa de um sinal, usar o conjunto de ícones do projeto; quase sempre a palavra chega. Se o emoji é dado (reações, conteúdo de pessoas), vem dos dados ou de uma lista de valores só de emoji, não do JSX." },
  "letra-pequena": { severidade: "bloqueio", sugestao: "Mínimo 12 px (13–14 px em linhas de dados). Se o texto não aguenta o tamanho legível, provavelmente não precisa de estar lá." },
  "maiusculas-espacadas": { severidade: "bloqueio", sugestao: "Rótulo em caixa normal, sem tracking. O «sobretítulo» em maiúsculas espaçadas é um tique; o título chega." },
  "transicao-all": { severidade: "bloqueio", sugestao: "Nomear as propriedades que mudam (ex.: transition: opacity 150ms, background-color 150ms). «all» anima também o layout e o que ninguém pediu." },
  "microcopia-marketing": { severidade: "bloqueio", sugestao: "Dizer o que acontece, em palavras do domínio: «Guardar», «3 faturas por emitir». Nada de promessas nem entusiasmo." },
  "cor-literal": { severidade: "aviso", sugestao: "Usar o token do sistema de design. Exceções legítimas (dados, gráficos, alertas de segurança) levam `slop-ok: <motivo>`." },
  "canto-grande": { severidade: "aviso", sugestao: "Usar a escala de raios do projeto (tipicamente 4–12 px). Raio grande só em cápsulas e avatares." },
  "sombra-grande": { severidade: "aviso", sugestao: "Sombra grande é para camadas que flutuam (diálogo, menu). Em conteúdo, separar por espaço e alinhamento." },
  "sem-dados": { severidade: "aviso", sugestao: "Vazio não é resposta: dizer o que significa («Nenhuma fatura por emitir hoje») e qual a próxima ação, com o botão." },
  "hover-move-alvo": { severidade: "aviso", sugestao: "O hover não move o alvo: muda o fundo ou o peso, dentro de @media (hover: hover). Num ecrã tátil, um alvo que se move transforma o primeiro toque em «selecionar»." },
  "movimento-continuo": { severidade: "aviso", sugestao: "Movimento contínuo só enquanto há uma espera real (spinner, esqueleto, progresso). Fora disso, o estado aparece parado no primeiro frame." },
  "vidro-no-conteudo": { severidade: "aviso", sugestao: "O vidro fica na moldura (barra lateral, barra de topo) e nas camadas que flutuam; o conteúdo assenta numa superfície sólida, com o fundo estático." },
  "borda-lateral": { severidade: "aviso", sugestao: "Uma borda lateral colorida a marcar um bloco é um tique: o estado diz-se em palavras, com cor só no que pede atenção. Na navegação e no item ativo, o seletor diz que é (nav, ativo, aria-current)." },
  "botao-contorno": { severidade: "aviso", sugestao: "Nenhum botão é delimitado por uma linha, em nenhum estado: a secundária tem fundo tonal ou uma sombra leve, ou vai para o menu. Ficam o anel de foco e o forced-colors." },
  "traco-vazio": { severidade: "aviso", sugestao: "Um campo vazio omite-se (rótulo e valor), em vez de mostrar «-»." },
  "numeracao-decorativa": { severidade: "aviso", sugestao: "Tirar a numeração «01 / …»: o título chega. «Passo 2 de 3» é informação e fica." },
  "escape-sem-motivo": { severidade: "bloqueio", sugestao: "Escrever o motivo: `slop-ok: <porquê esta exceção é decisão e não tique>`." },
  "escape-sem-fim": { severidade: "bloqueio", sugestao: "Fechar o bloco com `slop-ok-fim`: um bloco aberto não cala nada." }
};

// -----------------------------------------------------------------------------
// Cor
// -----------------------------------------------------------------------------

const RE_COR = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\([^()]*\)/gi;

function paraRgb(cor) {
  const c = cor.trim().toLowerCase();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length <= 4) h = [...h].map((x) => x + x).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  }
  const m = /^([a-z]+)\(([^)]*)\)$/.exec(c);
  if (!m) return null;
  const partes = m[2].replace(/\//g, " ").split(/[\s,]+/).filter(Boolean);
  const num = (s, escala) => (s.endsWith("%") ? parseFloat(s) / 100 : parseFloat(s) / escala);
  if (m[1].startsWith("rgb")) return partes.slice(0, 3).map((p) => num(p, 255));
  if (m[1].startsWith("hsl")) {
    const h = parseFloat(partes[0]);
    const s = num(partes[1] ?? "0", 100);
    const l = num(partes[2] ?? "0", 100);
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return [0, 8, 4].map((n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)));
  }
  if (m[1] === "oklch" || m[1] === "oklab") {
    const L = num(partes[0], 1);
    let A = parseFloat(partes[1]);
    let B = parseFloat(partes[2]);
    if (m[1] === "oklch") {
      const C = A;
      const H = (B * Math.PI) / 180;
      A = C * Math.cos(H);
      B = C * Math.sin(H);
    }
    const l_ = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m_ = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s_ = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    const lin = [
      4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
      -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
      -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_
    ];
    return lin.map((v) => Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
  }
  return null; // lab/lch/hwb: conta como literal, mas não se mede a matiz
}

function hsl([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s, l };
}

// Roxo/índigo/violeta: matiz HSL 230–290, saturada, nem quase-branco nem quase-preto.
function eRoxo(cor) {
  const rgb = paraRgb(cor);
  if (!rgb || rgb.some((v) => Number.isNaN(v))) return false;
  const { h, s, l } = hsl(rgb);
  return h >= 230 && h <= 290 && s >= 0.3 && l >= 0.15 && l <= 0.92;
}

// -----------------------------------------------------------------------------
// Medidas
// -----------------------------------------------------------------------------

function emPx(numero, unidade) {
  const n = parseFloat(numero);
  if (unidade === "px" || unidade === "") return n;
  if (unidade === "rem" || unidade === "em") return n * 16;
  if (unidade === "pt") return (n * 4) / 3;
  if (unidade === "mm") return n * 3.7795;
  if (unidade === "cm") return n * 37.795;
  return NaN;
}

const RE_MEDIDA = /(-?\d*\.?\d+)(px|rem|em|pt|mm|cm)\b/g;

// Tracking que conta como «espaçado»: positivo e a partir de 0,03 em (0,5 px). É o mesmo limiar no
// CSS (`letter-spacing`) e nas classes arbitrárias do Tailwind (`tracking-[…]`).
function espacamentoPositivo(valor) {
  const m = /(-?\d*\.?\d+)(em|px|rem)?/.exec(valor);
  return Boolean(m) && parseFloat(m[1]) >= (m[2] === "px" ? 0.5 : 0.03);
}

// Sombras «grandes»: desfoque ≥ 20 px, sem `inset`. Devolve o maior desfoque.
function desfoqueMaximo(valor) {
  let maior = 0;
  for (const parte of partirNoTopo(valor)) {
    if (/\binset\b/.test(parte)) continue;
    const semCor = parte.replace(RE_COR, " ");
    const medidas = [...semCor.matchAll(/(-?\d*\.?\d+)(px|rem|em)?(?![\w%(])/g)].map((m) => emPx(m[1], m[2] ?? "px"));
    if (medidas.length >= 3) maior = Math.max(maior, medidas[2]);
  }
  return maior;
}

function partirNoTopo(valor) {
  const out = [];
  let nivel = 0;
  let atual = "";
  for (const ch of valor) {
    if (ch === "(") nivel++;
    if (ch === ")") nivel--;
    if (ch === "," && nivel === 0) {
      out.push(atual);
      atual = "";
    } else atual += ch;
  }
  out.push(atual);
  return out;
}

// -----------------------------------------------------------------------------
// Comentários fora, posições intactas (troca por espaços, guarda as quebras)
// -----------------------------------------------------------------------------

function semComentarios(texto, tipo) {
  const out = texto.split("");
  const apagar = (de, ate) => {
    for (let k = de; k < ate && k < out.length; k++) if (out[k] !== "\n") out[k] = " ";
  };
  if (tipo === "markup") {
    for (const m of texto.matchAll(/<!--[\s\S]*?-->/g)) apagar(m.index, m.index + m[0].length);
  }
  const linhaDupla = tipo !== "css"; // `//` é comentário em JS/TS e SCSS; em CSS não
  let aspa = null;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (out[i] === " " && ch !== " ") continue; // já apagado (HTML)
    if (aspa) {
      if (ch === "\\") i++;
      else if (ch === aspa) aspa = null;
      else if (ch === "\n" && aspa !== "`") aspa = null;
      continue;
    }
    if (ch === "/" && texto[i + 1] === "*") {
      const fim = texto.indexOf("*/", i + 2);
      const ate = fim === -1 ? texto.length : fim + 2;
      apagar(i, ate);
      i = ate - 1;
    } else if (linhaDupla && ch === "/" && texto[i + 1] === "/" && texto[i - 1] !== ":") {
      const fim = texto.indexOf("\n", i);
      const ate = fim === -1 ? texto.length : fim;
      apagar(i, ate);
      i = ate - 1;
    } else if (ch === '"' || ch === "'" || (ch === "`" && tipo !== "css" && tipo !== "scss")) {
      aspa = ch;
    }
  }
  return out.join("");
}

// -----------------------------------------------------------------------------
// CSS: declarações com o seletor onde vivem
// -----------------------------------------------------------------------------

function declaracoesCss(css, linhaDe) {
  const decls = [];
  const pilha = [];
  let inicio = 0;
  let parenteses = 0;
  let aspa = null;
  const fechar = (fim) => {
    const bruto = css.slice(inicio, fim);
    const dois = bruto.indexOf(":");
    if (dois > 0 && /\S/.test(bruto)) {
      const desvio = bruto.search(/\S/);
      decls.push({
        prop: bruto.slice(0, dois).trim().toLowerCase(),
        valor: bruto.slice(dois + 1).trim(),
        linha: linhaDe(inicio + desvio),
        seletores: [...pilha]
      });
    }
  };
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (aspa) {
      if (ch === "\\") i++;
      else if (ch === aspa) aspa = null;
      continue;
    }
    if (ch === '"' || ch === "'") aspa = ch;
    else if (ch === "(") parenteses++;
    else if (ch === ")") parenteses = Math.max(0, parenteses - 1);
    else if (parenteses > 0) continue;
    else if (ch === "{") {
      pilha.push(css.slice(inicio, i).trim());
      inicio = i + 1;
    } else if (ch === "}") {
      fechar(i);
      pilha.pop();
      inicio = i + 1;
    } else if (ch === ";") {
      fechar(i);
      inicio = i + 1;
    }
  }
  return decls;
}

// Só o CSS de dentro de <style> num ficheiro de marcação (o resto vira espaço).
function soEstilos(texto) {
  const out = texto.replace(/[^\n]/g, " ").split("");
  for (const m of texto.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    const de = m.index + m[0].indexOf(">") + 1;
    for (let k = de; k < de + m[1].length; k++) out[k] = texto[k];
  }
  return out.join("");
}

// -----------------------------------------------------------------------------
// Texto de interface numa linha de marcação: literais e texto entre tags
// -----------------------------------------------------------------------------

function segmentosDeTexto(linha) {
  const segs = [];
  for (const m of linha.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`]*)`/g)) segs.push(m[1] ?? m[2] ?? m[3]);
  for (const m of linha.matchAll(/[>}]([^<>{}]+)(?=[<{])/g)) segs.push(m[1]);
  const t = linha.trim();
  // Uma linha só de prosa entre tags (JSX/HTML que parte o texto em linhas).
  if (/^[\p{L}«"“(¿¡]/u.test(t) && !/[=;{}<>]|=>/.test(t) && /\s/.test(t) && !/^(import|export|const|let|var|return|if|else|function|type|interface)\b/.test(t)) segs.push(t);
  return segs.filter((s) => /\p{L}/u.test(s));
}

const semAcentos = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const MARKETING = [
  /\bdesbloquei[ae]\s+(o\s+|a\s+)?(seu|sua|teu|tua|todo|toda|novos?|novas?|mais|potencial|poder)\b/,
  /\bdesbloquear\s+(o\s+)?(potencial|poder)\b/,
  /\bsem\s+(esforco|complicacoes|stress)\b/,
  /\bbem[- ]vind[oa]s?\s+de\s+volta\b/,
  /\bnum\s+piscar\s+de\s+olhos\b/,
  /\brevolucion(e|a|ar|ario|aria)\b/,
  /\bpotencialize\b/,
  /\bproximo\s+nivel\b/,
  /\bexperiencia\s+(incrivel|unica|magica|fluida|perfeita)\b/,
  /\btudo\s+num\s+so\s+lugar\b/,
  /\bturbin(e|ar|ado|ada)\b/,
  /\bunlock\s+(the|your|full|all|new|more|premium|powerful)\b/,
  /\beffortless(ly)?\b/,
  /\bseamless(ly)?\b/,
  /\bsupercharg/,
  /\bgame[- ]?changer\b/,
  /\bnext[- ]level\b/,
  /\bwelcome\s+back\b/,
  /\brevolutioni[sz]/,
  /\belevate\s+your\b/,
  /\ball[- ]in[- ]one\b/,
  /\bblazing(ly)?[- ]fast\b/,
  /\blike\s+never\s+before\b/,
  /\bsay\s+goodbye\s+to\b/,
  /\bcutting[- ]edge\b/,
  /\bbest[- ]in[- ]class\b/,
  /\bworld[- ]class\b/
];

const SEM_DADOS = new Set(["sem dados", "sem dados disponiveis", "nenhum dado", "nao ha dados", "nada para mostrar", "nada a mostrar", "no data", "no data available", "no data yet", "nothing to show", "nothing here", "nothing here yet"]);

// Camadas que flutuam por cima do conteúdo: aí uma sombra grande é estrutura, não enfeite.
const E_CAMADA_FLUTUANTE = /dialog|modal|popover|popup|menu|dropdown|tooltip|toast|sheet|drawer|overlay|backdrop|flutu|combobox|listbox|command|lightbox|snackbar|side-?nav|sidebar/i;

// A moldura da aplicação: aí o vidro é material da marca, não um véu sobre o conteúdo.
const E_MOLDURA = /\bnav|topbar|toolbar|header|cabecalho|cabeçalho|\btopo|barra|moldura|shell|appbar|app-bar/i;
// Esperas reais: aí uma animação contínua diz que o trabalho está a correr.
const E_ESPERA = /spinner|loader|loading|skeleton|esqueleto|progress|busy|carregar|carregando|espera|pending/i;
// Bordas laterais com função: navegação, item ativo ou selecionado, separadores e citações.
const E_LATERAL_OK = /nav|menu|sidebar|tab|ativ|active|current|selected|selecionad|blockquote|cita[cç]|quote/i;
// Botões (onde uma linha à volta é o tique do B20) e campos (onde o contorno é função).
const E_BOTAO = /button|btn|bot[aã]o|outline|ghost|contorno/i;
const E_CAMPO = /input|select|textarea|campo|field|form-control/i;
// Numeração decorativa à frente de um título: «01 / Dados», «02 · Resumo».
const RE_NUMERACAO = /^\s*0\d\s*[/·•.|—–-]\s*\p{L}/u;

const RE_EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;

const RE_EMOJI_G = new RegExp(RE_EMOJI.source, "gu");
const RE_LITERAL = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`([^`]*)`/g;
// Chaves cujo valor é ícone ou texto de interface: aí o emoji é enfeite.
const E_CHAVE_ICONE = /ic[oó]ne?|icon|glyph|s[ií]mbolo|symbol|label|r[oó]tulo|title|t[ií]tulo|heading|cabe[cç]alho|prefix|sufix|suffix|badge|bot[aã]o|button|cta|menu|nav/i;
// Chaves cujo valor é conteúdo: o emoji é dado, mesmo ao lado de texto.
const E_CHAVE_DADO = /emoji|reac|reaction|conte[uú]do|content|mensagem|message|coment|comment|body|corpo|post|resposta|reply/i;

// Emoji como dado ou como ícone, pela chave e pelo valor (sem letras = átomo de dados).
function classificarValor(chave, valor) {
  if (/<[a-z]/i.test(valor)) return "icone"; // HTML num template string
  if (chave && E_CHAVE_ICONE.test(chave)) return "icone";
  if (chave && E_CHAVE_DADO.test(chave)) return "dado";
  return /\p{L}/u.test(valor) ? "icone" : "dado";
}

// Numa linha de código: só é dado o emoji dentro de um literal que é elemento de
// uma lista (`[` ou `,` antes, ou sozinho no início da linha) ou valor de uma
// chave (`:` antes). Fora de um
// literal (texto do JSX), num atributo (`=`), numa expressão (`{`, `(`) ou numa
// constante solta, é ícone.
function emojiDaLinha(linha) {
  const literais = [...linha.matchAll(RE_LITERAL)].map((m) => ({ de: m.index, ate: m.index + m[0].length, valor: m[1] ?? m[2] ?? m[3] }));
  let dado = null;
  for (const e of linha.matchAll(RE_EMOJI_G)) {
    const lit = literais.find((l) => e.index > l.de && e.index < l.ate);
    const antes = lit ? linha.slice(0, lit.de).trimEnd() : "";
    let tipo = "icone";
    if (lit && antes.endsWith(":")) tipo = classificarValor(/["'`]?([\p{L}\w$-]+)["'`]?\s*:$/u.exec(antes)?.[1] ?? "", lit.valor);
    else if (lit && (antes === "" || /[[,]$/.test(antes))) tipo = classificarValor("", lit.valor); // elemento de lista (também numa linha só sua)
    if (tipo === "icone") return { tipo, emoji: e[0] };
    dado ??= { tipo, emoji: e[0] };
  }
  return dado;
}

// Numa linha de tradução (`"chave": "valor"`, `chave = valor`, `chave: valor`).
function emojiDaTraducao(linha) {
  const e = RE_EMOJI.exec(linha);
  if (!e) return null;
  const m = /^\s*["']?([\w.\-[\]]+)["']?\s*[:=]\s*(.*)$/.exec(linha);
  if (!m) return { tipo: "icone", emoji: e[0] };
  return { tipo: classificarValor(m[1], m[2].replace(/^["']|["'],?\s*$/g, "")), emoji: e[0] };
}

// -----------------------------------------------------------------------------
// Declaração do projeto: .agentic/ui.json
// -----------------------------------------------------------------------------

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function lerDeclaracao(raiz) {
  const f = path.join(raiz, ".agentic", "ui.json");
  const vazia = { origem: null, gradientesMarca: [] };
  if (!existsSync(f)) return vazia;
  const origem = path.relative(process.cwd(), f) || f;
  let json;
  try {
    json = JSON.parse(readFileSync(f, "utf8"));
  } catch (e) {
    throw new ErroDeUso(`${origem} não é JSON válido: ${e.message}`);
  }
  const lista = json?.gradientes_marca ?? [];
  if (!Array.isArray(lista) || !lista.every((n) => typeof n === "string" && /^(--|\$)?[A-Za-z_][\w-]*$/.test(n))) {
    throw new ErroDeUso(`${origem}: "gradientes_marca" tem de ser uma lista de nomes de token (ex.: ["--grad-marca"])`);
  }
  return { origem, gradientesMarca: lista.map((n) => n.replace(/^(--|\$)/, "")) };
}

// O nome de marca que esta declaração/linha define ou usa, ou null.
function marcaEm(texto, prop, decl) {
  for (const n of decl.gradientesMarca) {
    if (prop !== undefined && prop.replace(/^(--|\$)/, "") === n && /^(--|\$)/.test(prop)) return n;
    if (new RegExp(`var\\(\\s*--${escRe(n)}\\s*[,)]|\\$${escRe(n)}\\b`).test(texto)) return n;
    if (prop === undefined && new RegExp(`(^|[\\s{,(])["'\`]?(--|\\$)?${escRe(n)}["'\`]?\\s*:`).test(texto)) return n;
  }
  return null;
}

// -----------------------------------------------------------------------------
// Análise de um ficheiro
// -----------------------------------------------------------------------------

// Comentários de ficheiros de tradução: linhas `#`/`!` (po, yaml, properties);
// os .strings comentam como JS.
function semComentariosDeTraducao(texto, ext) {
  if (ext === ".strings") return semComentarios(texto, "js");
  return texto
    .split("\n")
    .map((l) => (/^\s*[#!]/.test(l) ? l.replace(/[^\n]/g, " ") : l))
    .join("\n");
}

function analisar(caminho, texto, eTraducao = false, decl = { origem: null, gradientesMarca: [] }) {
  const ext = path.extname(caminho).toLowerCase();
  const eCss = ext === ".css" || ext === ".scss";
  const tipo = eTraducao ? "texto" : ext === ".css" ? "css" : ext === ".scss" ? "scss" : EXT_MARCACAO.includes(ext) ? "markup" : "js";
  const limpo = tipo === "texto" ? semComentariosDeTraducao(texto, ext) : semComentarios(texto, tipo);
  const linhas = limpo.split("\n");
  const brutas = texto.split("\n");
  const inicioDaLinha = [0];
  for (let i = 0; i < texto.length; i++) if (texto[i] === "\n") inicioDaLinha.push(i + 1);
  const linhaDe = (pos) => {
    let lo = 0;
    let hi = inicioDaLinha.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (inicioDaLinha[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
  const tokens = E_FICHEIRO_DE_TOKENS.test(path.basename(caminho));
  const achados = [];
  const sombras = [];
  const permitidos = [];
  const vistos = new Set();
  const achar = (linha, regra, mensagem) => {
    const chave = `${linha}|${regra}`;
    if (vistos.has(chave)) return;
    vistos.add(chave);
    achados.push({ ficheiro: caminho, linha, regra, severidade: REGRAS[regra].severidade, mensagem, sugestao: REGRAS[regra].sugestao, trecho: (brutas[linha - 1] ?? "").trim().slice(0, 140) });
  };
  const permitir = (linha, regra, motivo) => {
    if (!vistos.has(`${linha}|${regra}`)) permitidos.push({ ficheiro: caminho, linha, regra, motivo, trecho: (brutas[linha - 1] ?? "").trim().slice(0, 140) });
    vistos.add(`${linha}|${regra}`);
  };
  // Gradiente: se é o token de marca declarado, permite-se e lista-se.
  const gradiente = (marca, linha, regra, mensagem) =>
    marca ? permitir(linha, regra, `gradiente de marca --${marca} declarado em ${decl.origem}`) : achar(linha, regra, mensagem);
  const emoji = (r, linha, onde) => {
    if (!r) return;
    if (r.tipo === "dado") permitir(linha, "emoji", `emoji «${r.emoji}» como dado (valor de uma lista ou de uma chave de conteúdo, não ícone)`);
    else achar(linha, "emoji", `emoji «${r.emoji}» ${onde}`);
  };

  // --- CSS (ficheiros de estilo e <style> dentro de marcação) ---------------
  // Em JS/TS, o <style> de um template string (HTML gerado no servidor) também conta.
  const css = eCss ? limpo : tipo === "markup" || (tipo === "js" && /<style[\s>]/i.test(limpo)) ? soEstilos(limpo) : "";
  if (css.trim()) {
    const decls = declaracoesCss(css, linhaDe);
    const porBloco = new Map();
    for (const d of decls) {
      const seletor = d.seletores.filter((s) => !s.startsWith("@")).at(-1) ?? "";
      const naImpressao = d.seletores.some((s) => /^@media\b[^{]*\bprint\b/.test(s) && !/\bscreen\b/.test(s));
      const v = d.valor;
      const nAntes = achados.length;
      if (/gradient\(/.test(v) && !d.prop.startsWith("--") && !d.prop.startsWith("$")) {
        const roxas = (v.match(RE_COR) ?? []).filter(eRoxo);
        const marca = marcaEm(v, d.prop, decl);
        if (roxas.length) gradiente(marca, d.linha, "gradiente-roxo", `gradiente com ${roxas[0]} (roxo/índigo)`);
        else if (/^background(-image)?$/.test(d.prop) && /(^|[\s.#>+~,(-])(body|html|main|section|header|footer)\b|hero|banner|landing|jumbotron|splash/i.test(seletor) && !/mask/.test(d.prop)) {
          gradiente(marca, d.linha, "gradiente-de-fundo", `gradiente no fundo de «${seletor.slice(0, 60)}»`);
        }
      } else if (/gradient\(/.test(v) && (v.match(RE_COR) ?? []).some(eRoxo)) {
        gradiente(marcaEm(v, d.prop, decl), d.linha, "gradiente-roxo", "token de gradiente com roxo/índigo");
      }
      if ((d.prop === "font-size" || d.prop === "font") && !/\b(calc|clamp|min|max|var)\(/.test(v) && !naImpressao) {
        const m = [...v.matchAll(RE_MEDIDA)][0];
        if (m && emPx(m[1], m[2]) < 12 && emPx(m[1], m[2]) > 0) achar(d.linha, "letra-pequena", `${d.prop}: ${m[0]} (< 12 px)`);
      }
      if (/radius$/.test(d.prop) && !d.prop.startsWith("--") && !/pill|avatar|chip|badge|circle|round|dot|toggle|switch|thumb|capsul|pastilha|bolinha|knob|handle|fab\b/i.test(seletor)) {
        const px = [...v.matchAll(RE_MEDIDA)].map((m) => emPx(m[1], m[2]));
        const grande = px.find((n) => n >= 20 && n < 999);
        if (grande !== undefined) achar(d.linha, "canto-grande", `${d.prop}: ${v} (≥ 20 px)`);
      }
      if (d.prop === "box-shadow" && !/^none$/i.test(v) && !E_CAMADA_FLUTUANTE.test(d.seletores.join(" "))) {
        const blur = desfoqueMaximo(v);
        if (blur >= 20) sombras.push({ linha: d.linha, mensagem: `box-shadow com desfoque de ${Math.round(blur)} px` });
      }
      if (!tokens && !d.prop.startsWith("--") && !d.prop.startsWith("$") && achados.length === nAntes) {
        const cor = v.match(RE_COR);
        if (cor) achar(d.linha, "cor-literal", `${d.prop}: ${cor[0]} fora dos tokens`);
      }
      const seletores = d.seletores.filter((s) => !s.startsWith("@")).join(" ");
      const emMedia = (re) => d.seletores.some((s) => s.startsWith("@media") && re.test(s));
      if ((d.prop === "transition" && partirNoTopo(v).some((p) => /(^|\s)all(\s|$)/.test(p.trim()))) || (d.prop === "transition-property" && /\ball\b/.test(v))) {
        achar(d.linha, "transicao-all", `${d.prop}: ${v.slice(0, 50)}`);
      }
      const semImportant = v.replace(/\s*!important\s*$/i, "");
      // O alvo é o próprio elemento em :hover (o último seletor composto), não um descendente dele.
      const alvoEmHover = partirNoTopo(seletores).some((s) => /:hover\b/.test(s.trim().split(/\s*[\s>+~]\s*/).at(-1) ?? ""));
      if (/^(transform|translate|scale)$/.test(d.prop) && !/^none$/i.test(semImportant) && alvoEmHover && !emMedia(/\(\s*hover\s*:\s*hover\s*\)/)) {
        achar(d.linha, "hover-move-alvo", `${d.prop}: ${v.slice(0, 40)} em «${seletores.slice(0, 60)}», fora de @media (hover: hover)`);
      }
      if ((d.prop === "animation" || d.prop === "animation-iteration-count") && /\binfinite\b/.test(v) && !E_ESPERA.test(seletores)) {
        achar(d.linha, "movimento-continuo", `${d.prop}: ${v.slice(0, 50)} em «${seletores.slice(0, 60)}»`);
      }
      if (/^border-(left|inline-start)$/.test(d.prop) && !/\b(none|hidden)\b/.test(v) && !E_LATERAL_OK.test(seletores) && !emMedia(/forced-colors/)) {
        const largura = Math.max(0, ...[...v.matchAll(RE_MEDIDA)].map((m) => emPx(m[1], m[2])), /\bthick\b/.test(v) ? 5 : /\bmedium\b/.test(v) ? 3 : 0);
        if (largura >= 2) achar(d.linha, "borda-lateral", `${d.prop}: ${v.slice(0, 40)} em «${seletores.slice(0, 60)}»`);
      }
      const chave = d.seletores.join(" » ");
      const bloco = porBloco.get(chave) ?? { maiusculas: 0, espacado: false, vidro: 0, borda: 0, fundoTransparente: false, seletores, forcadas: emMedia(/forced-colors/) };
      if (/^(-webkit-)?backdrop-filter$/.test(d.prop) && !/^none$/i.test(v)) bloco.vidro ||= d.linha;
      if (d.prop === "border" && !/\b(none|hidden|transparent)\b|^0(px)?\b/.test(v)) bloco.borda ||= d.linha;
      if (/^background(-color)?$/.test(d.prop) && /^(transparent|none)$/i.test(v.trim())) bloco.fundoTransparente = true;
      if (d.prop === "text-transform" && /uppercase/.test(v)) bloco.maiusculas = d.linha;
      if (d.prop === "letter-spacing" && espacamentoPositivo(v)) bloco.espacado = true;
      porBloco.set(chave, bloco);
    }
    for (const [chave, b] of porBloco) {
      if (b.maiusculas && b.espacado) achar(b.maiusculas, "maiusculas-espacadas", `maiúsculas com letter-spacing em «${chave.split(" » ").at(-1).slice(0, 60)}»`);
      if (b.vidro && !E_CAMADA_FLUTUANTE.test(b.seletores) && !E_MOLDURA.test(b.seletores)) achar(b.vidro, "vidro-no-conteudo", `backdrop-filter em «${b.seletores.slice(0, 60)}», fora da moldura e das camadas que flutuam`);
      if (b.borda && E_BOTAO.test(b.seletores) && (b.fundoTransparente || /outline|ghost|contorno/i.test(b.seletores)) && !E_CAMPO.test(b.seletores) && !/:focus/.test(b.seletores) && !b.forcadas) {
        achar(b.borda, "botao-contorno", `botão com linha à volta e fundo transparente em «${b.seletores.slice(0, 60)}»`);
      }
    }
  }

  // Texto de interface: marketing e «sem dados» em cada segmento.
  const regrasDeTexto = (n, segs) => {
    for (const seg of segs) {
      const t = semAcentos(seg);
      const mk = MARKETING.map((re) => re.exec(t)).find(Boolean);
      if (mk) achar(n, "microcopia-marketing", `«${seg.trim().slice(0, 60)}»`);
      if (SEM_DADOS.has(t.trim().replace(/[.!…:]+$/, "").trim())) achar(n, "sem-dados", `«${seg.trim()}» sozinho`);
      if (RE_NUMERACAO.test(seg)) achar(n, "numeracao-decorativa", `«${seg.trim().slice(0, 40)}»`);
    }
  };

  // --- Ficheiros de tradução: só as regras de texto ---------------------------
  if (tipo === "texto") {
    linhas.forEach((linha, i) => {
      if (!linha.trim()) return;
      emoji(emojiDaTraducao(linha), i + 1, "num texto de interface");
      const valor = linha.replace(/^\s*["']?[\w.\-[\]]+["']?\s*[:=]\s*/, "");
      regrasDeTexto(i + 1, [...segmentosDeTexto(linha), ...(valor !== linha && /\p{L}/u.test(valor) ? [valor] : [])]);
    });
  }

  // --- Marcação e código (TSX/JSX/JS/TS/HTML/Vue/Svelte/Astro…), linha a linha
  if (!eCss && tipo !== "texto") {
    linhas.forEach((linha, i) => {
      const n = i + 1;
      if (!linha.trim()) return;
      emoji(emojiDaLinha(linha), n, "na interface");
      // Gradientes: classes Tailwind e estilos em linha. As classes escritas à
      // mão nunca são a marca; um literal que define ou usa o token declarado é.
      const twRoxo = /\b(?:from|via|to)-(indigo|violet|purple|fuchsia)-\d{2,3}\b/.exec(linha);
      const corDoGradiente = (/gradient\(/.test(linha) || /\b(?:from|via|to)-\[/.test(linha)) && (linha.match(RE_COR) ?? []).find(eRoxo);
      if (twRoxo) achar(n, "gradiente-roxo", `gradiente Tailwind com ${twRoxo[0]}`);
      else if (corDoGradiente) gradiente(marcaEm(linha, undefined, decl), n, "gradiente-roxo", `gradiente com ${corDoGradiente} (roxo/índigo)`);
      else if (/\bbg-(gradient-to-\w+|linear-(to-\w+|\d+)|radial|conic)\b|gradient\(/.test(linha) && (/<(section|header|main|body|footer)\b/.test(linha) || /\b(hero|banner|landing|jumbotron)\b/i.test(linha))) {
        gradiente(/gradient\(/.test(linha) ? marcaEm(linha, undefined, decl) : null, n, "gradiente-de-fundo", "gradiente no fundo de uma secção");
      }
      // Letra pequena.
      for (const m of linha.matchAll(/\btext-\[(\d*\.?\d+)(px|rem|em)\]/g)) if (emPx(m[1], m[2]) < 12) achar(n, "letra-pequena", `${m[0]} (< 12 px)`);
      for (const m of linha.matchAll(/\bfont-?size\s*[:=]\s*\{?\s*["'`]?(\d*\.?\d+)(px|rem|em|pt|mm|cm)?(?![\w.%])/gi)) {
        const px = emPx(m[1], m[2] ?? "px");
        if (px > 0 && px < 12) achar(n, "letra-pequena", `tamanho de letra ${m[1]}${m[2] ?? "px"} (< 12 px)`);
      }
      if (/\buppercase\b/.test(linha) && [...linha.matchAll(/(?<![\w-])tracking-(?:(?:wide|wider|widest)(?![\w-])|\[([^\]]+)\])/g)].some((m) => m[1] === undefined || espacamentoPositivo(m[1]))) {
        achar(n, "maiusculas-espacadas", "classes uppercase + tracking no mesmo elemento");
      }
      // Movimento, material, bordas e botões (B13, B15, B17, B18, B20, B22).
      if (/(?<![\w-])transition-all\b|\btransition(?:-?[Pp]roperty)?\s*:\s*["'`]?\s*all\b/.test(linha)) achar(n, "transicao-all", "transição de todas as propriedades (all)");
      const hoverMove = /(?<![\w-])hover:-?(?:translate|scale)-[\w[\].-]+/.exec(linha);
      if (hoverMove) achar(n, "hover-move-alvo", `${hoverMove[0]} move o alvo no hover`);
      const continuo = /(?<![\w-])animate-(?:ping|bounce)\b|\banimation(?:IterationCount)?\s*:\s*["'`][^"'`]*\binfinite\b/.exec(linha);
      if (continuo && !E_ESPERA.test(linha)) achar(n, "movimento-continuo", `${continuo[0].slice(0, 50)} fora de uma espera`);
      const vidro = /(?<![\w-])backdrop-blur(?:-[\w[\].]+)?(?![\w-])|\bbackdrop-?[Ff]ilter\s*:\s*["'`]?\s*(?!none)\w/.exec(linha);
      if (vidro) {
        const resto = linha.replace(/(?<![\w-])backdrop-[\w[\].-]+|\bbackdrop-?[Ff]ilter/g, " ");
        if (!E_CAMADA_FLUTUANTE.test(resto) && !E_MOLDURA.test(resto)) achar(n, "vidro-no-conteudo", `${vidro[0].slice(0, 40)} fora da moldura e das camadas que flutuam`);
      }
      const lateral = /(?<![\w:-])border-[ls]-(?:[2-8]|\[\d+px\])(?![\w-])/.exec(linha);
      if (lateral && !E_LATERAL_OK.test(linha)) achar(n, "borda-lateral", `${lateral[0]} a marcar um bloco`);
      if (/\bvariant=\{?["'`]outline["'`]/.test(linha) || (/<button\b/.test(linha) && /(?<![\w:-])border(?:-[1-8])?(?![\w-])/.test(linha) && /(?<![\w:-])bg-transparent\b/.test(linha))) {
        achar(n, "botao-contorno", "botão desenhado como contorno");
      }
      const traco = /(?:\?\?|\|\|)\s*["'`]\s*[-–—]\s*["'`]|\?[^:?]*:\s*["'`]\s*[-–—]\s*["'`]/.exec(linha);
      if (traco) achar(n, "traco-vazio", `${traco[0].trim()} no lugar de um campo vazio`);
      // Cantos.
      for (const m of linha.matchAll(/\brounded(?:-[trblse]{1,2})?-(3xl|\[(\d*\.?\d+)(px|rem)\])/g)) {
        const px = m[1] === "3xl" ? 24 : emPx(m[2], m[3]);
        if (px >= 20 && px < 999 && !/avatar|pill|chip|badge|circle/i.test(linha)) achar(n, "canto-grande", `${m[0]} (≥ 20 px)`);
      }
      // Sombras.
      const flutua = /\b(fixed|absolute)\b|role=["'](dialog|menu|listbox|tooltip)/.test(linha) || E_CAMADA_FLUTUANTE.test(linha);
      for (const m of flutua ? [] : linha.matchAll(/\bshadow-(xl|2xl|\[[^\]]+\])/g)) {
        const blur = m[1].startsWith("[") ? desfoqueMaximo(m[1].slice(1, -1).replace(/_/g, " ")) : 25;
        if (blur >= 20) sombras.push({ linha: n, mensagem: `${m[0]} (desfoque ${Math.round(blur)} px)` });
      }
      for (const m of flutua ? [] : linha.matchAll(/\bbox-?shadow\s*:\s*["'`]?([^"'`;}]+)/gi)) {
        const blur = desfoqueMaximo(m[1]);
        if (blur >= 20) sombras.push({ linha: n, mensagem: `box-shadow com desfoque de ${Math.round(blur)} px` });
      }
      // Cor literal (uma por linha).
      if (!tokens && !/^\s*--[\w-]+\s*:/.test(linha)) {
        const tw = /\b[a-z-]+-\[(#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?|oklch)\([^\]]*\))\]/.exec(linha);
        const emLinha = /\b(?:color|background(?:Color)?|fill|stroke|borderColor|border(?:-color)?)\s*[:=]\s*\{?\s*["'`]\s*(#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?|oklch)\([^)]*\))/.exec(linha);
        const lit = tw?.[1] ?? emLinha?.[1];
        if (lit) achar(n, "cor-literal", `${lit} fora dos tokens`);
      }
      // Texto de interface.
      regrasDeTexto(n, segmentosDeTexto(linha));
    });
  }

  // `content: "✨"` num ficheiro de estilo também é interface.
  if (eCss) {
    linhas.forEach((linha, i) => {
      const emoji = /content\s*:/.test(linha) && RE_EMOJI.exec(linha);
      if (emoji) achar(i + 1, "emoji", `emoji «${emoji[0]}» em content:`);
    });
  }

  // --- Escapes ---------------------------------------------------------------
  // Um escape sozinho na linha (só comentário) cobre essa linha e a seguinte;
  // um escape no fim de uma linha de código cobre só essa linha.
  const limparMotivo = (s) => (s ?? "").replace(/\*\/|-->|\}\s*$|\*\/\s*\}|["',]+\s*$/g, "").trim();
  const temMotivo = (s) => (s.match(/\p{L}/gu) ?? []).length >= 3;
  const soComentario = (i) => /^\s*[{}]*\s*$/.test(linhas[i] ?? "") || /^\s*"\/\/"\s*:/.test(brutas[i] ?? "");
  const escapes = [];
  let bloco = null;
  brutas.forEach((linha, i) => {
    const n = i + 1;
    const ini = /slop-ok-bloco\b\s*(?::\s*(.*))?/.exec(linha);
    if (ini) {
      const motivo = limparMotivo(ini[1]);
      if (bloco) achar(bloco.de, "escape-sem-fim", "`slop-ok-bloco` aberto antes de fechar o anterior");
      if (temMotivo(motivo)) bloco = { de: n, motivo };
      else {
        bloco = null;
        achar(n, "escape-sem-motivo", "`slop-ok-bloco` sem motivo");
      }
      return;
    }
    if (/slop-ok-fim\b/.test(linha)) {
      if (bloco) escapes.push({ de: bloco.de, ate: n, linha: bloco.de, motivo: bloco.motivo });
      bloco = null;
      return;
    }
    const m = /slop-ok\b(?!-)\s*(?::\s*(.*))?/.exec(linha);
    if (!m) return;
    const motivo = limparMotivo(m[1]);
    if (temMotivo(motivo)) escapes.push({ de: n, ate: soComentario(i) ? n + 1 : n, linha: n, motivo });
    else achar(n, "escape-sem-motivo", "`slop-ok` sem motivo");
  });
  if (bloco) achar(bloco.de, "escape-sem-fim", "`slop-ok-bloco` sem `slop-ok-fim`");

  const escapeDe = (linha) => escapes.find((e) => linha >= e.de && linha <= e.ate);
  const naoEscapa = new Set(["escape-sem-motivo", "escape-sem-fim"]);
  const finais = [];
  for (const a of achados) {
    const e = naoEscapa.has(a.regra) ? null : escapeDe(a.linha);
    if (e) (e.cala ??= []).push(`${a.linha} ${a.regra}`);
    else finais.push(a);
  }
  const sombrasFinais = [];
  for (const s of sombras) {
    const e = escapeDe(s.linha);
    if (e) (e.cala ??= []).push(`${s.linha} sombra-grande`);
    else sombrasFinais.push({ ...s, ficheiro: caminho, trecho: (brutas[s.linha - 1] ?? "").trim().slice(0, 140) });
  }

  return {
    achados: finais,
    sombras: sombrasFinais,
    permitidos,
    escapes: escapes.map((e) => ({ ficheiro: caminho, linha: e.linha, ate: e.ate, motivo: e.motivo, cala: e.cala ?? [] }))
  };
}

// -----------------------------------------------------------------------------
// Ficheiros a analisar
// -----------------------------------------------------------------------------

class ErroDeUso extends Error {}

function eTraducao(rel) {
  const ext = path.extname(rel).toLowerCase();
  if (EXT_TRADUCAO_SEMPRE.includes(ext)) return true;
  return EXT_TRADUCAO_SE_PASTA.includes(ext) && (E_PASTA_TRADUCAO.test(rel) || E_NOME_TRADUCAO.test(path.basename(rel)));
}

// `rel` é relativo à raiz do que se analisa (a pasta dada, ou a raiz do repo no
// --diff), nunca o caminho absoluto: um repo dentro de uma pasta `test/` não é um teste.
function classificar(rel) {
  if (E_TESTE.test(rel) || E_FORA.test(rel)) return "fora";
  if (EXTENSOES.includes(path.extname(rel).toLowerCase())) return "interface";
  if (eTraducao(rel)) return "traducao";
  return "outro";
}

// Um ficheiro alterado numa extensão que não se lê, mas com marcação HTML
// (template num .py, .php, .rb…): não se analisa, e não se cala.
function temMarcacao(f) {
  if (EXT_SEM_INTERFACE.has(path.extname(f).toLowerCase())) return false;
  try {
    if (statSync(f).size > 2_000_000) return false;
    const t = readFileSync(f, "utf8");
    return !t.includes("\u0000") && E_MARCACAO.test(t);
  } catch {
    return false;
  }
}

function percorrer(caminho, sel, raiz) {
  let st;
  try {
    st = statSync(caminho);
  } catch {
    throw new ErroDeUso(`não existe ou não se lê: ${caminho}`);
  }
  if (st.isDirectory()) {
    for (const nome of readdirSync(caminho).sort()) {
      if (PASTAS_IGNORADAS.has(nome)) continue;
      percorrer(path.join(caminho, nome), sel, raiz);
    }
    return;
  }
  const explicito = caminho === raiz;
  const c = classificar(explicito ? path.basename(caminho) : path.relative(raiz, caminho));
  if (c === "interface" || c === "traducao") sel.ficheiros.push({ f: caminho, traducao: c === "traducao", alteradas: null });
  else if (explicito) sel.naoAnalisados.push({ f: caminho, motivo: c === "fora" ? "teste, declaração de tipos ou minificado" : "extensão que o detetor não lê" });
}

function git(args, cwd) {
  try {
    return execFileSync("git", ["-c", "core.quotePath=false", ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 256 * 1024 * 1024 });
  } catch (e) {
    throw new ErroDeUso(`git ${args.join(" ")} falhou: ${(e.stderr || e.message || "").toString().trim()}`);
  }
}

// Linhas do lado novo de cada ficheiro alterado, lidas dos hunks de `git diff -U0`.
function linhasAlteradas(ref, raiz) {
  const out = git(["diff", "-U0", "--no-color", "--no-ext-diff", "--src-prefix=a/", "--dst-prefix=b/", "--diff-filter=ACMRT", ref, "--"], raiz);
  const mapa = new Map();
  let atual = null;
  for (const l of out.split("\n")) {
    if (l.startsWith("+++ ")) {
      const p = l.slice(4).replace(/\t$/, "");
      atual = p === "/dev/null" ? null : p.replace(/^b\//, "");
      if (atual && !mapa.has(atual)) mapa.set(atual, new Set());
      continue;
    }
    const h = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(l);
    if (h && atual) {
      const de = Number(h[1]);
      const n = h[2] === undefined ? 1 : Number(h[2]);
      for (let k = de; k < de + n; k++) mapa.get(atual).add(k);
    }
  }
  return mapa;
}

function alteradosDesde(ref, filtros) {
  const raiz = git(["rev-parse", "--show-toplevel"], process.cwd()).trim();
  git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], raiz);
  const linhas = linhasAlteradas(ref, raiz);
  const naoSeguidos = new Set(git(["ls-files", "--others", "--exclude-standard"], raiz).split("\n").filter(Boolean));
  const nomes = [...new Set([...git(["diff", "--name-only", "--diff-filter=ACMRT", ref, "--"], raiz).split("\n").filter(Boolean), ...naoSeguidos])].sort();
  const bases = filtros.map((f) => path.resolve(f));
  const sel = { ficheiros: [], naoAnalisados: [] };
  for (const n of nomes) {
    const abs = path.join(raiz, n);
    if (bases.length && !bases.some((b) => abs === b || abs.startsWith(b + path.sep))) continue;
    const c = classificar(n);
    // Um ficheiro que o git ainda não segue é novo por inteiro.
    const alteradas = naoSeguidos.has(n) ? "todas" : (linhas.get(n) ?? new Set());
    if (c === "interface" || c === "traducao") sel.ficheiros.push({ f: abs, traducao: c === "traducao", alteradas });
    else if (c === "outro" && temMarcacao(abs)) sel.naoAnalisados.push({ f: abs, motivo: "marcação HTML numa extensão que o detetor não lê" });
  }
  return sel;
}

// Raiz onde se procura `.agentic/ui.json`: a do repositório git da pasta atual,
// ou a própria pasta atual fora de um repositório.
function raizDoProjeto() {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || process.cwd();
  } catch {
    return process.cwd();
  }
}

function lerArgumentos(argv) {
  const op = { json: false, diff: null, caminhos: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") op.json = true;
    else if (a === "--diff") {
      op.diff = argv[++i];
      if (!op.diff || op.diff.startsWith("--")) throw new ErroDeUso("--diff precisa de uma ref (ex.: --diff \"$(git merge-base origin/main HEAD)\")");
    } else if (a === "-h" || a === "--help") op.ajuda = true;
    else if (a.startsWith("-")) throw new ErroDeUso(`opção desconhecida: ${a}`);
    else op.caminhos.push(a);
  }
  if (!op.ajuda && !op.diff && !op.caminhos.length) throw new ErroDeUso("dá pelo menos um caminho, ou --diff <ref>");
  return op;
}

const AJUDA = `uso: node detetar-slop.mjs [--json] (<ficheiro|pasta>... | --diff <ref> [caminhos...])
Analisa ${EXTENSOES.join(" ")} (sem testes) e, só pelas regras de texto, os ficheiros
de tradução (${EXT_TRADUCAO_SEMPRE.join(" ")}; ${EXT_TRADUCAO_SE_PASTA.join(" ")} em pastas de tradução).
Com --diff, conta só as linhas alteradas (e os ficheiros novos inteiros); o resto é «pré-existente».
Sai 0 sem bloqueios, 1 com bloqueios, 2 se não conseguiu analisar ou não analisou nada.
Escape: «slop-ok: <motivo>» num comentário na linha do achado (ou sozinho na anterior);
para um bloco, «slop-ok-bloco: <motivo>» … «slop-ok-fim».
Emoji como dado (valor só de emoji numa lista/objeto, chave de conteúdo) e gradientes de marca
declarados em .agentic/ui.json ({"gradientes_marca": ["--grad-marca"]}) não bloqueiam e listam-se.`;

const linhaDeAchado = (a) => `${a.ficheiro}:${a.linha}  ${a.severidade}  ${a.regra}  ${a.mensagem}\n    → ${a.sugestao}`;

export function correr(argv) {
  const op = lerArgumentos(argv);
  if (op.ajuda) return { codigo: 0, texto: AJUDA };
  const sel = { ficheiros: [], naoAnalisados: [] };
  if (op.diff) Object.assign(sel, alteradosDesde(op.diff, op.caminhos));
  else for (const c of op.caminhos) percorrer(c, sel, c);
  const decl = lerDeclaracao(raizDoProjeto());
  const permitidos = [];
  const achados = [];
  const preexistentes = [];
  const sombras = [];
  const escapes = [];
  let escapesPreexistentes = 0;
  for (const { f, traducao, alteradas } of sel.ficheiros) {
    let texto;
    try {
      texto = readFileSync(f, "utf8");
    } catch (e) {
      throw new ErroDeUso(`não consegui ler ${f}: ${e.message}`);
    }
    const r = analisar(path.relative(process.cwd(), f) || f, texto, traducao, decl);
    const novo = (linha) => alteradas === null || alteradas === "todas" || alteradas.has(linha);
    for (const a of r.achados) (novo(a.linha) ? achados : preexistentes).push(a);
    for (const p of r.permitidos) if (novo(p.linha)) permitidos.push(p);
    for (const s of r.sombras) sombras.push({ ...s, nova: novo(s.linha) });
    for (const e of r.escapes) {
      if (novo(e.linha)) escapes.push(e);
      else escapesPreexistentes++;
    }
  }
  // Uma sombra grande é uma camada que flutua; três ou mais são «sombra em tudo».
  if (sombras.length >= 3) {
    for (const s of sombras) {
      (s.nova ? achados : preexistentes).push({ ficheiro: s.ficheiro, linha: s.linha, regra: "sombra-grande", severidade: "aviso", mensagem: `${s.mensagem} (${sombras.length} no conjunto)`, sugestao: REGRAS["sombra-grande"].sugestao, trecho: s.trecho });
    }
  }
  const ordem = (a, b) => a.ficheiro.localeCompare(b.ficheiro) || a.linha - b.linha || (a.regra ?? "").localeCompare(b.regra ?? "");
  achados.sort(ordem);
  preexistentes.sort(ordem);
  escapes.sort(ordem);
  permitidos.sort(ordem);
  const porRegra = {};
  for (const a of achados) porRegra[a.regra] = (porRegra[a.regra] ?? 0) + 1;
  const bloqueios = achados.filter((a) => a.severidade === "bloqueio").length;
  const naoAnalisados = sel.naoAnalisados.map(({ f, motivo }) => ({ ficheiro: path.relative(process.cwd(), f) || f, motivo }));
  const nada = sel.ficheiros.length === 0;
  const resumo = { ficheiros: sel.ficheiros.length, bloqueios, avisos: achados.length - bloqueios, porRegra, preexistentes: preexistentes.length, escapes: escapes.length, escapesPreexistentes, permitidos: permitidos.length, naoAnalisados: naoAnalisados.length };
  // Falha fechada: o que não se leu nunca sai como limpo.
  const codigo = bloqueios > 0 ? 1 : nada || naoAnalisados.length ? 2 : 0;
  if (op.json) return { codigo, texto: JSON.stringify({ resumo, achados, preexistentes, escapes, permitidos, naoAnalisados }, null, 2) };
  const linhas = achados.map(linhaDeAchado);
  if (preexistentes.length) {
    linhas.push(`Pré-existentes (linhas que o diff não tocou; não contam para a saída, ficam numa linha do relatório, não vão para o backlog):`);
    for (const a of preexistentes) linhas.push(`  ${a.ficheiro}:${a.linha}  ${a.severidade}  ${a.regra}  ${a.mensagem}`);
  }
  if (escapes.length) {
    linhas.push(`Escapes usados (cada motivo tem de ser uma decisão do projeto):`);
    for (const e of escapes) linhas.push(`  ${e.ficheiro}:${e.linha}${e.ate > e.linha ? `-${e.ate}` : ""}  «${e.motivo}»  cala: ${e.cala.length ? e.cala.join(", ") : "nada (escape sem uso)"}`);
  }
  if (permitidos.length) {
    linhas.push(`Permitidos sem escape (emoji como dado, gradiente de marca declarado; o revisor confirma cada um):`);
    for (const p of permitidos) linhas.push(`  ${p.ficheiro}:${p.linha}  ${p.regra}  ${p.motivo}`);
  }
  if (naoAnalisados.length) {
    linhas.push(`Não analisados (passa-os à mão contra o ui-sem-slop.md §2; não contam como limpos):`);
    for (const n of naoAnalisados) linhas.push(`  ${n.ficheiro}  ${n.motivo}`);
  }
  linhas.push(`${sel.ficheiros.length} ficheiro(s) analisado(s): ${bloqueios} bloqueio(s), ${resumo.avisos} aviso(s).`);
  const extra = [preexistentes.length && `${preexistentes.length} pré-existente(s)`, (escapes.length || escapesPreexistentes) && `${escapes.length} escape(s) usado(s)${escapesPreexistentes ? ` (+${escapesPreexistentes} em linhas não tocadas)` : ""}`, permitidos.length && `${permitidos.length} permitido(s) sem escape`, naoAnalisados.length && `${naoAnalisados.length} não analisado(s)`].filter(Boolean);
  if (extra.length) linhas.push(extra.join(" · ") + ".");
  if (nada) linhas.push("Nada analisado: isto não é prova de limpo (saída 2).");
  return { codigo, texto: linhas.join("\n") };
}

// O Node resolve a ligação simbólica do módulo principal (a instalação --ligar): compara-se o caminho real.
const caminhoReal = (p) => {
  try {
    return realpathSync(p);
  } catch {
    return path.resolve(p);
  }
};

if (process.argv[1] && caminhoReal(process.argv[1]) === caminhoReal(fileURLToPath(import.meta.url))) {
  try {
    const { codigo, texto } = correr(process.argv.slice(2));
    process.stdout.write(texto + "\n");
    process.exitCode = codigo;
  } catch (e) {
    if (e instanceof ErroDeUso) {
      process.stderr.write(`detetar-slop: ${e.message}\n${AJUDA}\n`);
      process.exitCode = 2;
    } else {
      process.stderr.write(`detetar-slop: erro inesperado: ${e.stack || e}\n`);
      process.exitCode = 2;
    }
  }
}
