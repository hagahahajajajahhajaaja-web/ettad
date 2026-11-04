import { CartView } from '@/components/cart/CartView';
import { PageHeader } from '@/components/ui/PageHeader';
import { getCategoryIconMap } from '@/lib/catalog';
import { pageMetadata } from '@/lib/seo';
import { paths } from '@/lib/urls';

export const metadata = pageMetadata({
  title: 'سلة التسوق',
  description: 'راجع المنتجات والكميات في سلة عتاد قبل إتمام الطلب.',
  path: paths.cart,
  noIndex: true,
});

export default function CartPage() {
  return (
    <>
      <PageHeader title="سلة التسوق" crumbs={[{ label: 'سلة التسوق' }]} />
      <div className="container-etaad py-8">
        <CartView icons={getCategoryIconMap()} />
      </div>
    </>
  );
}
