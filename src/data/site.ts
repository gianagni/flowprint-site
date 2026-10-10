/**
 * Single source for facts repeated across the site. Anything technical here
 * must match Flowprint 0.1.0-alpha.5 (see samples/README.md and the verified
 * private-tester quick start). Change it here, not in individual pages.
 */
export const product = {
  name: 'Flowprint',
  maker: 'noulfan.',
  version: '0.1.0-alpha.5',
  status: 'Private alpha',
  repoUrl: 'https://github.com/gianagni/flowprint',
  nodeEngines: '^20.19.0 || >=22.12.0',
  tarball: 'flowprint-0.1.0-alpha.5.tgz',
  tarballSha256: '80a9f0ecf43e4606dc02ac325c18d6b2587cfbd8e8a23c963b9fffc65b61cda9',
  /** CLI source commit the website's terminal samples were captured from. */
  sampleCommit: '11b7b3a',
} as const;

/** Keep the site out of search indexes until a public launch is approved. */
export const noindex = true;

export interface DocPage {
  href: string;
  title: string;
  group: string;
  summary: string;
}

/** Sidebar order is reading order; previous/next links derive from it. */
export const docs: DocPage[] = [
  {
    href: '/docs',
    title: 'Overview',
    group: 'Orientation',
    summary: 'What Flowprint is, what it is not, and where to start.',
  },
  {
    href: '/docs/quick-start',
    title: 'Quick Start',
    group: 'Orientation',
    summary: 'Verify and install the private-alpha tarball in a separate folder.',
  },
  {
    href: '/docs/first-analysis',
    title: 'First Analysis',
    group: 'Using Flowprint',
    summary: 'Point Flowprint at a Next.js repository and walk through the report.',
  },
  {
    href: '/docs/reading-output',
    title: 'Reading the Output',
    group: 'Using Flowprint',
    summary: 'What [R], [I], [U] and Coverage mean — and what they do not.',
  },
  {
    href: '/docs/cli-reference',
    title: 'CLI Reference',
    group: 'Reference',
    summary: 'Every supported invocation, option, and exit code in alpha.5.',
  },
  {
    href: '/docs/limitations',
    title: 'Supported & Limitations',
    group: 'Reference',
    summary: 'Supported scope, known limitations, and what has been tested.',
  },
];

export const docGroups = [...new Set(docs.map((d) => d.group))];

export function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function docNeighbours(href: string) {
  const i = docs.findIndex((d) => d.href === href);
  return {
    prev: i > 0 ? docs[i - 1] : undefined,
    next: i >= 0 && i < docs.length - 1 ? docs[i + 1] : undefined,
  };
}
