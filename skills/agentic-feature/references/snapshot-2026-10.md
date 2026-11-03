# Web stack snapshot: October 2026

**Written on**: 2026-10-15 · **Valid until**: 2027-04-15

> **Do not read after 2027-04-15**: research afresh. Until then, starting point for technical
> research (current-research.md), not source. Reverify every decision row at source (Baseline and
> versions change monthly), check lockfile/targets. Refresh is a separate human-proposed task
> (How to refresh), never within a feature.
>
> Here: JavaScript language/frameworks. Web platform (CSS, HTML/DOM, accessibility, performance,
> Interop) belongs to agentic-design: `<agentic-design>/references/web-platform-2026-10.md`.
> **Changes within validity**: set-methods becomes Widely on 2026-12-11.

- [Reading states](#reading-states)
- [JavaScript (language)](#javascript-language)
- [Frameworks and tools](#frameworks-and-tools)
- [Not confirmed](#not-confirmed)
- [How to refresh](#how-to-refresh)

## Reading states

**Newly** = supported in all main browsers; **Widely** = 30 months after Newly; **Limited** = at
least one missing (definitions, source and rule in agentic-design web platform snapshot “Reading states”).

## JavaScript (language)

| id | Capability | State | Since / support |
|---|---|---|---|
| `promise-withresolvers` | `Promise.withResolvers()` | **Widely** | Widely 2026-09-05 |
| `array-fromasync` | `Array.fromAsync()` | **Widely** | Widely 2026-07-25 |
| `set-methods` | Set union/intersection/… | **Newly** | 2024-06-11 |
| `iterator-methods` | Iterator helpers (.map, .filter on iterators) | **Newly** | 2025-03-31 |
| `promise-try` | `Promise.try()` | **Newly** | 2025-01-07 |
| `uint8array-base64-hex` | Uint8Array.fromBase64()/toBase64()/hex | **Newly** | 2025-09-05 |
| `regexp-escape` | `RegExp.escape()` | **Newly** | 2025-05-01 |
| `temporal` | Temporal | Limited | Chrome 144, Firefox 139; no Safari |
| `explicit-resource-management` | using / Symbol.dispose | Limited | Chrome 134, Firefox 141; no Safari |
| `top-level-await` | module top-level await | **Newly** | 2026-09-14 (Chrome 89, Firefox 89, Safari 27) |

Top-level await: Chrome/Firefox since 89, but BCD marks Safari 15–26 partial (multiple modules
importing a top-level-await module; WebKit bug 242740); full support Safari 27 explains recent Newly date.

## Frameworks and tools

Versions: npm registry latest on 2026-10-15 (`https://registry.npmjs.org/<package>`).

**React** — react@latest = **19.3.1** (published 2026-10-14).
- 19.3 (2026-09-09, <https://react.dev/blog/2026/09/09/react-19-3>): stable DOM-only ViewTransition
  and addTransitionType; Fragment refs; react-dom browser() to exclude component from server
  rendering; Trusted Types; direct Context rendering in Server Components. No declared breaking
  changes; post lists behavior changes (Strict Mode invokes Effects twice during hydration).
- 19.2 (2025-10-01): Activity, useEffectEvent, Performance Tracks.
- React Compiler v1.0 stable (2025-10-07 blog).
- Security: critical RSC RCE (2025-12-03 blog; fixes 19.0.1, 19.1.2, 19.2.1), two more 2025-12-11
  (<https://react.dev/blog>). Confirm project version above fixes.

**Next.js** — next@latest = **16.4.1** (published 2026-10-14).
- 16.4 (2026-10-06, <https://nextjs.org/blog/next-16-4>): Cache Components recommended everywhere,
  default in create-next-app (cacheComponents: true, partialPrefetching: true); Next 17 standard.
  New export const ensureStatic ('navigation' | 'prefetch' | 'shell'), navigation()/prefetch() in
  next/cache, next upgrade --agent. Includes React 19.3. Experimental Rust React compiler
  (experimental.turbopackRustReactCompiler, since 16.3), turbopackGc, turbopackLazyDynamicImports,
  agentUpgrade, agentFeedback (default in new create-next-app apps).
- 16.0 (2025-10-21): Cache Components, stable Turbopack, React Compiler support. 16.2 (2026-03-18):
  stable Adapter API, AGENTS.md in create-next-app. 16.3 (2026-08-03): opt-in Instant Navigations;
  preview post 2026-06-25 (<https://nextjs.org/blog>).
- Security: CVE-2025-66478 (2025-12-03 advisory), 2025-12-11 update.

**Vite** — vite@latest = **8.3.4** (published 2026-10-08).
- 8.0 (2026-03-12, <https://vite.dev/blog/announcing-vite8>): single Rolldown bundler (replaces
  esbuild dev/Rollup build), Oxc compiler; Node 20.19+ or 22.12+; ESM-only distribution;
  compatibility converts esbuild/rollupOptions config; @vitejs/plugin-react v6 (v5 still works).
  Read Migration Guide; large projects first use rolldown-vite on Vite 7.

**TypeScript** — typescript@latest = **7.0.2** (published 2026-07-08).
- 7.0 (2026-07-08, <https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/>): native
  Go port, same typescript package/tsc binary; post measures ~8–12× build gains (10.6–16.7× with
  --checkers 8). New defaults strict on, module: esnext, types: [], rootDir: ./.
  Removed target: es5, downlevelIteration, baseUrl, moduleResolution: node/node10, import asserts
  (deprecated in 6.0); moduleResolution: classic, amd/umd/systemjs/none already removed in 6.0.
  **No programmatic API** until 7.1: tools needing it use @typescript/typescript6 (tsc6); Vue,
  Svelte, Astro, MDX tools and Angular template checks still depend on 6.0.
- 6.0 (2026-03-23): last JavaScript-codebase version; prepares 7 migration.

**browserslist** — latest 4.29.3 (2026-09-29). Baseline queries:
`baseline widely available`, `baseline newly available`, `baseline 2024`,
`baseline widely available on YYYY-MM-DD` (<https://github.com/browserslist/browserslist>).

## Not confirmed

- **Vite 8.1–8.3 changes**: 8.1 announcement (2026-06-23) not read; 8.2.0 (2026-07-30) and 8.3.0
  (2026-09-10) have no blog posts.

## How to refresh

Separate proposed task, never within feature or writing installed skill folder without OK.
Refresh web-platform snapshot in same task using its How to refresh.

1. JavaScript Baseline: download latest npm web-features, read features[<id>].status
   (baseline high=Widely, low=Newly, false=Limited).
2. Versions: registry.npmjs.org/<package> → dist-tags.latest, time[<version>].
3. Changes: official framework blogs/release notes since this file's date.
4. New snapshot-<yyyy-mm>.md with Written on/Valid until (+6 months), sources each row;
   unconfirmed under Not confirmed. Agents select latest:
   `ls <skill-folder>/references/snapshot-*.md | sort | tail -1`.
