import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { CartButton } from '@/components/cart/CartButton';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { SearchForm } from '@/components/layout/SearchForm';
import { getActiveCategories } from '@/lib/catalog';
import { paths } from '@/lib/urls';

export const pageLinks = [
  { href: paths.shop, label: 'المتجر' },
  { href: paths.about, label: 'من نحن' },
  { href: paths.contact, label: 'تواصل معنا' },
  { href: paths.policies, label: 'سياسات المتجر' },
];

export function SiteHeader() {
  const categories = getActiveCategories().map((c) => ({ href: paths.category(c.id), label: c.name }));
  return (
    <>
      <div className="border-b border-ink-700 bg-ink-800">
        <p className="container-etaad flex h-8 items-center justify-center gap-3 text-xs font-semibold text-steel-300 sm:justify-start">
          <span>اطلب أونلاين</span>
          <span aria-hidden="true" className="size-1 bg-orange" />
          <span>داخل الكويت</span>
          <span aria-hidden="true" className="size-1 bg-orange" />
          <span>الأسعار بالدينار الكويتي</span>
        </p>
      </div>
      <header className="sticky top-0 z-40 bg-ink text-paper">
        <div className="container-etaad flex items-center gap-2 py-2.5 sm:gap-4">
          <MobileMenu categories={[{ href: paths.shop, label: 'كل المنتجات' }, ...categories]} pages={pageLinks} />
          {/* الاسم المقروء = النص الظاهر + لاحقة لقارئ الشاشة (WCAG 2.5.3: الاسم يحتوي النص المرئي) */}
          <Link href={paths.home} className="shrink-0">
            <Logo tone="light" />
            <span className="sr-only"> — الصفحة الرئيسية</span>
          </Link>
          <SearchForm id="header-search" className="mx-auto hidden w-full max-w-xl md:block" />
          <nav aria-label="روابط رئيسية" className="hidden lg:block">
            <ul className="flex items-center">
              {pageLinks.slice(1, 3).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="px-3 py-2 text-sm font-bold text-steel-300 hover:text-paper">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ms-auto md:ms-0">
            <CartButton />
          </div>
        </div>
        <div className="h-1.5 hazard" aria-hidden="true" />
      </header>
      <div className="bg-ink text-paper">
        <div className="container-etaad pt-3 pb-1 md:hidden">
          <SearchForm id="header-search-mobile" />
        </div>
        <nav aria-label="أقسام المتجر">
          <ul className="container-etaad flex gap-1 overflow-x-auto scrollbar-none">
            <li>
              <Link
                href={paths.shop}
                className="flex h-11 items-center whitespace-nowrap px-3 text-sm font-bold text-paper hover:text-orange"
              >
                كل المنتجات
              </Link>
            </li>
            {categories.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex h-11 items-center whitespace-nowrap px-3 text-sm font-semibold text-steel-300 hover:text-orange"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
