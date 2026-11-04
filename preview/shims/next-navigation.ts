import { useMemo, useSyncExternalStore } from 'react';
import { getRouteState, navigate, subscribeRoute } from '../router';

/** بديل next/navigation في المعاينة. */
export function usePathname(): string {
  return useSyncExternalStore(subscribeRoute, () => getRouteState().path);
}

export function useSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribeRoute, () => getRouteState().search);
  return useMemo(() => new URLSearchParams(search), [search]);
}

const router = {
  push: (href: string) => navigate(href),
  replace: (href: string) => navigate(href, { replace: true }),
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  refresh: () => {},
  prefetch: () => {},
};

export function useRouter() {
  return router;
}

export function notFound(): never {
  throw new Error('NEXT_NOT_FOUND');
}
