import { CheckoutFlow } from '@/components/checkout/CheckoutFlow';
import { PageHeader } from '@/components/ui/PageHeader';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo';
import { paths } from '@/lib/urls';

export const metadata = pageMetadata({
  title: 'إتمام الطلب',
  description: 'أدخل بيانات التوصيل وراجع طلبك ثم أكّده.',
  path: paths.checkout,
  noIndex: true,
});

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        title="إتمام الطلب"
        description="أدخل بياناتك وراجع الطلب ثم أكّده. يتواصل معك المتجر لتأكيد السعر والتوفر والتوصيل."
        crumbs={[{ label: 'سلة التسوق', href: paths.cart }, { label: 'إتمام الطلب' }]}
      />
      <div className="container-etaad py-8">
        <CheckoutFlow whatsappNumber={siteConfig.whatsappNumber} />
      </div>
    </>
  );
}
