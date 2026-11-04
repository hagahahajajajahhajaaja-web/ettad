import Link from 'next/link';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Icon } from '@/components/ui/Icon';
import { siteConfig } from '@/config/site';
import { getAllProducts, getCategoryIconMap, toSummary } from '@/lib/catalog';
import { assetUrl } from '@/lib/asset';
import { buildWhatsAppUrl } from '@/lib/order/whatsapp';
import { paths } from '@/lib/urls';

/** خطوات الطلب كما يعمل الموقع فعليًا — بدون وعود تجارية غير معتمدة. */
const steps = [
  { title: 'أضف للسلة', body: 'اختر المنتجات والكمية.' },
  { title: 'أكّد طلبك', body: 'اكتب اسمك ورقمك وعنوانك ثم أكّد الطلب.' },
  { title: 'نتواصل معك', body: 'نؤكد معك الطلب وموعد التوصيل.' },
];

export default function HomePage() {
  const products = getAllProducts().map(toSummary);
  const icons = getCategoryIconMap();
  const whatsappUrl = buildWhatsAppUrl(siteConfig.whatsappNumber, 'مرحبًا عتاد، عندي استفسار:');

  return (
    <>
      {/* البانر الرئيسي — شعار عتاد ثم الشعار النصي والأزرار، ويوصل للمنتجات مباشرة */}
      <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-ink text-paper">
        <div className="blueprint absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="container-etaad relative grid items-center gap-5 py-7 text-center sm:gap-8 sm:py-12 lg:grid-cols-[1.2fr_1fr] lg:gap-10 lg:py-16 lg:text-start">
          <div className="order-first flex justify-center lg:order-last">
            {/* eslint-disable-next-line @next/next/no-img-element -- صورة محسنة مسبقًا (التصدير الثابت لا يدعم محسن Next) */}
            <img
              src={assetUrl('/images/brand/etaad-logo-960.webp')}
              srcSet={`${assetUrl('/images/brand/etaad-logo-480.webp')} 480w, ${assetUrl('/images/brand/etaad-logo-960.webp')} 960w`}
              sizes="(min-width: 1024px) 22rem, (min-width: 640px) 14rem, 10rem"
              width={960}
              height={1001}
              alt="شعار عتاد | ETAAD"
              fetchPriority="high"
              className="h-auto w-40 sm:w-56 lg:w-[22rem]"
            />
          </div>
          <div>
            <h1 id="hero-heading" className="text-[2.1rem] leading-[1.15] font-black sm:text-6xl lg:text-7xl">
              عتادك{' '}
              <span className="relative inline-block whitespace-nowrap">
                لكل شغلة
                <span aria-hidden="true" className="absolute inset-x-0 -bottom-2 h-2 bg-orange sm:h-3" />
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[0.95rem] leading-7 text-steel-300 sm:mt-6 sm:text-xl sm:leading-9 lg:mx-0">
              {siteConfig.blurb}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:flex sm:justify-center lg:justify-start">
              <a href="#products" className="btn-primary px-4 sm:px-8 sm:text-lg">
                تسوق الآن
                <Icon name="arrowLeft" />
              </a>
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-outline-light px-4 sm:px-6">
                  <Icon name="chat" />
                  <span className="sm:hidden">واتساب</span>
                  <span className="hidden sm:inline">تواصل عبر واتساب</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* كل المنتجات */}
      <section id="products" aria-labelledby="products-heading" className="container-etaad scroll-mt-24 pt-8 sm:pt-12">
        <div className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
          <h2 id="products-heading" className="flex items-center gap-2.5 text-2xl font-black sm:text-3xl">
            <span className="h-6 w-1.5 bg-orange sm:h-7" aria-hidden="true" />
            كل المنتجات
          </h2>
          <Link href={paths.shop} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-bold hover:underline">
            <Icon name="filter" className="size-4" />
            بحث وتصفية
          </Link>
        </div>
        <ProductGrid products={products} icons={icons} priorityCount={2} />
      </section>

      {/* عن المتجر */}
      <section aria-labelledby="about-heading" className="container-etaad pt-12 sm:pt-16">
        <h2 id="about-heading" className="flex items-center gap-2.5 text-xl font-black sm:text-2xl">
          <span className="h-5 w-1.5 bg-orange sm:h-6" aria-hidden="true" />
          عن عتاد
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-steel-700 sm:text-lg sm:leading-9">{siteConfig.about}</p>
        <Link href={paths.about} className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-bold hover:underline">
          المزيد عنا
          <Icon name="arrowLeft" className="size-4" />
        </Link>
      </section>

      {/* طريقة الطلب */}
      <section aria-labelledby="how-heading" className="container-etaad pt-12 sm:pt-16">
        <h2 id="how-heading" className="flex items-center gap-2.5 text-xl font-black sm:text-2xl">
          <span className="h-5 w-1.5 bg-orange sm:h-6" aria-hidden="true" />
          طريقة الطلب
        </h2>
        <ol className="mt-4 grid gap-px border border-ink bg-ink sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-4 bg-white p-4 sm:p-5">
              <span className="ltr-isolate font-mono text-2xl leading-none font-black text-orange-ink">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                <span className="block text-lg leading-6 font-black">{step.title}</span>
                <span className="mt-1 block leading-7 text-steel-700">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-steel-700">
          <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
          لا يطلب الموقع أي بيانات بطاقة أو دفع — طريقة الدفع يُتفق عليها عند تأكيد الطلب.
        </p>
      </section>
    </>
  );
}
