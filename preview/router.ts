/**
 * موجّه المعاينة: صفحة واحدة تتنقل عبر #اسم (قيود صفحات claude.ai).
 * يحوّل مسارات الموقع الحقيقية (/products/x/) إلى روابط # والعكس، ويحفظ معاملات البحث في الذاكرة.
 */
type RouteState = { path: string; search: string };

const routes: { hash: RegExp; toPath: (m: RegExpMatchArray) => string; path: RegExp; toHash: (m: RegExpMatchArray) => string }[] = [
  { hash: /^(home)?$/, toPath: () => '/', path: /^\/$/, toHash: () => 'home' },
  { hash: /^shop$/, toPath: () => '/shop/', path: /^\/shop\/$/, toHash: () => 'shop' },
  { hash: /^shop-([a-z0-9-]+)$/, toPath: (m) => `/shop/${m[1]}/`, path: /^\/shop\/([a-z0-9-]+)\/$/, toHash: (m) => `shop-${m[1]}` },
  { hash: /^p-([a-z0-9-]+)$/, toPath: (m) => `/products/${m[1]}/`, path: /^\/products\/([a-z0-9-]+)\/$/, toHash: (m) => `p-${m[1]}` },
  { hash: /^cart$/, toPath: () => '/cart/', path: /^\/cart\/$/, toHash: () => 'cart' },
  { hash: /^checkout$/, toPath: () => '/checkout/', path: /^\/checkout\/$/, toHash: () => 'checkout' },
  { hash: /^about$/, toPath: () => '/about/', path: /^\/about\/$/, toHash: () => 'about' },
  { hash: /^contact$/, toPath: () => '/contact/', path: /^\/contact\/$/, toHash: () => 'contact' },
  { hash: /^policies$/, toPath: () => '/policies/', path: /^\/policies\/$/, toHash: () => 'policies' },
  { hash: /^policy-([a-z0-9-]+)$/, toPath: (m) => `/policies/${m[1]}/`, path: /^\/policies\/([a-z0-9-]+)\/$/, toHash: (m) => `policy-${m[1]}` },
];

function normalizePath(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}

export function hashToPath(hash: string): string | null {
  const name = decodeURIComponent(hash.replace(/^#/, ''));
  for (const route of routes) {
    const m = name.match(route.hash);
    if (m) return route.toPath(m);
  }
  return null;
}

export function pathToHash(path: string): string {
  const clean = normalizePath(path.split('?')[0] ?? '/');
  for (const route of routes) {
    const m = clean.match(route.path);
    if (m) return route.toHash(m);
  }
  return 'home';
}

const listeners = new Set<() => void>();
let state: RouteState = { path: '/', search: '' };
let pendingHash: string | null = null;

export function getRouteState(): RouteState {
  return state;
}

export function subscribeRoute(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setState(next: RouteState, scrollTop: boolean) {
  state = next;
  for (const listener of listeners) listener();
  if (scrollTop) window.scrollTo(0, 0);
}

/** التنقل إلى مسار من مسارات الموقع، مثل /shop/?q=واشر */
export function navigate(href: string, options: { replace?: boolean } = {}) {
  const url = new URL(href, 'https://preview.invalid');
  const path = normalizePath(url.pathname);
  const pathChanged = path !== state.path;
  setState({ path, search: url.search.replace(/^\?/, '') }, pathChanged);
  const hash = `#${pathToHash(path)}`;
  if (window.location.hash !== hash) {
    pendingHash = hash;
    if (options.replace) window.location.replace(hash);
    else window.location.hash = hash;
  }
}

export function startRouter() {
  state = { path: hashToPath(window.location.hash) ?? '/', search: '' };
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash === pendingHash) {
      pendingHash = null;
      return;
    }
    const path = hashToPath(hash);
    if (path !== null) {
      if (path !== state.path) setState({ path, search: '' }, true);
      return;
    }
    // رابط داخل الصفحة نفسها (مثل #categories)
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  });
  // نماذج GET (مثل البحث في الهيدر) لا يمكن إرسالها في المعاينة — نحولها لتنقل داخلي
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    const action = form.getAttribute('action');
    if (!action?.startsWith('/') || (form.method || 'get').toLowerCase() !== 'get') return;
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) if (typeof value === 'string' && value.trim()) params.set(key, value.trim());
    const qs = params.toString();
    navigate(qs ? `${action}?${qs}` : action);
  });
}
