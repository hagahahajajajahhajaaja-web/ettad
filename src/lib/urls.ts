import { siteConfig } from '@/config/site';

export const paths = {
  home: '/',
  shop: '/shop/',
  category: (id: string) => `/shop/${id}/`,
  product: (id: string) => `/products/${id}/`,
  cart: '/cart/',
  checkout: '/checkout/',
  about: '/about/',
  contact: '/contact/',
  policies: '/policies/',
  policy: (slug: string) => `/policies/${slug}/`,
  search: (q: string) => `/shop/?q=${encodeURIComponent(q)}`,
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}

/** رابط المنتج الكامل لاستخدامه في رسائل واتساب — فقط إذا ضُبط رابط الموقع النهائي. */
export function shareableProductUrl(id: string): string | null {
  return siteConfig.siteUrlConfigured ? absoluteUrl(paths.product(id)) : null;
}
