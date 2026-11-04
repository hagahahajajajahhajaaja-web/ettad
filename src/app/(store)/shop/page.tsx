import { ShopPage } from '@/components/shop/ShopPage';
import { pageMetadata } from '@/lib/seo';
import { paths } from '@/lib/urls';

export const metadata = pageMetadata({
  title: 'المتجر',
  description: 'تسوق من عتاد في الكويت: ماكينات الغسيل بالضغط العالي، الأدوات الكهربائية، أطقم العدة اليدوية ومعدات السيارات.',
  path: paths.shop,
});

export default function Page() {
  return <ShopPage categoryId={null} />;
}
