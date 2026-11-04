'use client';

import Link from 'next/link';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

type Notice = {
  id: number;
  tone: 'success' | 'error' | 'info';
  message: string;
  action?: { label: string; href: string };
};

type NoticeContextValue = { notify: (notice: Omit<Notice, 'id'>) => void };

const NoticeContext = createContext<NoticeContextValue | null>(null);

/** رسائل منبثقة قصيرة يقرؤها قارئ الشاشة (aria-live). */
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setNotices((list) => list.filter((n) => n.id !== id)), []);
  const notify = useCallback((notice: Omit<Notice, 'id'>) => {
    const id = nextId.current++;
    setNotices((list) => [...list.slice(-2), { ...notice, id }]);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-[4.75rem] z-50 flex flex-col items-center gap-2 px-4 sm:top-auto sm:bottom-6"
      >
        {notices.map((notice) => (
          <NoticeItem key={notice.id} notice={notice} onDismiss={dismiss} />
        ))}
      </div>
    </NoticeContext.Provider>
  );
}

function NoticeItem({ notice, onDismiss }: { notice: Notice; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(notice.id), notice.tone === 'error' ? 8000 : 4500);
    return () => window.clearTimeout(timer);
  }, [notice, onDismiss]);

  const tone =
    notice.tone === 'success' ? 'border-s-success' : notice.tone === 'error' ? 'border-s-danger' : 'border-s-orange';
  const icon = notice.tone === 'success' ? 'check' : notice.tone === 'error' ? 'alert' : 'info';

  return (
    <div
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex w-full max-w-md items-center gap-3 border-s-4 bg-ink px-4 py-3 text-paper ${tone}`}
    >
      <Icon name={icon} className="size-5 shrink-0 text-orange" />
      <p className="flex-1 text-sm font-semibold leading-6">{notice.message}</p>
      {notice.action ? (
        <Link href={notice.action.href} className="shrink-0 text-sm font-bold text-orange underline-offset-4 hover:underline">
          {notice.action.label}
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => onDismiss(notice.id)}
        className="-me-1 grid size-9 shrink-0 place-items-center text-steel-300 hover:text-paper"
        aria-label="إغلاق التنبيه"
      >
        <Icon name="close" className="size-4" />
      </button>
    </div>
  );
}

export function useNotify() {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error('useNotify يجب أن يُستخدم داخل NoticeProvider');
  return ctx.notify;
}
