import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { absoluteUrl } from '@/lib/urls';
import { JsonLd } from '@/components/ui/JsonLd';

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: 'الرئيسية', href: '/' }, ...items];
  return (
    <>
      <nav aria-label="مسار التنقل" className="text-sm">
        <ol className="flex flex-wrap items-center gap-1.5 text-steel-700">
          {all.map((crumb, index) => {
            const last = index === all.length - 1;
            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {crumb.href && !last ? (
                  <Link href={crumb.href} className="font-semibold hover:text-ink hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={last ? 'page' : undefined} className="font-bold text-ink">
                    {crumb.label}
                  </span>
                )}
                {!last ? <Icon name="chevronLeft" className="size-4 text-steel" /> : null}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: all.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.label,
            ...(crumb.href ? { item: absoluteUrl(crumb.href) } : {}),
          })),
        }}
      />
    </>
  );
}
