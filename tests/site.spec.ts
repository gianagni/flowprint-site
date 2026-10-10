import { test, expect, type Page } from '@playwright/test';

const DOCS = [
  { href: '/docs', title: 'Overview' },
  { href: '/docs/quick-start', title: 'Quick Start' },
  { href: '/docs/first-analysis', title: 'First Analysis' },
  { href: '/docs/reading-output', title: 'Reading the Output' },
  { href: '/docs/cli-reference', title: 'CLI Reference' },
  { href: '/docs/limitations', title: 'Supported & Limitations' },
];
const ROUTES = ['/', ...DOCS.map((d) => d.href)];
const REPO = 'https://github.com/gianagni/flowprint';

async function overflowX(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test.describe('routes', () => {
  for (const route of ROUTES) {
    test(`${route} loads directly with one h1`, async ({ page }) => {
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
    });
  }

  test('unknown routes get the branded 404', async ({ page }) => {
    const res = await page.goto('/docs/does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Page not found.');
    await page.getByRole('link', { name: /Documentation overview/ }).click();
    await expect(page).toHaveURL(/\/docs\/?$/);
  });
});

test.describe('no horizontal page overflow', () => {
  for (const width of [390, 768, 1440]) {
    test(`at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ROUTES) {
        await page.goto(route);
        expect(await overflowX(page), `${route} @ ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }
});

test.describe('landing', () => {
  test('hero CTAs go to the docs and the repository', async ({ page }) => {
    await page.goto('/');
    const gh = page.locator('.hero').getByRole('link', { name: /View on GitHub/ });
    await expect(gh).toHaveAttribute('href', REPO);
    await expect(gh).toHaveAttribute('target', '_blank');
    await page.locator('.hero').getByRole('link', { name: /Explore the docs/ }).click();
    await expect(page).toHaveURL(/\/docs\/?$/);
  });

  test('"Learn how to read the output" goes to Reading the Output', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Learn how to read the output/ }).click();
    await expect(page).toHaveURL(/\/docs\/reading-output\/?$/);
  });

  test('hero image is served locally', async ({ page }) => {
    await page.goto('/');
    const src = await page.locator('.hero img').evaluate((img: HTMLImageElement) => img.currentSrc);
    expect(new URL(src).origin).toBe('http://localhost:4321');
  });
});

test.describe('header navigation', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Documentation opens /docs and stays active on every docs page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('link', { name: 'Documentation' }).click();
    await expect(page).toHaveURL(/\/docs\/?$/);
    for (const d of DOCS) {
      await page.goto(d.href);
      const nav = page.getByRole('navigation', { name: 'Main', exact: true });
      await expect(nav.getByRole('link', { name: 'Documentation' })).toHaveAttribute('aria-current', 'page');
    }
  });

  test('Product goes to the landing overview', async ({ page }) => {
    await page.goto('/docs/cli-reference');
    await page.getByRole('navigation', { name: 'Main', exact: true }).getByRole('link', { name: 'Product' }).click();
    await expect(page).toHaveURL(/\/#overview$/);
  });
});

test.describe('docs shell', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('sidebar lists all six pages and marks the current one', async ({ page }) => {
    for (const d of DOCS) {
      await page.goto(d.href);
      const side = page.getByRole('navigation', { name: 'Documentation pages' });
      await expect(side.getByRole('link')).toHaveCount(6);
      await expect(side.locator('[aria-current="page"]')).toHaveText(d.title);
    }
  });

  test('previous/next walk the whole docs in order', async ({ page }) => {
    await page.goto(DOCS[0].href);
    for (let i = 1; i < DOCS.length; i++) {
      await page.locator('a[rel="next"]').click();
      await expect(page).toHaveURL(new RegExp(`${DOCS[i].href}/?$`));
    }
    await expect(page.locator('a[rel="next"]')).toHaveCount(0);
    for (let i = DOCS.length - 2; i >= 0; i--) {
      await page.locator('a[rel="prev"]').click();
      await expect(page).toHaveURL(new RegExp(`${DOCS[i].href}/?$`));
    }
  });

  test('breadcrumb returns to the docs overview', async ({ page }) => {
    await page.goto('/docs/limitations');
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Documentation' }).click();
    await expect(page).toHaveURL(/\/docs\/?$/);
  });

  test('"On this page" links scroll to real headings and mark the current section', async ({ page }) => {
    await page.goto('/docs/cli-reference');
    const toc = page.getByRole('navigation', { name: 'On this page', exact: true });
    const link = toc.getByRole('link', { name: /Exit codes/ });
    await link.click();
    await expect(page).toHaveURL(/#exit-codes$/);
    await expect(page.locator('#exit-codes')).toBeInViewport();
    await expect(link).toHaveAttribute('aria-current', 'true');
  });
});

test.describe('copy to clipboard', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('every copy button copies its exact code and announces it', async ({ page }) => {
    await page.goto('/docs/quick-start');
    const buttons = page.locator('button[data-copy]');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(5);
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const expected = await btn.getAttribute('data-copy');
      await btn.click();
      await expect(btn).toHaveAttribute('data-state', 'copied');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    }
    await expect(page.getByRole('status')).toHaveText('Copied to clipboard');
  });

  test('the copied checksum matches the visible checksum', async ({ page }) => {
    await page.goto('/docs/quick-start');
    const block = page.locator('.code', { hasText: '80a9f0ec' }).first();
    const visible = (await block.locator('pre').innerText()).trim();
    await block.getByRole('button').click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(visible);
  });

  test('landing terminal copies only the command', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Copy command/ }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('npx flowprint ./field-notes');
  });
});

test.describe('mobile drawer', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens from the keyboard, traps focus, closes with Escape and restores focus', async ({ page }) => {
    await page.goto('/docs/reading-output');
    const menu = page.getByRole('button', { name: 'Menu' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.focus();
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog', { name: 'Site navigation' });
    await expect(drawer).toBeVisible();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer.locator('[aria-current="page"]', { hasText: 'Reading the Output' })).toBeVisible();

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => !!document.activeElement?.closest('#site-drawer'));
      expect(inside).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
  });

  test('close button and navigation work', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Site navigation' });
    await drawer.getByRole('button', { name: 'Close' }).click();
    await expect(drawer).toBeHidden();
    await page.getByRole('button', { name: 'Menu' }).click();
    await drawer.getByRole('link', { name: 'CLI Reference' }).click();
    await expect(page).toHaveURL(/\/docs\/cli-reference\/?$/);
    await expect(page.locator('h1')).toContainText('CLI Reference');
  });

  test('collapsed "On this page" opens and links work', async ({ page }) => {
    await page.goto('/docs/first-analysis');
    await page.getByText(/On this page · \d+ sections/).click();
    await page.getByRole('navigation', { name: 'On this page (collapsible)' }).getByRole('link', { name: /--full/ }).click();
    await expect(page).toHaveURL(/#full$/);
  });
});
