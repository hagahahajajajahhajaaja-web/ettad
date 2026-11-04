import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';
import { PageHeader } from '@/components/ui/PageHeader';
import { siteConfig } from '@/config/site';
import { getActiveCategories } from '@/lib/catalog';
import { pageMetadata } from '@/lib/seo';
import { paths } from '@/lib/urls';

export const metadata = pageMetadata({
  title: 'من نحن',
  description: 'عتاد | ETAAD متجر إلكتروني في الكويت للمعدات والأدوات: ماكينات غسيل، عدد يدوية، أدوات كهربائية ومعدات سيارات.',
  path: paths.about,
});

const principles = [
  {
    title: 'وضوح قبل البيع',
    body: 'أسعار واضحة بالدينار الكويتي، ومواصفات منقولة من بيانات المصنع كما هي دون مبالغة. وأي تفصيل غير مؤكد لا ننشره.',
  },
  {
    title: 'صور المنتج نفسه',
    body: 'نعتمد على صور المنتجات الفعلية دون تعديل يغير شكل المنتج أو مكوناته.',
  },
  {
    title: 'طلب بسيط ومباشر',
    body: 'تختار المنتجات وتؤكد طلبك من الموقع برقم طلب، ويتواصل معك المتجر لتأكيد التفاصيل.',
  },
];

export default function AboutPage() {
  const categories = getActiveCategories();
  return (
    <>
      <PageHeader title="من نحن" crumbs={[{ label: 'من نحن' }]} />
      <div className="container-etaad grid gap-10 py-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="max-w-2xl">
          <p className="text-2xl font-black leading-relaxed sm:text-3xl">
            {siteConfig.about}
          </p>
          <div className="mt-6 space-y-4 text-lg leading-8 text-steel-700">
            <p>
              اسمنا «عتاد» لأننا نريد أن نكون المكان الذي يجد فيه صاحب الشغلة عدّته: سواء كان فني صيانة، أو صاحب ورشة، أو شخصًا يجهز أدوات بيته وسيارته.
            </p>
            <p>
              نبدأ بمجموعة مختارة من المنتجات في{' '}
              {categories.map((c, i) => (
                <span key={c.id}>
                  <Link href={paths.category(c.id)} className="font-bold text-ink underline underline-offset-4">
                    {c.name}
                  </Link>
                  {i < categories.length - 2 ? '، ' : i === categories.length - 2 ? ' و' : ''}
                </span>
              ))}
              ، ونضيف منتجات جديدة تدريجيًا.
            </p>
          </div>
          <h2 className="mt-10 text-xl font-black">كيف نعمل</h2>
          <ul className="mt-4 space-y-4">
            {principles.map((p) => (
              <li key={p.title} className="border-s-4 border-orange bg-white p-4">
                <p className="font-black">{p.title}</p>
                <p className="mt-1 leading-7 text-steel-700">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="chamfer self-start bg-ink p-8 text-paper" aria-hidden="true">
          <LogoMark className="size-24" tone="dark-bg" />
          <p className="mt-6 text-4xl font-black">{siteConfig.tagline}</p>
          <div className="ruler mt-6 h-3 text-steel" />
          <p className="ltr-isolate mt-6 font-mono text-sm tracking-[0.3em] text-steel-300">ETAAD · KUWAIT</p>
        </div>
      </div>
    </>
  );
}
