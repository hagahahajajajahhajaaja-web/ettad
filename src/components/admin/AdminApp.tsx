'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { LogoMark } from '@/components/brand/Logo';
import { Icon } from '@/components/ui/Icon';
import { useNotify } from '@/components/ui/Notices';
import { adminApi, ApiError } from '@/components/admin/api';
import { OrdersPanel } from '@/components/admin/OrdersPanel';
import { ProductsPanel } from '@/components/admin/ProductsPanel';

type Gate = { state: 'checking' } | { state: 'login'; reason?: string } | { state: 'ready' } | { state: 'unavailable'; message: string };
type Tab = 'orders' | 'products';

/** لوحة تحكم عتاد: الطلبات + الأسعار والتوفر. الدخول بمفتاح يُحفظ في Cloudflare باسم ADMIN_KEY. */
export function AdminApp() {
  const [gate, setGate] = useState<Gate>({ state: 'checking' });
  const [tab, setTab] = useState<Tab>('orders');
  const [newCount, setNewCount] = useState(0);
  const notify = useNotify();

  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) setGate({ state: 'login', reason: 'انتهت الجلسة. سجّل الدخول مرة أخرى.' });
    else if (error instanceof ApiError && (error.code === 'DB_NOT_BOUND' || error.code === 'NO_API' || error.status === 404))
      setGate({ state: 'unavailable', message: error.message });
    else notify({ tone: 'error', message: error instanceof Error ? error.message : 'حدث خطأ.' });
  }, [notify]);

  useEffect(() => {
    adminApi
      .session()
      .then((r) => setGate(r.authenticated ? { state: 'ready' } : { state: 'login' }))
      .catch((error) =>
        setGate(
          error instanceof ApiError && error.status !== 401
            ? { state: 'unavailable', message: error.message }
            : { state: 'login' },
        ),
      );
  }, []);

  useEffect(() => {
    document.title = newCount > 0 ? `(${newCount}) طلبات جديدة | لوحة عتاد` : 'لوحة تحكم عتاد';
  }, [newCount]);

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch {
      // نخرج من الواجهة على أي حال
    }
    setGate({ state: 'login' });
  };

  return (
    <div className="min-h-dvh bg-paper">
      <header className="bg-ink text-paper">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <LogoMark className="size-9" tone="dark-bg" />
          <p className="font-black">
            لوحة تحكم عتاد
            <span className="block text-xs font-semibold text-steel-300">الطلبات والأسعار</span>
          </p>
          <div className="ms-auto flex items-center gap-1">
            <Link href="/" className="btn-ghost min-h-10 text-sm text-steel-300 hover:bg-ink-700 hover:text-paper">
              المتجر
            </Link>
            {gate.state === 'ready' ? (
              <button type="button" onClick={logout} className="btn-ghost min-h-10 text-sm text-steel-300 hover:bg-ink-700 hover:text-paper">
                خروج
              </button>
            ) : null}
          </div>
        </div>
        <div className="h-1 hazard" aria-hidden="true" />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {gate.state === 'checking' ? (
          <p role="status" className="flex items-center gap-3 py-16 font-bold text-steel-700">
            <span aria-hidden="true" className="size-5 animate-spin border-2 border-ink border-t-orange" />
            جارٍ التحقق من الجلسة…
          </p>
        ) : gate.state === 'unavailable' ? (
          <Unavailable message={gate.message} />
        ) : gate.state === 'login' ? (
          <LoginForm reason={gate.reason} onSuccess={() => setGate({ state: 'ready' })} />
        ) : (
          <>
            <div role="tablist" aria-label="أقسام لوحة التحكم" className="mb-6 grid grid-cols-2 border-2 border-ink bg-white">
              <TabButton active={tab === 'orders'} onClick={() => setTab('orders')} id="tab-orders" controls="panel-orders">
                الطلبات
                {newCount > 0 ? <span className="bg-orange px-1.5 text-xs font-black text-ink">{newCount} جديد</span> : null}
              </TabButton>
              <TabButton active={tab === 'products'} onClick={() => setTab('products')} id="tab-products" controls="panel-products">
                الأسعار والتوفر
              </TabButton>
            </div>
            <div id="panel-orders" role="tabpanel" aria-labelledby="tab-orders" hidden={tab !== 'orders'}>
              <OrdersPanel active={tab === 'orders'} onError={handleError} onNewCount={setNewCount} />
            </div>
            <div id="panel-products" role="tabpanel" aria-labelledby="tab-products" hidden={tab !== 'products'}>
              {tab === 'products' ? <ProductsPanel onError={handleError} /> : null}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children, id, controls }: { active: boolean; onClick: () => void; children: React.ReactNode; id: string; controls: string }) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 font-black transition-colors ${active ? 'bg-ink text-paper' : 'text-ink hover:bg-plate'}`}
    >
      {children}
    </button>
  );
}

function LoginForm({ reason, onSuccess }: { reason?: string; onSuccess: () => void }) {
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mx-auto mt-6 max-w-md border-2 border-ink bg-white p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!key.trim()) {
          setError('اكتب مفتاح الدخول.');
          return;
        }
        setBusy(true);
        setError(null);
        try {
          await adminApi.login(key);
          setKey('');
          onSuccess();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'تعذر تسجيل الدخول.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1 className="text-2xl font-black">تسجيل الدخول</h1>
      <p className="mt-1 text-sm leading-6 text-steel-700">لوحة خاصة بصاحب المتجر. أدخل مفتاح الدخول.</p>
      {reason ? <p className="mt-3 bg-orange-50 p-2 text-sm font-bold text-orange-ink">{reason}</p> : null}
      <label htmlFor="admin-key" className="field-label mt-5">
        مفتاح الدخول
      </label>
      <input
        id="admin-key"
        type="password"
        autoComplete="current-password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        className="field-input"
        dir="ltr"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'admin-key-error' : undefined}
      />
      {error ? (
        <p id="admin-key-error" role="alert" className="field-error">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary mt-5 w-full" disabled={busy}>
        {busy ? 'جارٍ الدخول…' : 'دخول'}
      </button>
    </form>
  );
}

function Unavailable({ message }: { message: string }) {
  return (
    <div role="status" className="mx-auto mt-6 max-w-xl border-2 border-s-8 border-orange bg-white p-6">
      <Icon name="info" className="size-8" />
      <h1 className="mt-3 text-2xl font-black">لوحة التحكم غير متاحة هنا</h1>
      <p className="mt-2 leading-7 text-steel-700">{message}</p>
      <p className="mt-2 leading-7 text-steel-700">
        لوحة التحكم تعمل بعد نشر الموقع على Cloudflare وربط قاعدة البيانات ETAAD_DB وضبط مفتاح ADMIN_KEY.
      </p>
    </div>
  );
}
