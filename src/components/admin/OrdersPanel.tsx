'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '@/components/admin/api';
import { ProductName } from '@/components/product/ProductName';
import { Icon } from '@/components/ui/Icon';
import { useNotify } from '@/components/ui/Notices';
import { countPieces, formatKwd, PRICE_ON_REQUEST } from '@/lib/format';
import { ORDER_STATUSES, orderStatusLabels, type OrderRecord, type OrderStatus } from '@/lib/order/status';
import { formatKuwaitPhone } from '@/lib/phone';

const POLL_MS = 20_000;
const dateFormat = new Intl.DateTimeFormat('ar-KW-u-nu-latn', { timeZone: 'Asia/Kuwait', dateStyle: 'medium', timeStyle: 'short' });

const statusTone: Record<OrderStatus, string> = {
  new: 'bg-orange text-ink',
  contacted: 'bg-plate text-ink',
  confirmed: 'bg-ink text-paper',
  delivered: 'bg-success-50 text-success',
  cancelled: 'bg-danger-50 text-danger',
};

/** تنبيه صوتي قصير (يتطلب تفعيلًا بضغطة من المستخدم بسبب سياسة المتصفحات). */
function useAlertSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false);
  const play = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.22);
      gain.gain.exponentialRampToValueAtTime(0.4, now + i * 0.22 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.22 + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.22);
      osc.stop(now + i * 0.22 + 0.22);
    });
  }, []);
  const enable = useCallback(async () => {
    try {
      ctxRef.current ??= new AudioContext();
      await ctxRef.current.resume();
      setEnabled(ctxRef.current.state === 'running');
      play();
    } catch {
      setEnabled(false);
    }
  }, [play]);
  return { enabled, enable, play };
}

export function OrdersPanel({
  active,
  onError,
  onNewCount,
}: {
  active: boolean;
  onError: (e: unknown) => void;
  onNewCount: (n: number) => void;
}) {
  const [filter, setFilter] = useState<OrderStatus | null>(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [orders, setOrders] = useState<OrderRecord[] | null>(null);
  const [counts, setCounts] = useState<Partial<Record<OrderStatus, number>>>({});
  const [arrived, setArrived] = useState(0);
  const latestSeen = useRef<number | null>(null);
  const sound = useAlertSound();
  // play ثابت (useCallback)، أما كائن sound فيتجدد مع كل عرض — الاعتماد عليه يعيد التحميل بلا توقف
  const playSound = sound.play;

  const load = useCallback(async () => {
    try {
      const data = await adminApi.orders({ status: filter, q: submittedQuery });
      setOrders(data.orders);
      setCounts(data.counts);
      onNewCount(data.counts.new ?? 0);
      const newest = Math.max(0, ...data.orders.map((o) => o.createdAt));
      if (latestSeen.current !== null && newest > latestSeen.current) {
        const fresh = data.orders.filter((o) => o.createdAt > latestSeen.current!).length;
        setArrived((n) => n + fresh);
        playSound();
      }
      if (latestSeen.current === null || newest > latestSeen.current) latestSeen.current = newest;
    } catch (error) {
      onError(error);
    }
  }, [filter, submittedQuery, onError, onNewCount, playSound]);

  // متابعة الطلبات الجديدة: تحميل فوري ثم كل 20 ثانية أثناء ظهور الصفحة
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      if (document.visibilityState === 'visible') void load();
    };
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [active, load]);

  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <section aria-labelledby="orders-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="orders-heading" className="text-2xl font-black">
          الطلبات
        </h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} className="btn-outline min-h-10 px-3 text-sm">
            تحديث
          </button>
          <button
            type="button"
            onClick={() => void sound.enable()}
            aria-pressed={sound.enabled}
            className={`btn min-h-10 border-2 px-3 text-sm ${sound.enabled ? 'border-success bg-success-50 text-success' : 'border-ink'}`}
          >
            {sound.enabled ? 'صوت التنبيه مفعّل' : 'تفعيل صوت التنبيه'}
          </button>
        </div>
      </div>

      {arrived > 0 ? (
        <div role="alert" className="mt-4 flex items-center justify-between gap-3 border-2 border-orange bg-orange-50 p-3 font-black">
          <span className="flex items-center gap-2">
            <Icon name="cart" />
            وصل {arrived === 1 ? 'طلب جديد' : `${arrived} طلبات جديدة`}
          </span>
          <button type="button" onClick={() => setArrived(0)} className="btn-dark min-h-10 px-3 text-sm">
            تم
          </button>
        </div>
      ) : null}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <FilterChip active={filter === null} onClick={() => setFilter(null)} label="الكل" count={total} />
        {ORDER_STATUSES.map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} label={orderStatusLabels[s]} count={counts[s] ?? 0} />
        ))}
      </div>

      <form
        role="search"
        className="relative mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmittedQuery(query.trim());
        }}
      >
        <label htmlFor="orders-search" className="sr-only">
          ابحث برقم الطلب أو الاسم أو الهاتف
        </label>
        <input
          id="orders-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="رقم الطلب أو الاسم أو الهاتف"
          className="field-input pe-12"
        />
        <button type="submit" aria-label="بحث" className="absolute inset-y-0 end-0 grid w-12 place-items-center bg-ink text-paper">
          <Icon name="search" />
        </button>
      </form>

      <div className="mt-5 space-y-4">
        {orders === null ? (
          <p role="status" className="py-10 text-center font-bold text-steel-700">
            جارٍ تحميل الطلبات…
          </p>
        ) : orders.length === 0 ? (
          <p className="border-2 border-dashed border-steel-300 bg-white p-8 text-center font-bold text-steel-700">
            {submittedQuery || filter ? 'لا توجد طلبات مطابقة.' : 'لا توجد طلبات بعد. ستظهر هنا فور وصولها.'}
          </p>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onSaved={(updated) => {
                setOrders((list) => list?.map((o) => (o.id === updated.id ? updated : o)) ?? null);
                void load();
              }}
              onError={onError}
            />
          ))
        )}
      </div>
    </section>
  );
}

