import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/ProductDetail';
import { getAllProducts, getProduct } from '@/lib/catalog';
import { pageMetadata, productOgImage } from '@/lib/seo';
import { paths } from '@/lib/urls';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return pageMetadata({
    title: product.name,
    description: `${product.summary} — ${product.category.name} من عتاد في الكويت.`,
    path: paths.product(product.id),
    image: productOgImage(product.images, product.name),
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
