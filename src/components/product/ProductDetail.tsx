import Link from 'next/link';
import { AddToCartPanel } from '@/components/product/AddToCartPanel';
import { LiveAvailabilityBadge, LivePriceTag } from '@/components/product/LivePrice';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductName } from '@/components/product/ProductName';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Icon } from '@/components/ui/Icon';
import { JsonLd } from '@/components/ui/JsonLd';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { siteConfig } from '@/config/site';
import { getCategoryIconMap, getRelatedProducts, toSummary, type CatalogProduct } from '@/lib/catalog';
import { buildProductInquiryMessage, buildWhatsAppUrl } from '@/lib/order/whatsapp';
import { absoluteUrl, paths, shareableProductUrl } from '@/lib/urls';

/** محتوى صفحة المنتج — يُستخدم في صفحة Next.js وفي المعاينة. */
export function ProductDetail({ product }: { product: CatalogProduct }) {
  const related = getRelatedProducts(product, 4).map(toSummary);
  const inquiryUrl = buildWhatsAppUrl(
    siteConfig.whatsappNumber,
    buildProductInquiryMessage(product, shareableProductUrl(product.id)),
  );
  const fromPackaging = product.specs.some((s) => s.source === 'packaging');

  return (
    <div className="pb-24 lg:pb-0">
      <div className="border-b border-line bg-white">
        <div className="container-etaad py-4">
          <Breadcrumbs
            items={[
              { label: 'المتجر', href: paths.shop },
              { label: product.category.name, href: paths.category(product.categoryId) },
              { label: product.name },
            ]}
          />
        </div>
      </div>

      <div className="container-etaad grid gap-8 py-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} alts={product.imageAlts} productName={product.name} icon={product.category.icon} />

        <div className="lg:py-2">
          <Link
            href={paths.category(product.categoryId)}
            className="inline-block bg-ink px-2 py-1 text-sm font-bold text-paper hover:bg-ink-700"
          >
            {product.category.name}
          </Link>
          <h1 className="mt-3 text-2xl leading-tight font-black sm:text-4xl">
            <ProductName name={product.name} />
          </h1>
          <p className="mt-3 text-base leading-8 text-steel-700 sm:text-lg">{product.summary}</p>

          <section aria-labelledby="uses-heading" className="mt-4">
            <h2 id="uses-heading" className="text-sm font-black">
              يُستخدم في
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {product.uses.map((use) => (
                <li key={use} className="border border-orange/40 bg-orange-50 px-3 py-1.5 text-sm leading-6 font-bold text-ink">
                  {use}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-y-2 border-ink py-4">
            <LivePriceTag productId={product.id} priceFils={product.priceFils} availability={product.availability} size="lg" />
            <LiveAvailabilityBadge productId={product.id} priceFils={product.priceFils} availability={product.availability} />
          </div>

          <div className="mt-6">
            <AddToCartPanel
              productId={product.id}
              productName={product.name}
              priceFils={product.priceFils}
              availability={product.availability}
              inquiryUrl={inquiryUrl}
            />
          </div>

          {product.highlights.length > 0 ? (
            <ul className="mt-8 space-y-2.5" aria-label="أبرز المميزات">
              {product.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-base leading-7 font-bold">
                  <Icon name="check" className="mt-1 size-5 shrink-0 text-orange-ink" />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}

          {product.description.length > 0 ? (
            <section aria-labelledby="about-heading" className="mt-10">
              <h2 id="about-heading" className="flex items-center gap-2 text-xl font-black">
                <span className="h-5 w-1.5 bg-orange" aria-hidden="true" />
                عن المنتج
              </h2>
              <div className="mt-3 space-y-3 text-base leading-8 text-steel-700">
                {product.description.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="specs-heading" className="mt-10">
            <h2 id="specs-heading" className="flex items-center gap-2 text-xl font-black">
              <span className="h-5 w-1.5 bg-orange" aria-hidden="true" />
              المواصفات
            </h2>
            <dl className="mt-4 divide-y divide-line border border-line bg-white">
              {product.specs.map((spec) => (
                <div key={spec.label} className="grid grid-cols-[8.5rem_1fr] gap-3 px-4 py-3">
                  <dt className="text-steel-700">{spec.label}</dt>
                  <dd className="font-bold">{spec.value}</dd>
                </div>
              ))}
            </dl>
            {fromPackaging ? (
              <p className="mt-2 text-sm leading-6 text-steel-700">الأرقام حسب بيانات المصنع المطبوعة على العلبة.</p>
            ) : null}
          </section>

          {product.contents.length > 0 ? (
            <section aria-labelledby="contents-heading" className="mt-10">
              <h2 id="contents-heading" className="flex items-center gap-2 text-xl font-black">
                <span className="h-5 w-1.5 bg-orange" aria-hidden="true" />
                محتويات العلبة
              </h2>
              <ul className="mt-4 divide-y divide-line border border-line bg-white">
                {product.contents.map((item) => (
                  <li key={item} className="flex items-start gap-3 px-4 py-2.5 leading-7">
                    <span aria-hidden="true" className="mt-3 size-1.5 shrink-0 bg-orange" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

        </div>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="container-etaad pt-8">
          <SectionHeading index="+" eyebrow="قد تحتاج أيضًا" title="منتجات أخرى" id="related-heading" />
          <ProductGrid products={related} icons={getCategoryIconMap()} />
        </section>
      ) : null}

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.summary,
          sku: product.id,
          ...(product.model ? { model: product.model, mpn: product.model } : {}),
          ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
          category: product.category.name,
          url: absoluteUrl(paths.product(product.id)),
          ...(product.images.length
            ? { image: product.images.map((img) => absoluteUrl(`${img.base}-${img.widths[img.widths.length - 1]}.webp`)) }
            : {}),
          // العرض (Offer) يُضاف فقط عند وجود سعر معتمد
          ...(product.priceFils !== null
            ? {
                offers: {
                  '@type': 'Offer',
                  priceCurrency: 'KWD',
                  price: (product.priceFils / 1000).toFixed(3),
                  url: absoluteUrl(paths.product(product.id)),
                  ...(product.availability === 'in_stock'
                    ? { availability: 'https://schema.org/InStock' }
                    : product.availability === 'out_of_stock'
                      ? { availability: 'https://schema.org/OutOfStock' }
                      : {}),
                },
              }
            : {}),
        }}
      />
    </div>
  );
}
