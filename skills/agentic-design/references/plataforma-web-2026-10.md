# Plataforma web para UI: outubro de 2026

**Escrito a**: 2026-10-15 · **Válido até**: 2027-04-15

> **Depois de 2027-04-15 não leias este ficheiro**: pesquisa de raiz. Até lá, é um ponto de
> partida para escolher as capacidades da plataforma que a UI usa (camadas que flutuam, temas,
> grelhas, transições, alvos de acessibilidade), não uma fonte. Antes de usar qualquer linha numa
> decisão, re-verifica-a na fonte (o estado Baseline muda todos os meses) e confirma-a contra os
> browsers-alvo do projeto. Refrescá-lo é uma tarefa à parte, proposta ao humano (ver «Como
> refrescar»): nunca dentro de uma feature.
>
> **Já mudaram ou mudam dentro da validade** (passam de Newly a Widely, 30 meses depois): `light-dark`
> e `text-wrap-balance` a 2026-11-13; `starting-style` a 2027-02-06; `details-name` a 2027-03-03;
> `relative-color` a 2027-03-16. Depois dessas datas, a coluna «Estado» dessas linhas está errada.
> As linhas Limited ligadas a versões futuras (Safari 27, Firefox 15x) podem mudar em qualquer mês.
>
> A linguagem JavaScript e os frameworks (React, Next.js, Vite, TypeScript, browserslist) estão no
> instantâneo da stack, na `agentic-feature`.

