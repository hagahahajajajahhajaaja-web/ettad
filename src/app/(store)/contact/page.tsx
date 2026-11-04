import { Icon, type IconName } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { siteConfig } from '@/config/site';
import { buildWhatsAppUrl, displayWhatsAppNumber } from '@/lib/order/whatsapp';
import { pageMetadata } from '@/lib/seo';
import { paths } from '@/lib/urls';

export const metadata = pageMetadata({
  title: 'تواصل معنا',
  description: 'تواصل مع عتاد | ETAAD للاستفسار عن المنتجات والأسعار والطلبات.',
  path: paths.contact,
});

type Channel = { icon: IconName; label: string; value: string; href: string; external?: boolean };

export default function ContactPage() {
  const channels: Channel[] = [];
  const whatsappUrl = buildWhatsAppUrl(siteConfig.whatsappNumber, 'مرحبًا عتاد، لدي استفسار:');
  if (whatsappUrl && siteConfig.whatsappNumber) {
    channels.push({
      icon: 'chat',
      label: 'واتساب',
      value: displayWhatsAppNumber(siteConfig.whatsappNumber),
      href: whatsappUrl,
      external: true,
    });
  }
  if (siteConfig.contact.phone) {
    channels.push({ icon: 'phone', label: 'الهاتف', value: siteConfig.contact.phone, href: `tel:${siteConfig.contact.phone.replace(/[^\d+]/g, '')}` });
  }
  if (siteConfig.contact.email) {
    channels.push({ icon: 'mail', label: 'البريد الإلكتروني', value: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}` });
  }
  if (siteConfig.contact.instagram) {
    channels.push({ icon: 'instagram', label: 'إنستغرام', value: siteConfig.contact.instagram.replace(/^https:\/\/(www\.)?/, ''), href: siteConfig.contact.instagram, external: true });
  }

  return (
    <>
      <PageHeader
        title="تواصل معنا"
        description="للاستفسار عن منتج أو سعر أو طلب قائم."
        crumbs={[{ label: 'تواصل معنا' }]}
      />
      <div className="container-etaad py-10">
        {channels.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
              <li key={channel.label}>
                <a
                  href={channel.href}
                  {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="group flex h-full items-center gap-4 border border-line bg-white p-5 hover:border-ink"
                >
                  <span className="grid size-14 shrink-0 place-items-center bg-ink text-orange group-hover:bg-orange group-hover:text-ink">
                    <Icon name={channel.icon} className="size-7" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-steel-700">{channel.label}</span>
                    <span className="ltr-isolate block text-lg font-black">{channel.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div role="status" className="max-w-2xl border-2 border-s-8 border-orange bg-white p-6">
            <Icon name="info" className="size-8" />
            <h2 className="mt-3 text-2xl font-black">معلومات التواصل قيد الاعتماد</h2>
            <p className="mt-2 leading-7 text-steel-700">
              رقم واتساب المتجر ووسائل التواصل الأخرى لم تُنشر بعد. ستظهر هنا فور اعتمادها.
            </p>
          </div>
        )}
        <p className="mt-8 max-w-2xl leading-7 text-steel-700">
          اطلب من صفحة إتمام الطلب لتحصل على رقم طلب، ويتواصل معك المتجر لتأكيد السعر والتوفر والتوصيل.
        </p>
      </div>
    </>
  );
}