function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-10 shrink-0 items-center gap-2 border-2 px-3 text-sm font-bold ${active ? 'border-ink bg-ink text-paper' : 'border-line bg-white'}`}
    >
      {label}
      <span className={`ltr-isolate font-mono text-xs ${active ? 'text-orange' : 'text-steel-700'}`}>{count}</span>
    </button>
  );
}

function OrderCard({ order, onSaved, onError }: { order: OrderRecord; onSaved: (o: OrderRecord) => void; onError: (e: unknown) => void }) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState(order.adminNote);
  const [busy, setBusy] = useState(false);
  const notify = useNotify();
  const dirty = status !== order.status || note !== order.adminNote;
  const phoneIntl = `965${order.customer.phone}`;
  const waText = `مرحبًا ${order.customer.name}، معك متجر عتاد بخصوص طلبك رقم ${order.id}.`;

  return (
    <article className={`border-2 bg-white ${order.status === 'new' ? 'border-orange' : 'border-line'}`} aria-labelledby={`order-${order.id}`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <h2 id={`order-${order.id}`} className="ltr-isolate font-mono text-lg font-black">
            {order.id}
          </h2>
          <p className="text-sm text-steel-700">{dateFormat.format(order.createdAt)}</p>
        </div>
        <span className={`px-2 py-1 text-sm font-black ${statusTone[order.status]}`}>{orderStatusLabels[order.status]}</span>
      </header>

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-lg font-black">{order.customer.name}</p>
          <p className="ltr-isolate text-start font-bold">{formatKuwaitPhone(order.customer.phone)}</p>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:+${phoneIntl}`} className="btn-outline min-h-10 px-3 text-sm">
              <Icon name="phone" className="size-4" />
              اتصال
            </a>
            <a href={`https://wa.me/${phoneIntl}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className="btn-outline min-h-10 px-3 text-sm">
              <Icon name="chat" className="size-4" />
              واتساب
            </a>
          </div>
          <p className="leading-7 text-steel-700">
            <Icon name="pin" className="me-1 inline size-4" />
            {order.customer.area}، قطعة {order.customer.block}، شارع {order.customer.street}، {order.customer.house}
          </p>
          {order.customer.notes ? <p className="whitespace-pre-line bg-paper p-2 text-sm leading-6">{order.customer.notes}</p> : null}
        </div>

        <div>
          <ul className="divide-y divide-line border border-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                <span className="font-bold">
                  <ProductName name={item.name} /> <span className="text-steel-700">× {item.quantity}</span>
                </span>
                <span className="shrink-0 font-bold">
                  {item.unitPriceFils === null ? PRICE_ON_REQUEST : <span className="ltr-isolate">{formatKwd(item.unitPriceFils * item.quantity)}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex justify-between font-black">
            <span>{countPieces(order.itemCount)}</span>
            <span>{order.totalFils === null ? 'يحتاج تسعير' : <span className="ltr-isolate">{formatKwd(order.totalFils)}</span>}</span>
          </p>
        </div>
      </div>

      <form
        className="grid gap-3 border-t border-line bg-paper p-4 md:grid-cols-[12rem_1fr_auto] md:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const { order: updated } = await adminApi.updateOrder(order.id, { status, adminNote: note });
            notify({ tone: 'success', message: `حُفظ الطلب ${order.id}.` });
            onSaved(updated);
          } catch (error) {
            onError(error);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <label htmlFor={`status-${order.id}`} className="field-label">
            الحالة
          </label>
          <select id={`status-${order.id}`} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className="field-input">
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabels[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`note-${order.id}`} className="field-label">
            ملاحظة داخلية
          </label>
          <input id={`note-${order.id}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} className="field-input" placeholder="لا يراها العميل" />
        </div>
        <button type="submit" className="btn-dark" disabled={!dirty || busy}>
          {busy ? 'جارٍ الحفظ…' : 'حفظ'}
        </button>
      </form>
    </article>
  );
}
