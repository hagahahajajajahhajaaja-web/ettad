import { formatKwd, PRICE_ON_REQUEST, availabilityLabels } from '@/lib/format';
import { formatKuwaitPhone } from '@/lib/phone';
import type { CheckoutData } from '@/lib/order/validation';
import type { Availability } from '@/lib/schema';

export type OrderLine = {
  id: string;
  name: string;
  model: string | null;
  quantity: number;
  priceFils: number | null;
  availability: Availability;
  url: string | null;
};

export type OrderTotals = {
  /** مجموع المنتجات المسعّرة فقط (بالفلس). */
  pricedSubtotalFils: number;
  /** عدد الأصناف التي ليس لها سعر معتمد. */
  unpricedCount: number;
  itemCount: number;
  /** true إذا كانت كل الأصناف مسعّرة ويمكن عرض مجموع نهائي للمنتجات. */
  complete: boolean;
};

/**
 * يثبّت اتجاه نص لاتيني/رقمي داخل رسالة عربية (علامة LRM قبله)، حتى لا يعرض واتساب
 * رقم الهاتف «+965 5123 4567» مقلوبًا هكذا «4567 5123 965+».
 */
export function ltrInRtl(text: string): string {
  return `\u200E${text}`;
}

export function computeTotals(lines: Pick<OrderLine, 'quantity' | 'priceFils'>[]): OrderTotals {
  let pricedSubtotalFils = 0;
  let unpricedCount = 0;
  let itemCount = 0;
  for (const line of lines) {
    itemCount += line.quantity;
    if (line.priceFils === null) unpricedCount += 1;
    else pricedSubtotalFils += line.priceFils * line.quantity;
  }
  return { pricedSubtotalFils, unpricedCount, itemCount, complete: unpricedCount === 0 && lines.length > 0 };
}

/**
 * يبني نص رسالة الطلب. الرسالة تصف الطلب كطلب مبدئي — لا تحتوي رقم طلب
 * ولا أي عبارة تأكيد، لأن التأكيد يصدر من المتجر فقط.
 */
export function buildOrderMessage(customer: CheckoutData, lines: OrderLine[]): string {
  if (lines.length === 0) throw new Error('لا يمكن بناء رسالة طلب بدون منتجات');
  const totals = computeTotals(lines);
  const out: string[] = [];

  out.push('*طلب جديد من موقع عتاد | ETAAD*');
  out.push('طلب مبدئي بانتظار تأكيد المتجر.');
  out.push('');
  out.push('*المنتجات*');
  lines.forEach((line, index) => {
    out.push(`${index + 1}. ${line.name}`);
    // الموديل يُكتب فقط إذا لم يكن ظاهرًا في اسم المنتج نفسه
    if (line.model && !line.name.includes(line.model)) out.push(`   الموديل: ${line.model}`);
    out.push(`   الكمية: ${line.quantity}`);
    if (line.priceFils === null) {
      out.push(`   السعر: ${PRICE_ON_REQUEST}`);
    } else {
      out.push(`   سعر الوحدة: ${formatKwd(line.priceFils)}`);
    }
    if (line.availability === 'out_of_stock') out.push(`   الحالة: ${availabilityLabels[line.availability]}`);
    if (line.url) out.push(`   ${line.url}`);
  });
  out.push('');
  out.push('*الإجمالي*');
  out.push(`عدد القطع: ${totals.itemCount}`);
  if (totals.complete) {
    out.push(`مجموع المنتجات: ${formatKwd(totals.pricedSubtotalFils)}`);
    out.push('لا يشمل أي رسوم توصيل — تُحدد عند التأكيد.');
  } else if (totals.pricedSubtotalFils > 0) {
    out.push(`مجموع المنتجات المسعّرة: ${formatKwd(totals.pricedSubtotalFils)}`);
    out.push(`منتجات بانتظار التسعير: ${totals.unpricedCount}`);
    out.push('الإجمالي النهائي يحدده المتجر عند التأكيد.');
  } else {
    out.push('الإجمالي يحدده المتجر بعد تأكيد الأسعار.');
  }
  out.push('');
  out.push('*بيانات العميل*');
  out.push(`الاسم: ${customer.name}`);
  out.push(`الهاتف: ${ltrInRtl(formatKuwaitPhone(customer.phone))}`);
  out.push('');
  out.push('*عنوان التوصيل*');
  out.push(`المنطقة: ${customer.area}`);
  out.push(`القطعة: ${customer.block}`);
  out.push(`الشارع: ${customer.street}`);
  out.push(`المنزل/المبنى: ${customer.house}`);
  if (customer.notes) {
    out.push('تفاصيل إضافية:');
    for (const noteLine of customer.notes.split('\n')) out.push(`- ${noteLine}`);
  }
  return out.join('\n');
}

/** رابط واتساب جاهز للفتح. يعيد null إذا لم يُضبط رقم المتجر. */
export function buildWhatsAppUrl(storeNumber: string | null, message: string): string | null {
  if (!storeNumber) return null;
  return `https://wa.me/${storeNumber}?text=${encodeURIComponent(message)}`;
}

export function buildProductInquiryMessage(
  product: { name: string; model: string | null; priceFils?: number | null },
  url: string | null,
): string {
  const lines = [product.priceFils === null ? 'مرحبًا عتاد، أود الاستفسار عن سعر المنتج:' : 'مرحبًا عتاد، أود الاستفسار عن المنتج:', product.name];
  if (product.model) lines.push(`الموديل: ${product.model}`);
  if (url) lines.push(url);
  return lines.join('\n');
}

/** عرض رقم واتساب الكويتي بشكل مقروء: 96569976264 ← ‎+965 6997 6264. */
export function displayWhatsAppNumber(number: string): string {
  return `+${number.slice(0, 3)} ${number.slice(3, 7)} ${number.slice(7)}`;
}
