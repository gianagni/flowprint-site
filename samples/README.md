# CLI output samples

Every terminal report shown on the website is **captured output**, not hand-written text.

- `fixtures/` — two small, synthetic Next.js projects written for the website
  (they are not real applications and not part of any Flowprint test or pilot):
  - `field-notes/` — one app using App Router and Pages Router, a dynamic segment,
    a route group, a `'use server'` module and a middleware rewrite.
  - `harbor-workspace/` — a pnpm workspace with two Next.js apps, used to show
    discovery and `--app` selection.
- `output/` — what `flowprint 0.1.0-alpha.5` printed for those fixtures.

Captured from the Flowprint CLI source at `alpha-5-dev` commit `11b7b3a`
(`flowprint --version` → `flowprint 0.1.0-alpha.5`), run via `tsx` from a
separate read-only checkout. The `analyzed in …s` timings are whatever that machine
measured; they are not benchmarks and vary with hardware and repository size.

To regenerate after a CLI change:

```sh
samples/capture.sh /path/to/flowprint-checkout
```

The pages import these files directly (`?raw`), so a re-capture updates the site on
the next build. Re-read the docs prose afterwards: if section names or labels change,
the explanations around the samples must change too.
