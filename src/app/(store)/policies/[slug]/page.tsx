import { notFound } from 'next/navigation';
import { PolicyDetail } from '@/components/ui/PolicyDetail';
import { policies } from '@/data/policies';
import { pageMetadata } from '@/lib/seo';
import { paths } from '@/lib/urls';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const policy = policies.find((p) => p.slug === slug);
  if (!policy) return {};
  return pageMetadata({
    title: policy.title,
    description: policy.summary,
    path: paths.policy(policy.slug),
    noIndex: policy.status === 'pending',
  });
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const policy = policies.find((p) => p.slug === slug);
  if (!policy) notFound();
  return <PolicyDetail policy={policy} />;
}
