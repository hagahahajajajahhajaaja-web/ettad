import type { MetadataRoute } from 'next';
import { absoluteUrl, paths } from '@/lib/urls';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: [paths.cart, paths.checkout, '/admin/', '/api/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
