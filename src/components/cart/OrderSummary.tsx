import { computeTotals } from '@/lib/order/whatsapp';
import { countPieces, countProducts, formatKwd } from '@/lib/format';

/** ملخص الإجمالي — لا يعرض مجموعًا نهائيًا إلا إذا كانت كل الأسعار معتمدة. */
export function OrderTotalsBox({ lines }: { lines: { quantity: number; priceFils: number | null }[] }) {
  const totals = computeTotals(lines);
  return (
    <>
    <dl className="space-y-3 text-base">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-steel-700">عدد القطع</dt>
        <dd className="font-bold">{countPieces(totals.itemCount)}</dd>
      </div>
      {totals.pricedSubtotalFils > 0 ? (
        <div className="flex items-center justify-between gap-4">
          <dt className="text-steel-700">{totals.complete ? 'مجموع المنتجات' : 'مجموع المنتجات المسعّرة'}</dt>
          <dd className="ltr-isolate font-black">{formatKwd(totals.pricedSubtotalFils)}</dd>
        </div>
      ) : null}
      {totals.unpricedCount > 0 ? (
        <div className="flex items-center justify-between gap-4">
          <dt className="text-steel-700">بانتظار التسعير</dt>
          <dd className="font-bold">{countProducts(totals.unpricedCount)}</dd>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <dt className="text-steel-700">التوصيل</dt>
        <dd className="font-bold">يُحدد عند التأكيد</dd>
      </div>
      <div className="flex items-center justify-between gap-4 border-t-2 border-ink pt-3">
        <dt className="text-lg font-black">الإجمالي</dt>
        <dd className="text-lg font-black">
          {totals.complete ? <span className="ltr-isolate">{formatKwd(totals.pricedSubtotalFils)}</span> : 'يحدده المتجر عند التأكيد'}
        </dd>
      </div>
    </dl>
    {totals.complete ? <p className="mt-1 text-sm text-steel-700">لا يشمل رسوم التوصيل إن وجدت.</p> : null}
    </>
  );
}
