import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { PolicyStatusBadge } from '@/components/ui/PolicyStatus';
import type { Policy } from '@/lib/schema';
import { paths } from '@/lib/urls';

/** محتوى صفحة سياسة — يُستخدم في صفحة Next.js وفي المعاينة. */
export function PolicyDetail({ policy }: { policy: Policy }) {
  return (
    <>
      <PageHeader title={policy.title} crumbs={[{ label: 'سياسات المتجر', href: paths.policies }, { label: policy.title }]}>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-steel-700">
          <PolicyStatusBadge status={policy.status} />
          <span>
            آخر تحديث: <time dateTime={policy.updatedAt} className="ltr-isolate">{policy.updatedAt}</time>
          </span>
        </div>
      </PageHeader>
      <div className="container-etaad max-w-3xl py-10">
        {policy.status === 'pending' ? (
          <div role="status" className="border-2 border-s-8 border-orange bg-white p-6">
            <Icon name="info" className="size-8" />
            <h2 className="mt-3 text-2xl font-black">هذه السياسة لم تُعتمد بعد</h2>
            <p className="mt-2 leading-8 text-steel-700">{policy.summary}</p>
            <p className="mt-2 leading-8 text-steel-700">لن ننشر أي شروط أو مدد أو رسوم قبل اعتمادها رسميًا.</p>
            <Link href={paths.contact} className="btn-dark mt-5">
              تواصل معنا
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <p className="text-lg leading-8">{policy.summary}</p>
            {policy.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="mb-3 flex items-center gap-2 text-xl font-black">
                  <span className="h-5 w-1.5 bg-orange" aria-hidden="true" />
                  {section.heading}
                </h2>
                <div className="space-y-3 leading-8 text-steel-700">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
