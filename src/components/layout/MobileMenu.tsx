'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { LogoMark } from '@/components/brand/Logo';

type NavLink = { href: string; label: string };

/** قائمة الجوال — تستخدم <dialog> الأصلي لإدارة التركيز ومفتاح Esc. */
export function MobileMenu({ categories, pages }: { categories: NavLink[]; pages: NavLink[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // إغلاق القائمة عند الانتقال لصفحة أخرى
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-12 shrink-0 place-items-center text-paper hover:bg-ink-700 lg:hidden"
        aria-label="فتح قائمة الأقسام والصفحات"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="menu" className="size-6" />
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        aria-label="القائمة الرئيسية"
        className="fixed inset-0 m-0 ms-auto h-dvh max-h-none w-[min(22rem,88vw)] max-w-none bg-ink p-0 text-paper backdrop:bg-ink/70"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-ink-600 px-4 py-3">
            <span className="flex items-center gap-2 font-black">
              <LogoMark className="size-8" tone="dark-bg" />
              القائمة
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-12 place-items-center hover:bg-ink-700"
              aria-label="إغلاق القائمة"
            >
              <Icon name="close" className="size-6" />
            </button>
          </div>
          <nav aria-label="أقسام المتجر" className="overflow-y-auto px-4 py-5">
            <p className="eyebrow mb-3 text-steel-300">الأقسام</p>
            <ul className="space-y-1">
              {categories.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-12 items-center justify-between border-b border-ink-700 text-lg font-bold hover:text-orange"
                    aria-current={pathname === link.href ? 'page' : undefined}
                  >
                    {link.label}
                    <Icon name="chevronLeft" className="size-5 text-steel-300" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="eyebrow mb-3 mt-8 text-steel-300">المتجر</p>
            <ul className="space-y-1">
              {pages.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-12 items-center text-base font-semibold text-steel-300 hover:text-paper"
                    aria-current={pathname === link.href ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto h-2 hazard" aria-hidden="true" />
        </div>
      </dialog>
    </>
  );
}
