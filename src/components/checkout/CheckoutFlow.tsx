'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart, type CartLine } from '@/components/cart/CartProvider';
import { useLiveCatalog } from '@/components/catalog/LiveCatalog';
import { OrderTotalsBox } from '@/components/cart/OrderSummary';
import { Icon } from '@/components/ui/Icon';
import { useNotify } from '@/components/ui/Notices';
import { kuwaitAreaSuggestions } from '@/data/kuwait-areas';
import { countPieces, formatKwd, PRICE_ON_REQUEST } from '@/lib/format';
import {
  emptyCheckout,
  LIMITS,
  validateCheckout,
  type CheckoutData,
  type CheckoutField,
} from '@/lib/order/validation';
import { buildOrderMessage, buildWhatsAppUrl, type OrderLine } from '@/lib/order/whatsapp';
import { formatKuwaitPhone, normalizeKuwaitPhone } from '@/lib/phone';
import { newRequestKey, submitOrder, type PlacedOrder } from '@/lib/order/client';
import { paths, shareableProductUrl } from '@/lib/urls';

const DRAFT_KEY = 'etaad.checkout.v1';

type Step = 'form' | 'review' | 'handoff' | 'cleared';

function loadDraft(): Record<CheckoutField, string> {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return { ...emptyCheckout };
    const parsed = JSON.parse(raw) as Partial<Record<CheckoutField, unknown>>;
    const draft = { ...emptyCheckout };
    for (const key of Object.keys(emptyCheckout) as CheckoutField[]) {
      const value = parsed[key];
      if (typeof value === 'string') draft[key] = value.slice(0, 400);
    }
    return draft;
  } catch {
    return { ...emptyCheckout };
  }
}

function saveDraft(draft: Record<CheckoutField, string> | null) {
  try {
    if (draft) window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // التخزين غير متاح — النموذج يعمل بدون حفظ مؤقت
  }
}

function toOrderLines(lines: CartLine[]): OrderLine[] {
  return lines.map(({ product, quantity }) => ({
    id: product.id,
    name: product.name,
    model: product.model,
    quantity,
    priceFils: product.priceFils,
    availability: product.availability,
    url: shareableProductUrl(product.id),
  }));
}

export function CheckoutFlow({ whatsappNumber }: { whatsappNumber: string | null }) {
  const { ready, lines, clear } = useCart();
  const [step, setStep] = useState<Step>('form');
  const [placed, setPlaced] = useState<(PlacedOrder & { contactPhone: string }) | null>(null);

  if (placed) return <OrderReceipt order={placed} />;

  if (!ready) {
    return (
      <div className="grid min-h-60 place-items-center" role="status">
        <span className="flex items-center gap-3 font-bold text-steel-700">
          <span aria-hidden="true" className="size-5 animate-spin border-2 border-ink border-t-orange" />
          جارٍ تحميل الطلب…
        </span>
      </div>
    );
  }

  if (step === 'cleared') {
    return (
      <StatusPanel
        tone="success"
        title="تم تفريغ السلة"
        body={[
          'إذا أرسلت الرسالة من واتساب، فانتظر رد المتجر لتأكيد السعر والتوفر وتفاصيل التوصيل.',
          'الطلب لا يعتبر مؤكدًا حتى يصلك تأكيد من المتجر.',
        ]}
      >
        <Link href={paths.shop} className="btn-primary">
          العودة إلى المتجر
        </Link>
      </StatusPanel>
    );
  }

  if (lines.length === 0) {
    return (
      <StatusPanel tone="info" title="لا توجد منتجات في السلة" body={['أضف منتجًا واحدًا على الأقل قبل إتمام الطلب.']}>
        <Link href={paths.shop} className="btn-primary">
          تصفح المنتجات
        </Link>
      </StatusPanel>
    );
  }

  return (
    <CheckoutForm
      lines={lines}
      whatsappNumber={whatsappNumber}
      step={step}
      setStep={setStep}
      onPlaced={(order) => {
        setPlaced(order);
        clear();
        saveDraft(null);
        window.scrollTo({ top: 0 });
      }}
    />
  );
}

