import type { Category, ProductImage as ProductImageData } from '@/lib/schema';
import { CategoryIcon } from '@/components/product/CategoryIcon';
import { assetUrl } from '@/lib/asset';

/**
 * صورة منتج محسنة مسبقًا (WebP بعدة مقاسات) — تُعرض كاملة دون قص (object-contain)
 * حتى لا يتغير شكل المنتج. إذا لم تتوفر صورة حقيقية بعد، يظهر بديل صريح يوضح ذلك.
 */
export function ProductImage({
  image,
  alt,
  sizes,
  priority = false,
  className = '',
  fallbackIcon,
  compactFallback = false,
}: {
  image: ProductImageData | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  fallbackIcon: Category['icon'];
  /** للصور المصغرة: أيقونة ونص أصغر. */
  compactFallback?: boolean;
}) {
  if (!image) return <ImagePending icon={fallbackIcon} className={className} compact={compactFallback} />;
  const srcSet = image.widths.map((w) => `${assetUrl(image.base)}-${w}.webp ${w}w`).join(', ');
  const middle = image.widths[Math.min(1, image.widths.length - 1)] ?? image.widths[0];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- الصور محسنة مسبقًا لأن التصدير الثابت لا يدعم محسن Next
    <img
      src={`${assetUrl(image.base)}-${middle}.webp`}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={image.width}
      height={image.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={`h-full w-full object-contain ${className}`}
    />
  );
}

export function ImagePending({ icon, className = '', compact = false }: { icon: Category['icon']; className?: string; compact?: boolean }) {
  return (
    <div
      role="img"
      aria-label="صورة المنتج تُضاف قريبًا"
      className={`blueprint flex h-full w-full flex-col items-center justify-center gap-2 text-steel ${className}`}
    >
      <CategoryIcon icon={icon} className={compact ? 'size-12' : 'size-16 sm:size-20'} />
      <span className={`bg-paper/90 px-2 py-0.5 font-bold text-steel-700 ${compact ? 'text-[0.7rem]' : 'text-xs'}`}>الصورة قريبًا</span>
    </div>
  );
}
