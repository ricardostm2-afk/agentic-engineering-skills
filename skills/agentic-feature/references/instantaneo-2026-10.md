# Instantâneo da stack web: outubro de 2026

**Escrito a**: 2026-10-15 · **Válido até**: 2027-04-15

> **Depois de 2027-04-15 não leias este ficheiro**: pesquisa de raiz. Até lá, é um ponto de
> partida para o eixo técnico da pesquisa (`pesquisa-moderna.md`), não uma fonte. Antes de usar
> qualquer linha numa decisão, re-verifica-a na fonte (o estado Baseline e as versões mudam todos
> os meses) e confirma-a contra o lockfile e os alvos do projeto. Refrescá-lo é uma tarefa à
> parte, proposta ao humano (ver «Como refrescar»): nunca dentro de uma feature.
>
> Aqui ficam a linguagem (JavaScript) e os frameworks. A plataforma web (CSS, HTML e DOM,
> acessibilidade, desempenho, Interop) é da `agentic-design`:
> `<agentic-design>/references/plataforma-web-2026-10.md`. **Muda dentro da validade**:
> `set-methods` passa de Newly a Widely a 2026-12-11.

- [Como ler os estados](#como-ler-os-estados)
- [JavaScript (linguagem)](#javascript-linguagem)
- [Frameworks e ferramentas](#frameworks-e-ferramentas)
- [Não confirmado](#não-confirmado)
- [Como refrescar](#como-refrescar)

## Como ler os estados

**Newly** = suportado em todos os browsers principais; **Widely** = 30 meses depois de Newly;
**Limited** = falta pelo menos um (definições, fonte dos estados e regra prática no instantâneo
da plataforma web da `agentic-design`, «Como ler os estados»).

## JavaScript (linguagem)

| id | Capacidade | Estado | Desde / suporte |
|---|---|---|---|
| `promise-withresolvers` | `Promise.withResolvers()` | **Widely** | Widely 2026-09-05 |
| `array-fromasync` | `Array.fromAsync()` | **Widely** | Widely 2026-07-25 |
| `set-methods` | `Set` union/intersection/… | **Newly** | 2024-06-11 |
| `iterator-methods` | Iterator helpers (`.map`, `.filter` em iteradores) | **Newly** | 2025-03-31 |
| `promise-try` | `Promise.try()` | **Newly** | 2025-01-07 |
| `uint8array-base64-hex` | `Uint8Array.fromBase64()` / `toBase64()` / hex | **Newly** | 2025-09-05 |
| `regexp-escape` | `RegExp.escape()` | **Newly** | 2025-05-01 |
| `temporal` | `Temporal` | Limited | Chrome 144, Firefox 139; sem Safari |
| `explicit-resource-management` | `using` / `Symbol.dispose` | Limited | Chrome 134, Firefox 141; sem Safari |
| `top-level-await` | `await` no topo de módulos | **Newly** | 2026-09-14 (Chrome 89, Firefox 89, Safari 27) |

`top-level-await`: Chrome e Firefox têm-no desde a versão 89, mas o BCD marca o Safari 15–26 como
parcial (vários módulos a importar um módulo com `await` no topo; bug WebKit 242740); o suporte
completo chega no Safari 27, daí a data Newly recente.

## Frameworks e ferramentas

Versões: `latest` no registo npm a 2026-10-15 (`https://registry.npmjs.org/<pacote>`).

**React** — `react@latest` = **19.3.1** (publicado 2026-10-14).
- 19.3 (blog, 2026-09-09, <https://react.dev/blog/2026/09/09/react-19-3>): `<ViewTransition>`
  estável (só DOM) e `addTransitionType`; Fragment refs (`<Fragment ref>`); `browser()` de
  `react-dom` para tirar um componente da renderização no servidor; suporte a Trusted Types;
  `<Context>` renderizado diretamente em Server Components. Sem quebras declaradas; mudanças de
  comportamento listadas no post (ex.: Strict Mode invoca Effects duas vezes na hidratação).
- 19.2 (blog, 2025-10-01): `Activity`, `useEffectEvent`, Performance Tracks.
- React Compiler v1.0 estável (blog, 2025-10-07).
- Segurança: vulnerabilidade crítica de RCE em React Server Components (blog, 2025-12-03;
  correções em 19.0.1, 19.1.2, 19.2.1) e mais duas a 2025-12-11 (<https://react.dev/blog>).
  Confirmar que a versão do projeto está acima das corrigidas.

**Next.js** — `next@latest` = **16.4.1** (publicado 2026-10-14).
- 16.4 (blog, 2026-10-06, <https://nextjs.org/blog/next-16-4>): Cache Components recomendado para
  todas as apps e ligado por omissão em `create-next-app` (`cacheComponents: true`,
  `partialPrefetching: true`); será o padrão no Next.js 17. Novos: `export const ensureStatic`
  (`'navigation' | 'prefetch' | 'shell'`), `navigation()` e `prefetch()` de `next/cache`,
  `next upgrade --agent`. Traz React 19.3. Experimentais: compilador React em Rust
  (`experimental.turbopackRustReactCompiler`, já experimental desde o 16.3), `turbopackGc`,
  `turbopackLazyDynamicImports`, `agentUpgrade`, `agentFeedback` (este vem ligado por omissão nas
  apps novas do `create-next-app`).
- 16.0 (2025-10-21): Cache Components, Turbopack estável, suporte ao React Compiler. 16.2
  (2026-03-18): Adapter API estável, `AGENTS.md` no `create-next-app`. 16.3 (2026-08-03):
  Instant Navigations, opt-in; houve um post de pré-visualização a 2026-06-25
  (<https://nextjs.org/blog>).
- Segurança: CVE-2025-66478 (aviso de 2025-12-03) e atualização de 2025-12-11.

**Vite** — `vite@latest` = **8.3.4** (publicado 2026-10-08).
- 8.0 (blog, 2026-03-12, <https://vite.dev/blog/announcing-vite8>): Rolldown como bundler único
  (em vez de esbuild em dev + Rollup em build), Oxc no compilador; Node.js 20.19+ ou 22.12+; Vite
  distribuído só como ESM; camada de compatibilidade converte config `esbuild`/`rollupOptions`;
  `@vitejs/plugin-react` v6 (v5 continua a funcionar). Guia: ler o Migration Guide; em projetos
  grandes, passar primeiro por `rolldown-vite` no Vite 7.

**TypeScript** — `typescript@latest` = **7.0.2** (publicado 2026-07-08).
- 7.0 (blog, 2026-07-08, <https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/>):
  port nativo (Go), pacote continua `typescript` e binário `tsc`; ganhos de build ~8–12× nos
  testes do post (10,6–16,7× com `--checkers 8`). Padrões novos: `strict` ligado, `module: esnext`, `types: []`, `rootDir: ./`.
  Removidos: `target: es5`, `downlevelIteration`, `baseUrl`, `moduleResolution: node/node10`,
  `asserts` em imports (desaconselhados no 6.0); `moduleResolution: classic` e os módulos
  `amd/umd/systemjs/none` já tinham saído no 6.0.
  **Sem API programática** até 7.1: ferramentas que precisam dela usam `@typescript/typescript6`
  (binário `tsc6`); as ferramentas de Vue, Svelte, Astro e MDX e as verificações de templates do
  Angular ainda dependem do 6.0.
- 6.0 (2026-03-23): última versão sobre o código JavaScript; prepara a migração para o 7.

**browserslist** — `latest` = 4.29.3 (2026-09-29). Aceita consultas Baseline:
`baseline widely available`, `baseline newly available`, `baseline 2024`,
`baseline widely available on AAAA-MM-DD` (<https://github.com/browserslist/browserslist>).

## Não confirmado

- **Novidades de Vite 8.1–8.3**: o 8.1 tem anúncio no blog (2026-06-23), mas o conteúdo não foi
  lido; o 8.2.0 (2026-07-30) e o 8.3.0 (2026-09-10) não têm post no blog.

## Como refrescar

Tarefa à parte, proposta ao humano: nunca dentro de uma feature, e nunca a escrever na pasta da
skill (`<skill>`, onde quer que esteja instalada) sem OK. O da plataforma web refresca-se na
mesma tarefa, pelo «Como refrescar» dele.

1. Estados Baseline (JavaScript): descarrega o `web-features` mais recente do registo npm e lê
   `features[<id>].status` (`baseline`: `"high"` = Widely, `"low"` = Newly, `false` = Limited).
2. Versões: `https://registry.npmjs.org/<pacote>` → `dist-tags.latest` e `time[<versão>]`.
3. Novidades: blog/notas de versão oficiais de cada framework, desde a data deste ficheiro.
4. Grava um ficheiro novo, `instantaneo-<aaaa-mm>.md`, com «Escrito a» e «Válido até» (6 meses
   depois) no cabeçalho e as fontes em cada linha; o que não confirmares vai para «Não
   confirmado». Os agentes escolhem o mais recente com
   `ls <pasta da skill>/references/instantaneo-*.md | sort | tail -1`.
