# flowprint-site

The product site and documentation for **Flowprint**, a private-alpha CLI that statically maps
Next.js applications, made by **noulfan.** (maker signature, not a rename of the CLI).

Static Astro site: TypeScript and plain CSS, no client framework, no backend, no analytics,
no remote fonts or images. The CLI's own repository is
[gianagni/flowprint](https://github.com/gianagni/flowprint), and nothing here changes it.

## Commands

Needs Node.js 22.12 or newer (Astro 7's requirement).

```sh
npm install
npm run dev          # http://localhost:4321
npm run build        # static output in dist/
npm run preview      # serve dist/ on http://localhost:4321

npm run check        # astro check (TypeScript + templates)
npm run test:links   # post-build checks over dist/ (links, anchors, claims)
npm run test:e2e     # Playwright interaction tests (starts preview automatically)
npm test             # all of the above, in order
```

Playwright uses `/opt/pw-browsers/chromium` when present, or `CHROMIUM_PATH`. Otherwise run
`npx playwright install chromium` once.

## Routes

| Route                  | Page                    |
| ---------------------- | ----------------------- |
| `/`                    | Landing                 |
| `/docs`                | Documentation overview  |
| `/docs/quick-start`    | Quick Start             |
| `/docs/first-analysis` | First Analysis          |
| `/docs/reading-output` | Reading the Output      |
| `/docs/cli-reference`  | CLI Reference           |
| `/docs/limitations`    | Supported & Limitations |
| anything else          | Branded `404.html`      |

## Layout

```
src/data/site.ts        version, repo URL, Node engines, checksum, docs order (single source)
src/styles/global.css   design tokens, type, code blocks, article typography
src/layouts/            BaseLayout (shell) and DocsLayout (sidebar, hero band, TOC, prev/next)
src/components/         header, footer, mobile drawer, sidebar, TOC, code block, terminal, notice
src/scripts/site.ts     drawer, copy-to-clipboard, current-section TOC (the only client JS)
src/lib/terminal.ts     build-time highlighting of captured CLI output
src/pages/              one .astro file per route
samples/                synthetic fixtures + captured CLI output used by the pages
scripts/check-site.mjs  dependency-free post-build checks
tests/site.spec.ts      Playwright tests
```

To add a docs page, add an entry to `docs` in `src/data/site.ts`, then create the page with
`DocsLayout`. The sidebar, drawer, breadcrumbs and previous/next links pick it up from that entry.

## Content truth

Technical copy follows the verified Flowprint `0.1.0-alpha.5` tester quick start and the
limits/distribution notes, not the Stitch exports. Wherever those sources were unclear, the CLI
source at `alpha-5-dev` (commit `11b7b3a`) was read to settle it: the help text, exit codes and
`--app` matching order.

**Every terminal report on the site is real CLI output.** It was captured from that commit
against small synthetic fixtures in `samples/fixtures/`. See `samples/README.md` and
`samples/capture.sh` to regenerate it after a CLI change. The pages import those files directly,
and the build fails if an expected section disappears.

`npm run test:links` fails the build on:

- placeholder `href="#"` links, broken links or broken anchors
- remote scripts or images
- copyable `npx flowprint` commands that use an option alpha.5 doesn't have
- known-false claims from the Stitch drafts (Node 18, `npm link`, air-gapped, `[C]` label, …)
- any version other than alpha.5

## Decisions

- **Astro, static output.** Gives real routes, shared layouts and image optimisation, and
  ships almost no JavaScript (one small module).
- **Fonts:** Instrument Serif, Inter and JetBrains Mono, as the PRD prescribes, self-hosted
  through Fontsource. Ligatures are off for monospace text so that `>=` never renders as `≥`.
- **Hero image:** the supplied twilight landscape, stored as a JPEG source. Astro generates
  AVIF and WebP versions at 640, 960 and 1376 px, and a gradient overlay keeps the text readable.
- **Search:** left out. Six pages don't need it, and the brief rules out an inert search box.
- **No OS tabs:** the checksum commands are shown as labelled blocks per OS. Install commands
  are the same in every shell, as the verified quick start states.
- **Mobile navigation:** a native `<dialog>` opened with `showModal()`, plus a Tab wrap. Escape
  closes it, the rest of the page is inert, and focus returns to the menu button.
- **`compressHTML: false`:** Astro 7's compression glued words to links ("in<a>").
- **`noindex`:** stays on until a public launch is approved (`noindex` in `src/data/site.ts`).

## Not done here

No deployment, hosting config, domain or analytics. Nothing has been merged into `main`.
