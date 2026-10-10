/**
 * All client-side behaviour for the site: navigation drawer, copy-to-clipboard
 * and the "On this page" current-section indicator. Plain DOM, no framework.
 * Every page is fully usable without this script; it only adds conveniences.
 */

function initDrawer(): void {
  const drawer = document.getElementById('site-drawer');
  if (!(drawer instanceof HTMLDialogElement)) return;
  const openers = document.querySelectorAll<HTMLButtonElement>('[data-nav-open]');

  const setExpanded = (value: boolean) =>
    openers.forEach((b) => b.setAttribute('aria-expanded', String(value)));

  openers.forEach((btn) =>
    btn.addEventListener('click', () => {
      drawer.showModal();
      setExpanded(true);
    }),
  );

  drawer.querySelectorAll('[data-nav-close]').forEach((btn) =>
    btn.addEventListener('click', () => drawer.close()),
  );

  // Click on the backdrop (the dialog element itself, outside its content box).
  drawer.addEventListener('click', (event) => {
    if (event.target !== drawer) return;
    const r = drawer.getBoundingClientRect();
    const inside =
      event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
    if (!inside) drawer.close();
  });

  // Same-page anchors (e.g. /#overview on the home page) should close the drawer.
  drawer.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) =>
    a.addEventListener('click', () => drawer.close()),
  );

  // showModal() makes the page inert, but Tab can still leave for the browser
  // chrome after the last control. Wrap focus so it cycles within the drawer.
  drawer.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  drawer.addEventListener('close', () => setExpanded(false));

  // If the viewport grows past the drawer breakpoint, the drawer is redundant.
  const wide = window.matchMedia('(min-width: 900px)');
  wide.addEventListener('change', (e) => {
    if (e.matches && drawer.open) drawer.close();
  });
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    // Deprecated but still the only option on plain-http origins (e.g. a LAN preview).
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

function initCopy(): void {
  const live = document.createElement('div');
  live.className = 'sr-only';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);

  document.querySelectorAll<HTMLButtonElement>('button[data-copy]').forEach((btn) => {
    const label = btn.querySelector<HTMLElement>('[data-copy-label]');
    const idle = label?.textContent ?? 'Copy';
    let timer: number | undefined;

    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy ?? '';
      const ok = text.length > 0 && (await writeClipboard(text));
      btn.dataset.state = ok ? 'copied' : 'failed';
      if (label) label.textContent = ok ? 'Copied' : 'Copy failed';
      live.textContent = ok ? 'Copied to clipboard' : 'Copy failed — select the text manually';
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        delete btn.dataset.state;
        if (label) label.textContent = idle;
        live.textContent = '';
      }, 2000);
    });
  });
}

function initTocSpy(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>('[data-toc] a[href^="#"]');
  if (links.length === 0 || !('IntersectionObserver' in window)) return;

  const ids = [...new Set([...links].map((a) => decodeURIComponent(a.hash.slice(1))))];
  const headings = ids
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null);
  const visible = new Set<string>();

  const mark = (id: string | undefined) => {
    links.forEach((a) => {
      if (id && a.hash === `#${id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      }
      // First visible heading in document order; otherwise keep the last one passed.
      const firstVisible = headings.find((h) => visible.has(h.id));
      if (firstVisible) return mark(firstVisible.id);
      const passed = headings.filter((h) => h.getBoundingClientRect().top < 0);
      mark(passed.at(-1)?.id);
    },
    { rootMargin: '-70px 0px -55% 0px' },
  );
  headings.forEach((h) => observer.observe(h));
}

initDrawer();
initCopy();
initTocSpy();
