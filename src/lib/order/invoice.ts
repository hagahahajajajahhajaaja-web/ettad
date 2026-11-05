import { CONSUMER_LAW_REFERENCE, INVOICE_TERMS } from '@/config/terms';
import { formatKwd } from '@/lib/format';
import { formatKuwaitPhone } from '@/lib/phone';
import { paymentStatusLabels, type OrderRecord } from '@/lib/order/status';
import { ltrInRtl } from '@/lib/order/whatsapp';

/**
 * فاتورة الطلب — تُبنى تلقائيًا من بيانات الطلب نفسها (رقم الفاتورة = رقم الطلب).
 * لا تتضمن ضريبة ولا رقم سجل تجاري ولا أي بيانات لم يعتمدها صاحب المتجر.
 */

export type InvoiceLine = {
  id: string;
  name: string;
  quantity: number;
  unitPriceFils: number | null;
  /** null إذا كان سعر المنتج غير محدد بعد. */
  lineTotalFils: number | null;
};

export function invoiceLines(order: OrderRecord): InvoiceLine[] {
  return order.items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unitPriceFils: item.unitPriceFils,
    lineTotalFils: item.unitPriceFils === null ? null : item.unitPriceFils * item.quantity,
  }));
}

/** الفاتورة جاهزة للإرسال فقط إذا كانت كل الأسعار محددة. */
export function invoiceIsPriced(order: OrderRecord): boolean {
  return order.totalFils !== null && order.items.every((item) => item.unitPriceFils !== null);
}

const dateOnly = new Intl.DateTimeFormat('ar-KW-u-nu-latn', { timeZone: 'Asia/Kuwait', dateStyle: 'long' });

export function formatInvoiceDate(at: number): string {
  return dateOnly.format(at);
}

/** نص الفاتورة لرسالة واتساب إلى العميل. */
export function invoiceWhatsAppText(order: OrderRecord): string {
  const lines = [`فاتورة عتاد | ETAAD`, `رقم الفاتورة: ${ltrInRtl(order.id)}`, `التاريخ: ${formatInvoiceDate(order.createdAt)}`, ''];
  lines.push(`العميل: ${order.customer.name}`, `الهاتف: ${ltrInRtl(formatKuwaitPhone(order.customer.phone))}`, '');
  for (const line of invoiceLines(order)) {
    const price = line.lineTotalFils === null ? 'السعر يُحدد' : formatKwd(line.lineTotalFils);
    lines.push(`- ${line.name} × ${line.quantity} = ${price}`);
  }
  lines.push('', `الإجمالي: ${order.totalFils === null ? 'يُحدد عند التأكيد' : formatKwd(order.totalFils)}`);
  lines.push(`حالة الدفع: ${paymentStatusLabels[order.paymentStatus]}`);
  lines.push('', `الشروط وسياسة الاستبدال والاسترجاع (${CONSUMER_LAW_REFERENCE}):`, ...INVOICE_TERMS.map((term, i) => `${i + 1}. ${term}`));
  lines.push('', 'شكرًا لطلبك من عتاد.');
  return lines.join('\n');
}
