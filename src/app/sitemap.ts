import type { MetadataRoute } from 'next';
import { policies } from '@/data/policies';
import { getActiveCategories, getAllProducts } from '@/lib/catalog';
import { absoluteUrl, paths } from '@/lib/urls';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const products = getAllProducts();
  const latest = products.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), '2026-11-01');
  return [
    { url: absoluteUrl(paths.home), lastModified: latest, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl(paths.shop), lastModified: latest, changeFrequency: 'weekly', priority: 0.9 },
    ...getActiveCategories().map((c) => ({
      url: absoluteUrl(paths.category(c.id)),
      lastModified: latest,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(paths.product(p.id)),
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      ...(p.images[0] ? { images: [absoluteUrl(`${p.images[0].base}-${p.images[0].widths.at(-1)}.webp`)] } : {}),
    })),
    { url: absoluteUrl(paths.about), changeFrequency: 'monthly', priority: 0.4 },
    { url: absoluteUrl(paths.contact), changeFrequency: 'monthly', priority: 0.4 },
    { url: absoluteUrl(paths.policies), changeFrequency: 'monthly', priority: 0.3 },
    ...policies
      .filter((p) => p.status !== 'pending')
      .map((p) => ({ url: absoluteUrl(paths.policy(p.slug)), lastModified: p.updatedAt, changeFrequency: 'monthly' as const, priority: 0.3 })),
  ];
}
