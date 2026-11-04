import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { absoluteUrl } from '@/lib/urls';
import type { ProductImage } from '@/lib/schema';

export const DEFAULT_OG_IMAGE = { url: '/og/etaad-og.png', width: 1200, height: 630, alt: 'عتاد | ETAAD — عتادك لكل شغلة' };

/**
 * Metadata موحدة لكل صفحة (عنوان، وصف، رابط أساسي، Open Graph، X).
 * في Next.js، openGraph في الصفحة يستبدل الأب بالكامل — لذلك نبنيه كاملًا هنا.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
}: {
  title?: string;
  description: string;
  path: string;
  image?: { url: string; width: number; height: number; alt: string };
  noIndex?: boolean;
}): Metadata {
  const fullTitle = title ? `${title} | ${siteConfig.fullName}` : `${siteConfig.fullName} — ${siteConfig.description} في ${siteConfig.market}`;
  const og = image ?? DEFAULT_OG_IMAGE;
  return {
    title: title ? title : { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      siteName: siteConfig.fullName,
      title: fullTitle,
      description,
      url: absoluteUrl(path),
      images: [og],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [og.url] },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}

/** صورة المشاركة لمنتج: أول صورة حقيقية بأكبر مقاس، وإلا صورة العلامة. */
export function productOgImage(images: ProductImage[], alt: string) {
  const first = images[0];
  if (!first) return DEFAULT_OG_IMAGE;
  // JPEG ‏1200×630 مخصص لمعاينة الروابط (واتساب لا يدعم WebP دائمًا)
  if (first.og) return { url: first.og, width: 1200, height: 630, alt };
  const width = first.widths[first.widths.length - 1] ?? first.width;
  const height = Math.round((first.height / first.width) * width);
  return { url: `${first.base}-${width}.webp`, width, height, alt };
}
