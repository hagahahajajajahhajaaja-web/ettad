import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { policies } from '@/data/policies';
import { pageMetadata } from '@/lib/seo';
import { paths } from '@/lib/urls';
import { PolicyStatusBadge } from '@/components/ui/PolicyStatus';

export const metadata = pageMetadata({
  title: 'سياسات المتجر',
  description: 'آلية الطلب والخصوصية وحالة سياسات التوصيل والاسترجاع والضمان في متجر عتاد.',
  path: paths.policies,
});

export default function PoliciesPage() {
  return (
    <>
      <PageHeader title="سياسات المتجر" description="نعرض فقط ما هو معتمد أو ما يصف طريقة عمل الموقع فعليًا." crumbs={[{ label: 'سياسات المتجر' }]} />
      <div className="container-etaad py-10">
        <ul className="grid gap-4 md:grid-cols-2">
          {policies.map((policy) => (
            <li key={policy.slug}>
              <Link href={paths.policy(policy.slug)} className="group flex h-full flex-col border border-line bg-white p-5 hover:border-ink">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-xl font-black">{policy.title}</span>
                  <PolicyStatusBadge status={policy.status} />
                </span>
                <span className="mt-2 flex-1 leading-7 text-steel-700">{policy.summary}</span>
                <span className="mt-4 inline-flex items-center gap-2 font-bold">
                  التفاصيل
                  <Icon name="arrowLeft" className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
