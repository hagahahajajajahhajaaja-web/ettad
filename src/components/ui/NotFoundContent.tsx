import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { paths } from '@/lib/urls';

export function NotFoundContent() {
  return (
    <div className="container-etaad py-20 text-center">
      <p className="ltr-isolate font-mono text-6xl font-black text-orange-ink">404</p>
      <h1 className="mt-4 text-3xl font-black">الصفحة غير موجودة</h1>
      <p className="mx-auto mt-3 max-w-md leading-7 text-steel-700">ربما تغير الرابط أو أُزيل المنتج. جرّب البحث أو تصفح المتجر.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={paths.shop} className="btn-primary">
          تصفح المتجر
          <Icon name="arrowLeft" />
        </Link>
        <Link href={paths.home} className="btn-outline">
          الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
