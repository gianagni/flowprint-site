// @ts-check
import { defineConfig } from 'astro/config';

// Static-first: every route is pre-rendered to HTML at build time.
// No adapter, no server runtime, no client framework.
export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  // Astro's HTML compression drops the line-break whitespace between prose and
  // inline elements ("in<a>"), gluing words together. Readable text wins.
  compressHTML: false,
});
