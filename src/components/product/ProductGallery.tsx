'use client';

import { useEffect, useRef, useState } from 'react';
import type { Category, ProductImage as ProductImageData } from '@/lib/schema';
import { ImagePending, ProductImage } from '@/components/product/ProductImage';
import { Icon } from '@/components/ui/Icon';
import { assetUrl } from '@/lib/asset';

/**
 * معرض صور المنتج: سحب أفقي على الجوال (scroll-snap)، صور مصغرة، أسهم لوحة المفاتيح،
 * وعرض مكبر بملء الشاشة. الصور تُعرض كاملة دون قص.
 */
export function ProductGallery({
  images,
  alts,
  productName,
  icon,
}: {
  images: ProductImageData[];
  alts: string[];
  productName: string;
  icon: Category['icon'];
}) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const altFor = (index: number) => alts[index] ?? `${productName} — صورة ${index + 1} من ${images.length}`;

  // مزامنة الصورة النشطة مع التمرير الأفقي (السحب بالإصبع)
  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length < 2) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            setActive(Number((entry.target as HTMLElement).dataset.index));
          }
        }
      },
      { root: track, threshold: [0.6] },
    );
    track.querySelectorAll('[data-index]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="chamfer aspect-[16/9] border border-line bg-plate lg:aspect-square">
        <ImagePending icon={icon} />
      </div>
    );
  }

  const goTo = (index: number) => {
    const next = (index + images.length) % images.length;
    setActive(next);
    const slide = trackRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`);
    slide?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const current = images[active] ?? images[0]!;

  return (
    <div>
      <div className="relative">
        <div
          ref={trackRef}
          className="chamfer flex aspect-square snap-x snap-mandatory overflow-x-auto overscroll-x-contain border border-line bg-plate scrollbar-none"
          tabIndex={0}
          role="region"
          aria-roledescription="معرض صور"
          aria-label={`صور ${productName}`}
          onKeyDown={(event) => {
            // في الاتجاه العربي: السهم الأيسر = التالي
            if (event.key === 'ArrowLeft') goTo(active + 1);
            if (event.key === 'ArrowRight') goTo(active - 1);
          }}
        >
          {images.map((image, index) => (
            <div key={image.base} data-index={index} className="relative h-full w-full shrink-0 snap-center">
              <ProductImage
                image={image}
                alt={altFor(index)}
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority={index === 0}
                fallbackIcon={icon}
                className="p-4 sm:p-8"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="absolute bottom-3 start-3 inline-flex min-h-11 items-center gap-2 bg-ink/90 px-3 text-sm font-bold text-paper hover:bg-ink"
        >
          <Icon name="expand" className="size-4" />
          تكبير الصورة
        </button>
        {images.length > 1 ? (
          <p className="absolute bottom-3 end-3 bg-paper/90 px-2 py-1 font-mono text-xs font-bold text-ink" aria-hidden="true">
            {/* العزل داخل عنصر فرعي حتى لا ينقلب موضع end مع اتجاه ltr */}
            <span className="ltr-isolate">
              {active + 1}/{images.length}
            </span>
          </p>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="الصور المصغرة">
          {images.map((image, index) => (
            <li key={image.base}>
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-label={`عرض الصورة ${index + 1}`}
                aria-current={index === active ? 'true' : undefined}
                className={`block aspect-square w-full border-2 bg-plate p-1 transition-colors ${
                  index === active ? 'border-orange' : 'border-line hover:border-ink'
                }`}
              >
                <ProductImage image={image} alt="" sizes="20vw" fallbackIcon={icon} compactFallback />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-label={`عرض مكبر: ${productName}`}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 backdrop:bg-ink"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-3 py-2 text-paper">
            <p className="text-sm font-bold">{altFor(active)}</p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="grid size-12 place-items-center hover:bg-ink-700"
              aria-label="إغلاق العرض المكبر"
            >
              <Icon name="close" className="size-6" />
            </button>
          </div>
          <div className="relative min-h-0 flex-1 bg-plate">
            {/* eslint-disable-next-line @next/next/no-img-element -- صورة مكبرة بأعلى دقة متاحة */}
            <img
              src={`${assetUrl(current.base)}-${current.widths[current.widths.length - 1]}.webp`}
              alt={altFor(active)}
              className="h-full w-full object-contain p-2"
            />
          </div>
          {images.length > 1 ? (
            <div className="flex items-center justify-between gap-2 p-3 safe-bottom">
              <button type="button" className="btn-outline-light" onClick={() => goTo(active - 1)}>
                <Icon name="chevronRight" />
                السابقة
              </button>
              <button type="button" className="btn-outline-light" onClick={() => goTo(active + 1)}>
                التالية
                <Icon name="chevronLeft" />
              </button>
            </div>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
