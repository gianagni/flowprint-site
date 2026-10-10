/**
 * Build-time highlighting for captured Flowprint reports. It only wraps what
 * is already in the text (section headings, [R]/[I]/[U] labels, reasons);
 * it never adds or removes content.
 */
const SECTION = /^(Start here|Routes at a glance|Runtime blind spots|Coverage|Next|hint:|## .+)$/;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tags(s: string): string {
  return s.replace(/\[(R|I|U)\]/g, (_m, t: string) => `<span class="tag tag--${t.toLowerCase()}">[${t}]</span>`);
}

export function highlightReport(text: string): string {
  return text
    .replace(/\s+$/, '')
    .split('\n')
    .map((raw) => {
      const line = escapeHtml(raw);
      if (/^=+$/.test(raw)) return `<span class="t-rule">${line}</span>`;
      if (SECTION.test(raw)) return `<span class="t-head">${line}</span>`;
      if (/^Framework\b/.test(raw)) return tags(line.replace(/^Framework/, '<span class="t-head">Framework</span>'));
      if (/^Flowprint \d/.test(raw)) return `<span class="t-head">${line}</span>`;
      if (/^\s+(reason|concrete):/.test(raw)) return `<span class="t-dim">${tags(line)}</span>`;
      return tags(line);
    })
    .join('\n');
}

/** Split a report into its top-level sections (header block first). */
export function splitReport(text: string): { heading: string; body: string }[] {
  const lines = text.replace(/\s+$/, '').split('\n');
  const out: { heading: string; body: string[] }[] = [{ heading: 'Header', body: [] }];
  for (const line of lines) {
    if (/^=+$/.test(line)) continue;
    if (SECTION.test(line) || /^Framework\b/.test(line)) out.push({ heading: /^Framework\b/.test(line) ? 'Framework' : line, body: [] });
    out[out.length - 1].body.push(line);
  }
  return out
    .map((s) => ({ heading: s.heading, body: s.body.join('\n').replace(/^\n+|\n+$/g, '') }))
    .filter((s) => s.body.length > 0);
}

/** Lines from the first line starting with `from` up to (not including) the first line starting with `to`. */
export function excerpt(text: string, from: string, to: string): string {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trimStart().startsWith(from));
  if (start < 0) throw new Error(`excerpt: "${from}" not found in sample output`);
  const end = lines.findIndex((l, i) => i > start && l.trimStart().startsWith(to));
  return lines.slice(start, end < 0 ? undefined : end).join('\n');
}
