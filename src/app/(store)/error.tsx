'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

/** يظهر عند حدوث خطأ غير متوقع في الواجهة — مع إمكانية إعادة المحاولة. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-etaad py-20 text-center" role="alert">
      <Icon name="alert" className="mx-auto size-12 text-danger" />
      <h1 className="mt-4 text-3xl font-black">حدث خطأ غير متوقع</h1>
      <p className="mx-auto mt-3 max-w-md leading-7 text-steel-700">
        لم يكتمل عرض هذه الصفحة. محتويات سلتك محفوظة على جهازك. أعد المحاولة أو ارجع للمتجر.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          إعادة المحاولة
        </button>
        <Link href="/shop/" className="btn-outline">
          المتجر
        </Link>
      </div>
    </div>
  );
}