- [Como ler os estados](#como-ler-os-estados)
- [CSS](#css)
- [HTML e APIs do DOM](#html-e-apis-do-dom)
- [Acessibilidade](#acessibilidade)
- [Desempenho](#desempenho)
- [Interop 2026](#interop-2026)
- [Não confirmado](#não-confirmado)
- [Como refrescar](#como-refrescar)

## Como ler os estados

Definições de web.dev/baseline (lidas a 2026-10-15, <https://web.dev/baseline>): browsers principais
= Chrome (computador e Android), Edge, Firefox (computador e Android), Safari (macOS e iOS).
**Newly** = suportado em todos; **Widely** = 30 meses depois de Newly; **Limited** = falta pelo
menos um. Os anos (ex.: «Baseline 2024») agrupam o que ficou Newly nesse ano.

Fonte dos estados abaixo, salvo indicação: pacote npm `web-features` **3.43.0**, publicado a
2026-10-15 (<https://registry.npmjs.org/web-features>), o conjunto de dados do WebDX CG do W3C que
alimenta o MDN, o caniuse e o webstatus.dev. Para re-verificar uma linha, lê a API JSON
`https://api.webstatus.dev/v1/features/<id>` (o `<id>` está na primeira coluna); a página
`https://webstatus.dev/features/<id>` só desenha com JS e um leitor de páginas recebe-a vazia.
As versões entre parênteses são a primeira versão com suporte completo segundo esses dados.

Regra prática: **Widely** usa-se se os alvos do projeto são `baseline widely available` ou mais
recentes; **Newly** usa-se se os browsers-alvo do projeto o cobrem; **Limited** só como melhoria
progressiva (a página funciona sem ela). Se os alvos incluem WebViews (Android, tablets em modo
quiosque, Electron) ou browsers fora dos principais, o Baseline não chega: confirma no
browser-compat-data.

## CSS

| id | Capacidade | Estado | Desde / suporte |
|---|---|---|---|
| `container-queries` | Container queries de tamanho (`@container`, `container-type`) | **Widely** | Newly 2023-02-14, Widely 2025-08-14 |
| `container-style-queries` | Container queries de estilo (`style(--x: y)`) | **Newly** | 2026-05-19 (Chrome 111, Firefox 151, Safari 18) |
| `container-scroll-state-queries` | Container queries de estado de scroll | Limited | só Chromium (Chrome 133) |
| `has` | `:has()` | **Widely** | Newly 2023-12-19, Widely 2026-06-19 |
| `subgrid` | `grid-template-*: subgrid` | **Widely** | Newly 2023-09-15, Widely 2026-03-15 |
| `scope` | `@scope` | **Newly** | 2026-03-24 (Chrome 143, Firefox 146, Safari 26.4) |
| `nesting` | Nesting nativo | **Widely** | Newly 2023-12-11, Widely 2026-06-11 |
| `cascade-layers` | `@layer` | **Widely** | Widely 2024-09-14 |
| `color-mix` | `color-mix()` | **Widely** | Widely 2025-11-09 |
| `oklab` | `oklab()` / `oklch()` | **Widely** | Widely 2025-11-09 |
| `relative-color` | Cores relativas (`oklch(from var(--c) …)`) | **Newly** | 2024-09-16 |
| `light-dark` | `light-dark()` | **Newly** | 2024-05-13 |
| `light-dark-image` | `light-dark()` com imagens | **Newly** | 2026-09-14 (Chrome 150, Firefox 150, Safari 27) |
| `view-transitions` | View transitions no mesmo documento (`document.startViewTransition`) | **Newly** | 2025-10-14 (Chrome 111, Firefox 144, Safari 18) |
| `view-transition-class` | `view-transition-class` | **Newly** | 2025-10-14 |
| `active-view-transition` | `:active-view-transition` e tipos de transição | **Newly** | 2026-01-13 |
| `view-transitions-element-scoped` | View transitions limitadas a um elemento | Limited | só Chromium (Chrome 147) |
| `cross-document-view-transitions` | View transitions entre documentos (`@view-transition`) | Limited | Chrome 126, Safari 18.2; sem Firefox |
| `anchor-positioning` | Anchor positioning | Limited (ver nota) | núcleo em Chrome 125, Firefox 147, Safari 26 |
| `scroll-driven-animations` | Animações guiadas por scroll (`animation-timeline`) | Limited | Chrome 115, Safari 26; sem Firefox |
| `starting-style` | `@starting-style` | **Newly** | 2024-08-06 |
| `field-sizing` | `field-sizing: content` | **Newly** | 2026-06-16 (Chrome 123, Firefox 152, Safari 26.2) |
| `text-wrap-balance` | `text-wrap: balance` | **Newly** | 2024-05-13 |
| `text-wrap-pretty` | `text-wrap: pretty` | Limited | Chrome 117, Safari 26; sem Firefox |
| `content-visibility` | `content-visibility` | **Newly** | 2025-09-15 |
| `sibling-count` | `sibling-count()` / `sibling-index()` | **Newly** | 2026-08-18 |
| `shape-function` | `shape()` | **Newly** | 2026-02-24 |
| `scrollbar-gutter` | `scrollbar-gutter` | **Newly** | 2024-12-11 |
| `interpolate-size` | `interpolate-size` (animar para `auto`) | Limited | só Chromium (Chrome 129) |
| `customizable-select` | `<select>` estilizável (`appearance: base-select`) | Limited | Chrome 135, Safari 27; sem Firefox |
| `if` | `if()` em CSS | Limited | só Chromium (Chrome 137) |

**Nota sobre anchor positioning**: o núcleo (`anchor-name`, `anchor()`, `position-try`) está em
Chrome 125, Firefox 147 e Safari 26. Fora do núcleo as versões variam: das 325 chaves de
compatibilidade, 120 pedem Chrome 125 e 110 pedem Chrome 129 (ex.: `position-area` e
`position-try-fallbacks` com palavras-chave); as restantes pedem Chrome 128 a 151; 39 pedem
Firefox 148 e 34 pedem Safari 26.2. As datas Newly por chave vão de 2026-01-13 a 2026-09-14. O
agregado continua Limited porque `position-visibility: anchor-valid | anchor-visible` só tem
suporte declarado no Safari 27. Na prática, o posicionamento básico de tooltips e menus por âncora
cobre os três motores, com uma ressalva: o BCD marca `position-anchor` como parcial (o valor
inicial não é `normal`) até Chrome 151, Firefox 151 e Safari 27, por isso, antes dessas versões,
usa um `--nome` explícito. Confirma as subfeatures exatas que vais usar em
`features["anchor-positioning"].status.by_compat_key` (`web-features` 3.43.0).

**Nota sobre `@scope`**: o BCD marca o Safari 26.0–26.3 como parcial (as regras em `@scope` não se
aplicam a `<input>`/`<textarea>`); o suporte completo chega no 26.4, e o agregado pede Chrome 143
por causa de `css.selectors.nesting.at-scope`. Daí a data Newly recente.

## HTML e APIs do DOM

| id | Capacidade | Estado | Desde / suporte |
|---|---|---|---|
| `dialog` | `<dialog>` | **Widely** | Widely 2024-09-14 |
| `dialog-closedby` | `<dialog closedby>` | Limited | Chrome 134, Firefox 141; sem Safari |
| `popover` | Atributo `popover` | **Newly** | 2025-01-27 |
| `popover-hint` | `popover="hint"` | Limited | Chrome 151, Firefox 153; sem Safari |
| `invoker-commands` | `command` / `commandfor` em botões | **Newly** | 2025-12-12 (Chrome 135, Firefox 144, Safari 26.2) |
| `interest-invokers` | `interestfor` (abrir ao passar/focar) | Limited | só Chromium (Chrome 142) |
| `details-name` | `<details name>` (acordeão exclusivo) | **Newly** | 2024-09-03 |
| `details-content` | `::details-content` | **Newly** | 2025-09-16 (Chrome 131, Firefox 143, Safari 18.4) |
| `inert` | Atributo `inert` | **Widely** | Widely 2025-10-11 |
| `navigation` | Navigation API (`navigation.navigate`, evento `navigate`) | **Newly** | 2026-01-13 (Chrome 102, Firefox 147, Safari 26.2) |
| `speculation-rules` | Speculation Rules (`<script type="speculationrules">`) | Limited | só Chromium (Chrome 109) |
| `urlpattern` | `URLPattern` | **Newly** | 2025-09-15 |
| `scheduler` | Prioritized Task Scheduling (`scheduler.postTask` / `yield`) | Limited | Chrome 129, Firefox 142; sem Safari |

Speculation Rules: o MDN marca-a como experimental e *limited availability*, e descreve-a como
melhoria progressiva com deteção (`HTMLScriptElement.supports('speculationrules')`) e
alternativa `<link rel="prefetch">`
(<https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API>, lido a 2026-10-15).

## Acessibilidade

- **WCAG 2.2** é a Recomendação W3C em vigor: publicada a 2023-10-05, atualizada a 2024-12-12.
  **WCAG 3** continua rascunho, não Recomendação
  (<https://www.w3.org/WAI/standards-guidelines/wcag/>, lido a 2026-10-15).
- Alvo por omissão a propor nas perguntas de UI: WCAG 2.2 nível AA.
- **Tamanho dos alvos** (WCAG 2.2): o critério 2.5.8 *Target Size (Minimum)*, nível AA, pede
  ≥ 24 × 24 px CSS, com exceções (espaçamento, controlo equivalente, ligação dentro de texto,
  controlo do browser, essencial); o 2.5.5 *Target Size (Enhanced)*, nível AAA, pede ≥ 44 × 44 px
  CSS. Valor das skills: **44 px recomendado, 24 px mínimo**
  (<https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html> e
  `…/target-size-enhanced.html`, lidos a 2026-10-16).
- **European Accessibility Act** (Diretiva (UE) 2019/882, art. 31.º, n.os 1 e 2): transposição até
  2022-06-28, aplicação a partir de 2025-06-28
  (<https://publications.europa.eu/resource/celex/32019L0882.ENG.xhtml>). A diretiva não cita a
  EN 301 549; a norma harmonizada está em «Não confirmado».

## Desempenho

- **Core Web Vitals** («bom» no percentil 75, mobile e computador separados): LCP ≤ 2,5 s,
  INP ≤ 200 ms, CLS ≤ 0,1. INP substituiu o FID como métrica estável em 2024. A página diz que as
  métricas estáveis mudam no máximo uma vez por ano (<https://web.dev/articles/vitals>, última
  atualização 2024-10-31, lida a 2026-10-15).
- **INP**: bom ≤ 200 ms, a melhorar ≤ 500 ms, mau > 500 ms; mede cliques, toques e teclas durante
  toda a vida da página, não scroll, hover nem zoom (<https://web.dev/articles/inp>, atualizado
  2025-09-02).
- **Medir em todos os browsers**: a Event Timing API (base do INP) e a Largest Contentful Paint API
  são **Newly** desde 2025-12-12 (Safari 26.2) (`event-timing`, `largest-contentful-paint` em
  `web-features` 3.43.0). A Long Animation Frames API (`long-animation-frames`) e a Layout
  Instability API (`layout-instability`, base do CLS) continuam só em Chromium.

## Interop 2026

Anunciado a 2026-02-12 (<https://web.dev/blog/interop-2026>; também
<https://webkit.org/blog/17818/announcing-interop-2026/>,
<https://hacks.mozilla.org/2026/02/launching-interop-2026/>,
<https://github.com/web-platform-tests/interop/blob/main/2026/README.md>), com 20 áreas de foco
conjuntas da Apple, Google, Igalia, Microsoft e Mozilla. Entre elas: anchor positioning, container
style queries, diálogos e popovers, scroll-driven animations, view transitions, Navigation API,
`shape()`, `attr()`, `contrast-color()`, scroll snap, `zoom`, IndexedDB, WebRTC e WebTransport.
Estar no Interop quer dizer que os motores trabalham nisso este ano, não que já é suportado: o
estado confirma-se nos dados.

## Não confirmado

- **Norma harmonizada do European Accessibility Act**: se já há uma publicada no Jornal Oficial
  ao abrigo da diretiva. Fontes secundárias de 2025 davam a revisão da EN 301 549 como pendente;
  confirmar no EUR-Lex antes de citar.

## Como refrescar

Tarefa à parte, proposta ao humano: nunca dentro de uma feature, e nunca a escrever na pasta da
skill (`<skill>`, onde quer que esteja instalada) sem OK.

1. Estados Baseline: descarrega o `web-features` mais recente do registo npm e lê
   `features[<id>].status` (`baseline`: `"high"` = Widely, `"low"` = Newly, `false` = Limited;
   `baseline_low_date`, `baseline_high_date`, `support`; `by_compat_key` dá o estado de cada
   subfeature).
2. Normas: página da WAI para WCAG; web.dev para Core Web Vitals; EUR-Lex para o EAA.
3. Grava um ficheiro novo, `plataforma-web-<aaaa-mm>.md`, com «Escrito a» e «Válido até» (6 meses
   depois) no cabeçalho, as datas em que linhas Newly passam a Widely dentro da validade, e as
   fontes em cada linha; o que não confirmares vai para «Não confirmado». Os agentes escolhem o
   mais recente com `ls <skill>/references/plataforma-web-*.md | sort | tail -1`. O instantâneo
   da stack (`instantaneo-<aaaa-mm>.md`, na `agentic-feature`) refresca-se na mesma tarefa.
