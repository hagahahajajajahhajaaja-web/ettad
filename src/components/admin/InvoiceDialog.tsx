'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { adminApi } from '@/components/admin/api';
import { LogoMark } from '@/components/brand/Logo';
import { ProductName } from '@/components/product/ProductName';
import { Icon } from '@/components/ui/Icon';
import { useNotify } from '@/components/ui/Notices';
import { siteConfig } from '@/config/site';
import { countPieces, formatKwd } from '@/lib/format';
import { formatInvoiceDate, invoiceIsPriced, invoiceLines, invoiceWhatsAppText } from '@/lib/order/invoice';
import { paymentStatusLabels, type OrderRecord, type PaymentStatus } from '@/lib/order/status';
import { formatKuwaitPhone } from '@/lib/phone';

/** فاتورة الطلب داخل لوحة التحكم: عرض، طباعة/حفظ PDF، إرسال للعميل عبر واتساب، وتسجيل الدفع. */
export function InvoiceDialog({
  order,
  onClose,
  onSaved,
  onError,
}: {
  order: OrderRecord;
  onClose: () => void;
  onSaved: (order: OrderRecord) => void;
  onError: (error: unknown) => void;
}) {
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const notify = useNotify();

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const setPayment = async (paymentStatus: PaymentStatus) => {
    setBusy(true);
    try {
      const { order: updated } = await adminApi.updateOrder(order.id, { paymentStatus });
      notify({ tone: 'success', message: `الفاتورة ${order.id}: ${paymentStatusLabels[paymentStatus]}.` });
      onSaved(updated);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const priced = invoiceIsPriced(order);
  const waUrl = `https://wa.me/965${order.customer.phone}?text=${encodeURIComponent(invoiceWhatsAppText(order))}`;

  return createPortal(
    <div id="invoice-print-root" role="dialog" aria-modal="true" aria-labelledby="invoice-title" className="fixed inset-0 z-50 overflow-y-auto bg-ink/70">
      <div className="no-print sticky top-0 z-10 border-b-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 py-3">
          <button type="button" onClick={() => window.print()} className="btn-primary min-h-10 px-3 text-sm">
            <Icon name="printer" className="size-4" />
            طباعة / حفظ PDF
          </button>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline min-h-10 px-3 text-sm"
            aria-disabled={!priced || undefined}
            onClick={(e) => {
              if (!priced) {
                e.preventDefault();
                notify({ tone: 'error', message: 'حدد أسعار كل المنتجات أولًا من «الأسعار والتوفر» قبل إرسال الفاتورة.' });
              }
            }}
          >
            <Icon name="chat" className="size-4" />
            إرسال للعميل واتساب
          </a>
          {order.paymentStatus === 'paid' ? (
            <button type="button" onClick={() => void setPayment('unpaid')} disabled={busy} className="btn-outline min-h-10 px-3 text-sm">
              إلغاء تسجيل الدفع
            </button>
          ) : (
            <button type="button" onClick={() => void setPayment('paid')} disabled={busy} className="btn min-h-10 border-2 border-success bg-success px-3 text-sm text-paper">
              <Icon name="check" className="size-4" />
              تسجيل كمدفوع
            </button>
          )}
          <button ref={closeRef} type="button" onClick={onClose} className="btn-ghost ms-auto min-h-10 px-3 text-sm" aria-label="إغلاق الفاتورة">
            <Icon name="close" className="size-5" />
            إغلاق
          </button>
        </div>
      </div>

      <div className="invoice-page mx-auto my-4 max-w-3xl px-4 sm:my-8">
        <InvoiceSheet order={order} />
      </div>
    </div>,
    document.body,
  );
}

/** ورقة الفاتورة نفسها (ما يُطبع). */
export function InvoiceSheet({ order }: { order: OrderRecord }) {
  const lines = invoiceLines(order);
  const paid = order.paymentStatus === 'paid';
  const domain = siteConfig.siteUrlConfigured ? new URL(siteConfig.url).host : null;
  const storePhone = siteConfig.whatsappNumber ? formatKuwaitPhone(siteConfig.whatsappNumber.slice(3)) : null;
  const c = order.customer;

  return (
    <article className="invoice-sheet relative overflow-hidden bg-white text-ink shadow-xl" aria-labelledby="invoice-title">
      <div className="h-2 hazard" aria-hidden="true" />

      <header className="flex flex-wrap items-start justify-between gap-6 px-6 pt-6 sm:px-10 sm:pt-8">
        <div className="flex items-center gap-3">
          <LogoMark className="size-14 shrink-0 sm:size-16" />
          <div>
            <p className="text-2xl font-black leading-tight">
              عتاد <span className="text-steel">|</span> <span dir="ltr">ETAAD</span>
            </p>
            <p className="text-sm text-steel-700">{siteConfig.description}</p>
            <p className="mt-1 flex flex-wrap gap-x-3 text-sm font-bold text-steel-700">
              {domain ? <span dir="ltr">{domain}</span> : null}
              {storePhone ? <span dir="ltr">{storePhone}</span> : null}
            </p>
          </div>
        </div>
        <div className="text-end">
          <h2 id="invoice-title" className="text-3xl font-black">
            فاتورة
          </h2>
          <dl className="mt-2 grid grid-cols-[auto_auto] justify-end gap-x-3 gap-y-1 text-sm">
            <dt className="text-steel-700">رقم الفاتورة</dt>
            <dd className="font-mono font-black" dir="ltr">
              {order.id}
            </dd>
            <dt className="text-steel-700">التاريخ</dt>
            <dd className="font-bold">{formatInvoiceDate(order.createdAt)}</dd>
          </dl>
        </div>
      </header>

      <section aria-label="بيانات العميل" className="mx-6 mt-6 grid gap-4 border-y-2 border-ink py-4 sm:mx-10 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold text-steel-700">فاتورة إلى</p>
          <p className="mt-1 text-lg font-black">{c.name}</p>
          <p className="font-bold" dir="ltr" style={{ textAlign: 'right' }}>
            {formatKuwaitPhone(c.phone)}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-steel-700">عنوان التوصيل</p>
          <p className="mt-1 leading-7">
            {c.area}، قطعة {c.block}، شارع {c.street}، {c.house}
          </p>
        </div>
      </section>

      <div className="px-6 pt-5 sm:px-10">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-ink text-paper">
              <th scope="col" className="w-6 px-1.5 py-2 text-start font-black sm:w-8 sm:px-2">
                #
              </th>
              <th scope="col" className="px-1.5 py-2 text-start font-black sm:px-2">
                المنتج
              </th>
              <th scope="col" className="w-12 px-1.5 py-2 text-center font-black whitespace-nowrap sm:w-14 sm:px-2">
                الكمية
              </th>
              <th scope="col" className="w-20 px-1.5 py-2 text-end font-black whitespace-nowrap sm:w-24 sm:px-2">
                السعر
              </th>
              <th scope="col" className="w-20 px-1.5 py-2 text-end font-black whitespace-nowrap sm:w-24 sm:px-2">
                المجموع
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={line.id} className="border-b border-line align-top">
                <td className="px-1.5 py-3 font-mono text-steel-700 sm:px-2">{i + 1}</td>
                <td className="px-1.5 py-3 font-bold leading-6 sm:px-2">
                  <ProductName name={line.name} />
                </td>
                <td className="px-1.5 py-3 text-center font-bold sm:px-2">{line.quantity}</td>
                <td className="px-1.5 py-3 text-end whitespace-nowrap sm:px-2">
                  {line.unitPriceFils === null ? <span className="text-orange-ink">يُحدد</span> : <span className="ltr-isolate">{formatKwd(line.unitPriceFils)}</span>}
                </td>
                <td className="px-1.5 py-3 text-end font-bold whitespace-nowrap sm:px-2">
                  {line.lineTotalFils === null ? <span className="text-orange-ink">يُحدد</span> : <span className="ltr-isolate">{formatKwd(line.lineTotalFils)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="flex flex-wrap items-end justify-between gap-6 px-6 pt-5 pb-6 sm:px-10 sm:pb-8">
        <div
          className={`invoice-stamp -rotate-6 border-4 px-4 py-2 text-center ${paid ? 'border-success text-success' : 'border-orange text-orange-ink'}`}
          aria-label={`حالة الدفع: ${paymentStatusLabels[order.paymentStatus]}`}
        >
          <p className="text-2xl font-black">{paymentStatusLabels[order.paymentStatus]}</p>
          {paid && order.paidAt ? <p className="text-xs font-bold">{formatInvoiceDate(order.paidAt)}</p> : null}
        </div>
        <dl className="min-w-56 text-sm">
          <div className="flex justify-between gap-6 py-1">
            <dt className="text-steel-700">عدد القطع</dt>
            <dd className="font-bold">{countPieces(order.itemCount)}</dd>
          </div>
          <div className="mt-1 flex justify-between gap-6 bg-ink px-3 py-2 text-paper">
            <dt className="font-black">الإجمالي</dt>
            <dd className="text-lg font-black">
              {order.totalFils === null ? 'يُحدد عند التأكيد' : <span className="ltr-isolate">{formatKwd(order.totalFils)}</span>}
            </dd>
          </div>
        </dl>
      </section>

      <footer className="border-t border-line bg-paper px-6 py-4 text-center text-sm leading-6 text-steel-700 sm:px-10">
        <p className="font-black text-ink">شكرًا لتسوقك من عتاد</p>
        <p>الأسعار بالدينار الكويتي. طريقة الدفع يُتفق عليها عند تأكيد الطلب.</p>
      </footer>
    </article>
  );
}
