import { notFound } from 'next/navigation';
import { ShopPage } from '@/components/shop/ShopPage';
import { getActiveCategories, getCategory } from '@/lib/catalog';
import { pageMetadata } from '@/lib/seo';
import { paths } from '@/lib/urls';

type Props = { params: Promise<{ category: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getActiveCategories().map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: Props) {
  const { category: id } = await params;
  const category = getCategory(id);
  if (!category) return {};
  return pageMetadata({ title: category.name, description: category.description, path: paths.category(category.id) });
}

export default async function Page({ params }: Props) {
  const { category: id } = await params;
  if (!getActiveCategories().some((c) => c.id === id)) notFound();
  return <ShopPage categoryId={id} />;
}
