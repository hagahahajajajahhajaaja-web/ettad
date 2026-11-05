/** حالات الطلب — مشتركة بين الخادم ولوحة التحكم. */
export const ORDER_STATUSES = ['new', 'contacted', 'confirmed', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: 'جديد',
  contacted: 'تم التواصل',
  confirmed: 'مؤكد',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);
}

/** حالة الدفع — يحددها صاحب المتجر من لوحة التحكم (الموقع لا يستلم أي دفع). */
export const PAYMENT_STATUSES = ['unpaid', 'paid'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: 'غير مدفوع',
  paid: 'مدفوع',
};

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === 'string' && (PAYMENT_STATUSES as readonly string[]).includes(value);
}

/** شكل الطلب كما تعيده الواجهة البرمجية. */
export type OrderLineRecord = {
  id: string;
  name: string;
  model: string | null;
  quantity: number;
  unitPriceFils: number | null;
};

export type OrderRecord = {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: OrderStatus;
  customer: { name: string; phone: string; area: string; block: string; street: string; house: string; notes: string };
  items: OrderLineRecord[];
  itemCount: number;
  totalFils: number | null;
  adminNote: string;
  paymentStatus: PaymentStatus;
  /** وقت تسجيل الدفع (null إذا غير مدفوع). */
  paidAt: number | null;
  history: { at: number; status: OrderStatus; by: 'customer' | 'admin' }[];
};

/** رقم طلب قصير وسهل القراءة: ET-261102-7KQ4 (التاريخ بتوقيت الكويت). */
export function makeOrderId(now: number, random: Uint8Array): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const kuwait = new Date(now + 3 * 60 * 60 * 1000);
  const date = kuwait.toISOString().slice(2, 10).replace(/-/g, '');
  const suffix = Array.from(random.slice(0, 4), (b) => alphabet[b % alphabet.length]).join('');
  return `ET-${date}-${suffix}`;
}
