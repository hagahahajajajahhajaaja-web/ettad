import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { pageLinks } from '@/components/layout/SiteHeader';
import { siteConfig } from '@/config/site';
import { getActiveCategories } from '@/lib/catalog';
import { paths } from '@/lib/urls';
import { policies } from '@/data/policies';
import { Icon } from '@/components/ui/Icon';
import { buildWhatsAppUrl, displayWhatsAppNumber } from '@/lib/order/whatsapp';

export function SiteFooter() {
  const categories = getActiveCategories();
  const year = new Date().getFullYear();
  const whatsappUrl = buildWhatsAppUrl(siteConfig.whatsappNumber, 'مرحبًا عتاد، عندي استفسار:');
  const number = siteConfig.whatsappNumber;
  return (
    <footer className="mt-16 bg-ink text-paper">
      <div className="h-2 hazard" aria-hidden="true" />
      <div className="container-etaad grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-10 md:py-12">
        <div className="col-span-2 md:col-span-1">
          <Logo tone="light" />
          <p className="mt-4 text-2xl font-black">{siteConfig.tagline}</p>
          <p className="mt-2 max-w-xs leading-7 text-steel-300">{siteConfig.description} في {siteConfig.market}.</p>
          {whatsappUrl && number ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-11 items-center gap-2 font-bold text-paper hover:text-orange"
            >
              <Icon name="chat" className="size-5 text-orange" />
              واتساب:
              <span className="ltr-isolate">{displayWhatsAppNumber(number)}</span>
            </a>
          ) : null}
        </div>
        <FooterColumn
          title="الأقسام"
          links={[{ href: paths.shop, label: 'كل المنتجات' }, ...categories.map((c) => ({ href: paths.category(c.id), label: c.name }))]}
        />
        <FooterColumn title="عتاد" links={pageLinks.filter((l) => l.href !== paths.shop)} />
        <FooterColumn title="السياسات" links={policies.map((p) => ({ href: paths.policy(p.slug), label: p.title }))} />
      </div>
      <div className="border-t border-ink-700">
        <div className="container-etaad flex flex-col gap-2 py-5 text-sm text-steel-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.fullName}
          </p>
          <p>لا يطلب الموقع أي بيانات دفع.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="eyebrow mb-4 text-steel-300">{title}</p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="font-semibold text-paper/90 hover:text-orange">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