function CheckoutForm({
  lines,
  whatsappNumber,
  step,
  setStep,
  onPlaced,
}: {
  lines: CartLine[];
  whatsappNumber: string | null;
  step: Step;
  setStep: (step: Step) => void;
  onPlaced: (order: PlacedOrder & { contactPhone: string }) => void;
}) {
  const { clear } = useCart();
  const live = useLiveCatalog();
  const [requestKey] = useState(newRequestKey);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const serverMode = live.status === 'ready' && fallbackReason === null;

  const placeOrder = async () => {
    setBusy(true);
    setSubmitError(null);
    const result = await submitOrder({
      requestKey,
      items: lines.map((l) => ({ id: l.product.id, quantity: l.quantity })),
      customer: values,
    });
    setBusy(false);
    if (result.ok) {
      onPlaced({ ...result.order, contactPhone: normalizeKuwaitPhone(values.phone) ?? '' });
      return;
    }
    if (result.kind === 'invalid') setSubmitError(result.message);
    else setFallbackReason(result.message);
  };
  const notify = useNotify();
  const [values, setValues] = useState<Record<CheckoutField, string>>(loadDraft);
  const [errors, setErrors] = useState<Partial<Record<CheckoutField, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [customer, setCustomer] = useState<CheckoutData | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  const orderLines = useMemo(() => toOrderLines(lines), [lines]);
  const message = useMemo(() => (customer ? buildOrderMessage(customer, orderLines) : ''), [customer, orderLines]);
  const whatsappUrl = customer ? buildWhatsAppUrl(whatsappNumber, message) : null;

  useEffect(() => {
    if (step !== 'form') {
      window.scrollTo({ top: 0 });
      stepHeadingRef.current?.focus();
    }
  }, [step]);

  const update = (field: CheckoutField, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    saveDraft(next);
    if (submitted) {
      const result = validateCheckout(next);
      setErrors(result.ok ? {} : result.errors);
    }
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const result = validateCheckout(values);
    if (!result.ok) {
      setErrors(result.errors);
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    setErrors({});
    setCustomer(result.data);
    setStep('review');
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      notify({ tone: 'success', message: 'نُسخ نص الطلب. يمكنك لصقه في محادثة واتساب مع المتجر.' });
    } catch {
      notify({ tone: 'error', message: 'تعذر النسخ تلقائيًا. افتح «نص الرسالة» أدناه وانسخه يدويًا.' });
    }
  };

  if (step !== 'form' && customer) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {step === 'handoff' ? (
            <StatusPanel
              tone="warning"
              headingRef={stepHeadingRef}
              title="أكمل الإرسال من واتساب"
              body={[
                'جهزنا رسالة طلبك وفتحنا واتساب. الطلب لا يصل إلى المتجر إلا بعد أن تضغط زر الإرسال داخل واتساب.',
                'الطلب لا يعتبر مؤكدًا حتى يرد عليك المتجر بتأكيد السعر والتوفر والتوصيل.',
              ]}
            >
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  <Icon name="chat" />
                  إعادة فتح واتساب
                </a>
              ) : null}
              <button
                type="button"
                className="btn-outline"
                onClick={() => {
                  clear();
                  saveDraft(null);
                  setStep('cleared');
                }}
              >
                <Icon name="check" />
                أرسلت الرسالة — أفرغ السلة
              </button>
              <button type="button" className="btn-ghost" onClick={() => setStep('review')}>
                العودة لمراجعة الطلب
              </button>
            </StatusPanel>
          ) : (
            <div className="border-2 border-ink bg-white p-5 sm:p-6">
              <p className="eyebrow">الخطوة 2 من 2</p>
              <h2 ref={stepHeadingRef} tabIndex={-1} className="mt-2 text-2xl font-black focus:outline-none">
                راجع طلبك قبل الإرسال
              </h2>
              <p className="mt-2 leading-7 text-steel-700">
                {serverMode
                  ? 'تأكد من المنتجات والبيانات ثم اضغط «تأكيد الطلب». ستحصل على رقم طلب، ويتواصل معك المتجر لتأكيد السعر والتوفر والتوصيل.'
                  : 'تأكد من المنتجات والبيانات. عند الضغط على زر الإرسال سيفتح واتساب برسالة جاهزة إلى رقم المتجر، ويمكنك مراجعتها قبل إرسالها.'}
              </p>
              <ReviewDetails customer={customer} lines={lines} />
              {submitError ? (
                <div role="alert" className="mt-5 flex items-start gap-3 border-2 border-danger bg-danger-50 p-4 font-bold text-danger">
                  <Icon name="alert" className="mt-0.5 size-5 shrink-0" />
                  {submitError}
                </div>
              ) : null}
              {fallbackReason ? (
                <div role="alert" className="mt-5 flex items-start gap-3 border-2 border-orange bg-orange-50 p-4">
                  <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-orange-ink" />
                  <p className="leading-7">
                    <strong>تعذر تسجيل الطلب في النظام الآن.</strong> {fallbackReason} يمكنك إرسال الطلب عبر واتساب بدلًا من ذلك.
                  </p>
                </div>
              ) : null}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {serverMode ? (
                  <button type="button" className="btn-primary text-lg sm:flex-1" onClick={placeOrder} disabled={busy}>
                    <Icon name="check" />
                    {busy ? 'جارٍ إرسال الطلب…' : 'تأكيد الطلب'}
                  </button>
                ) : live.status === 'loading' ? (
                  <button type="button" className="btn-primary text-lg sm:flex-1" disabled>
                    جارٍ التحميل…
                  </button>
                ) : whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-lg sm:flex-1"
                    onClick={() => setStep('handoff')}
                  >
                    <Icon name="chat" />
                    إرسال الطلب عبر واتساب
                  </a>
                ) : (
                  <div role="alert" className="flex w-full items-start gap-3 border-2 border-orange bg-orange-50 p-4">
                    <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-orange-ink" />
                    <p className="leading-7">
                      <strong>رقم واتساب المتجر لم يُعتمد بعد</strong>، لذلك لا يمكن إرسال الطلب من الموقع حاليًا. يمكنك نسخ نص الطلب وإرساله لاحقًا.
                    </p>
                  </div>
                )}
                {!serverMode && live.status !== 'loading' ? (
                  <button type="button" className="btn-outline" onClick={copyMessage}>
                    <Icon name="copy" />
                    نسخ نص الطلب
                  </button>
                ) : null}
                <button type="button" className="btn-ghost" onClick={() => setStep('form')}>
                  تعديل البيانات
                </button>
              </div>
            </div>
          )}

          <details className="border border-line bg-white p-4" hidden={serverMode}>
            <summary className="cursor-pointer font-bold">نص الرسالة التي ستُرسل</summary>
            <label htmlFor="order-message" className="sr-only">
              نص رسالة الطلب
            </label>
            <textarea
              id="order-message"
              readOnly
              value={message}
              rows={14}
              className="mt-3 w-full border border-line bg-paper p-3 font-sans text-sm leading-6"
              onFocus={(e) => e.currentTarget.select()}
            />
          </details>
        </div>
        <OrderSidebar lines={lines} />
      </div>
    );
  }

  const errorEntries = Object.entries(errors) as [CheckoutField, string][];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form onSubmit={onSubmit} noValidate className="space-y-6" aria-labelledby="checkout-form-heading">
        <div>
          <p className="eyebrow">الخطوة 1 من 2</p>
          <h2 id="checkout-form-heading" className="mt-2 text-2xl font-black">
            بيانات العميل والتوصيل
          </h2>
          <p className="mt-1 text-steel-700">الحقول المعلّمة بـ * مطلوبة. لا نطلب أي بيانات دفع.</p>
        </div>

        {errorEntries.length > 0 ? (
          <div ref={errorSummaryRef} tabIndex={-1} role="alert" className="border-2 border-danger bg-danger-50 p-4 focus:outline-none">
            <p className="flex items-center gap-2 font-black text-danger">
              <Icon name="alert" />
              يرجى تصحيح {errorEntries.length === 1 ? 'الحقل التالي' : 'الحقول التالية'}:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm font-semibold">
              {errorEntries.map(([field, message]) => (
                <li key={field}>
                  <a href={`#checkout-${field}`} className="underline underline-offset-4">
                    {message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <fieldset className="space-y-4 border border-line bg-white p-4 sm:p-5">
          <legend className="px-1 text-lg font-black">بيانات العميل</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="الاسم" required value={values.name} error={errors.name} onChange={update} autoComplete="name" maxLength={LIMITS.name} />
            <Field
              id="phone"
              label="رقم الهاتف"
              required
              value={values.phone}
              error={errors.phone}
              onChange={update}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              maxLength={16}
              hint="رقم كويتي من 8 أرقام، مثل 5XXXXXXX"
              dir="ltr"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 border border-line bg-white p-4 sm:p-5">
          <legend className="px-1 text-lg font-black">عنوان التوصيل</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="area" label="المنطقة" required value={values.area} error={errors.area} onChange={update} list="kuwait-areas" autoComplete="address-level2" maxLength={LIMITS.area} hint="اختر من الاقتراحات أو اكتب اسم المنطقة" />
            <datalist id="kuwait-areas">
              {kuwaitAreaSuggestions.map((area) => (
                <option key={area} value={area} />
              ))}
            </datalist>
            <Field id="block" label="القطعة" required value={values.block} error={errors.block} onChange={update} inputMode="text" autoComplete="off" maxLength={LIMITS.block} />
            <Field id="street" label="الشارع" required value={values.street} error={errors.street} onChange={update} autoComplete="off" maxLength={LIMITS.street} />
            <Field id="house" label="المنزل أو المبنى" required value={values.house} error={errors.house} onChange={update} autoComplete="off" maxLength={LIMITS.house} />
          </div>
          <div>
            <label htmlFor="checkout-notes" className="field-label">
              تفاصيل إضافية <span className="font-semibold text-steel-700">(اختياري)</span>
            </label>
            <textarea
              id="checkout-notes"
              name="notes"
              rows={3}
              maxLength={LIMITS.notes}
              value={values.notes}
              onChange={(event) => update('notes', event.target.value)}
              placeholder="الجادة، الدور، رقم الشقة، أقرب معلم، أو ملاحظة على الطلب"
              className="field-input"
              aria-describedby="checkout-notes-hint"
            />
            <p id="checkout-notes-hint" className="field-hint">
              <span className="ltr-isolate">{values.notes.length}/{LIMITS.notes}</span>
            </p>
          </div>
        </fieldset>

        <button type="submit" className="btn-primary w-full text-lg sm:w-auto sm:px-10">
          مراجعة الطلب
          <Icon name="arrowLeft" />
        </button>
      </form>
      <OrderSidebar lines={lines} />
    </div>
  );
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
  required,
  hint,
  ...rest
}: {
  id: CheckoutField;
  label: string;
  value: string;
  error?: string;
  onChange: (field: CheckoutField, value: string) => void;
  required?: boolean;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange'>) {
  const inputId = `checkout-${id}`;
  const describedBy = [hint ? `${inputId}-hint` : null, error ? `${inputId}-error` : null].filter(Boolean).join(' ');
  return (
    <div>
      <label htmlFor={inputId} className="field-label">
        {label}
        {required ? <span aria-hidden="true" className="text-orange-ink"> *</span> : null}
      </label>
      <input
        id={inputId}
        name={id}
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        required={required}
        aria-required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="field-input"
        {...rest}
      />
      {hint ? (
        <p id={`${inputId}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} className="field-error">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ReviewDetails({ customer, lines }: { customer: CheckoutData; lines: CartLine[] }) {
  const rows: [string, string][] = [
    ['الاسم', customer.name],
    ['الهاتف', formatKuwaitPhone(customer.phone)],
    ['المنطقة', customer.area],
    ['القطعة', customer.block],
    ['الشارع', customer.street],
    ['المنزل/المبنى', customer.house],
  ];
  if (customer.notes) rows.push(['تفاصيل إضافية', customer.notes]);
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <section aria-labelledby="review-customer">
        <h3 id="review-customer" className="mb-3 font-black">
          بيانات التوصيل
        </h3>
        <dl className="divide-y divide-line border border-line">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[7rem_1fr] gap-3 px-3 py-2.5 text-sm">
              <dt className="text-steel-700">{label}</dt>
              <dd className={`whitespace-pre-line font-bold ${label === 'الهاتف' ? 'ltr-isolate text-end' : ''}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="review-items">
        <h3 id="review-items" className="mb-3 font-black">
          المنتجات
        </h3>
        <ul className="divide-y divide-line border border-line">
          {lines.map(({ product, quantity }) => (
            <li key={product.id} className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
              <span className="font-bold">
                {product.name} <span className="text-steel-700">× {quantity}</span>
              </span>
              <span className="shrink-0 font-bold">
                {product.priceFils === null ? PRICE_ON_REQUEST : <span className="ltr-isolate">{formatKwd(product.priceFils * quantity)}</span>}
              </span>
            </li>
          ))}
        </ul>
        <Link href={paths.cart} className="mt-2 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">
          تعديل السلة
        </Link>
      </section>
    </div>
  );
}

function OrderSidebar({ lines }: { lines: CartLine[] }) {
  return (
    <aside aria-labelledby="checkout-summary-heading" className="lg:sticky lg:top-24 lg:self-start">
      <div className="border-2 border-ink bg-white p-5">
        <h2 id="checkout-summary-heading" className="mb-4 text-xl font-black">
          ملخص الطلب
        </h2>
        <ul className="mb-4 space-y-2 border-b border-line pb-4 text-sm">
          {lines.map(({ product, quantity }) => (
            <li key={product.id} className="flex justify-between gap-3">
              <span className="font-semibold">{product.name}</span>
              <span className="ltr-isolate shrink-0 font-mono font-bold">×{quantity}</span>
            </li>
          ))}
        </ul>
        <OrderTotalsBox lines={lines.map((l) => ({ quantity: l.quantity, priceFils: l.product.priceFils }))} />
        <Link href={paths.cart} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">
          تعديل السلة
        </Link>
      </div>
      <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-steel-700">
        <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
        لا يتم أي دفع في الموقع ولا نطلب بيانات بطاقتك. الطلب مبدئي حتى يؤكده المتجر.
      </p>
    </aside>
  );
}

function StatusPanel({
  tone,
  title,
  body,
  children,
  headingRef,
}: {
  tone: 'success' | 'info' | 'warning';
  title: string;
  body: string[];
  children?: React.ReactNode;
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  const accent = tone === 'success' ? 'border-success' : tone === 'warning' ? 'border-orange' : 'border-ink';
  const icon = tone === 'success' ? 'check' : tone === 'warning' ? 'chat' : 'info';
  return (
    <div className={`border-2 border-s-8 bg-white p-6 ${accent}`} role="status">
      <Icon name={icon} className="size-8 text-ink" />
      <h2 ref={headingRef} tabIndex={-1} className="mt-3 text-2xl font-black focus:outline-none">
        {title}
      </h2>
      <div className="mt-2 space-y-2 leading-7 text-steel-700">
        {body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {children ? <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div> : null}
    </div>
  );
}

const receiptDate = new Intl.DateTimeFormat('ar-KW-u-nu-latn', { timeZone: 'Asia/Kuwait', dateStyle: 'medium', timeStyle: 'short' });

/** إيصال الطلب بعد حفظه في النظام — برقم طلب حقيقي من الخادم. */
function OrderReceipt({ order }: { order: PlacedOrder & { contactPhone: string } }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="border-2 border-s-8 border-success bg-white p-6" role="status">
        <Icon name="check" className="size-10 text-success" />
        <h2 ref={headingRef} tabIndex={-1} className="mt-3 text-3xl font-black focus:outline-none">
          تم استلام طلبك
        </h2>
        <p className="mt-4 text-sm font-bold text-steel-700">رقم الطلب</p>
        <p className="ltr-isolate mt-1 inline-block bg-ink px-3 py-2 font-mono text-2xl font-black tracking-wider text-paper">{order.id}</p>
        <p className="mt-4 leading-7 text-steel-700">
          سجّلنا طلبك بتاريخ {receiptDate.format(order.createdAt)}. سيتواصل معك فريق عتاد
          {order.contactPhone ? <> على الرقم <bdi className="font-bold text-ink">{formatKuwaitPhone(order.contactPhone)}</bdi></> : null} لتأكيد
          السعر والتوفر وموعد التوصيل. احتفظ برقم الطلب للمتابعة.
        </p>

        <ul className="mt-5 divide-y divide-line border border-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
              <span className="font-bold">
                {item.name} <span className="text-steel-700">× {item.quantity}</span>
              </span>
              <span className="shrink-0 font-bold">
                {item.unitPriceFils === null ? PRICE_ON_REQUEST : <span className="ltr-isolate">{formatKwd(item.unitPriceFils * item.quantity)}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between font-black">
          <span>{countPieces(order.itemCount)}</span>
          <span>{order.totalFils === null ? 'الإجمالي يحدده المتجر عند التأكيد' : <span className="ltr-isolate">{formatKwd(order.totalFils)}</span>}</span>
        </p>
        {order.totalFils !== null ? <p className="mt-1 text-sm text-steel-700">لا يشمل رسوم التوصيل إن وجدت.</p> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {order.whatsappUrl ? (
            <a href={order.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-outline sm:flex-1">
              <Icon name="chat" />
              تواصل معنا عبر واتساب برقم الطلب
            </a>
          ) : null}
          <Link href={paths.shop} className="btn-primary sm:flex-1">
            متابعة التسوق
          </Link>
        </div>
      </div>
      <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-steel-700">
        <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
        لم يُطلب منك أي دفع في الموقع. يتم الاتفاق على الدفع عند تأكيد الطلب.
      </p>
    </div>
  );
}
