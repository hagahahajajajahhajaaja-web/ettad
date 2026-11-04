import type { Category } from '@/lib/schema';

/** رسومات خطية بسيطة للأقسام — رموز عامة وليست صورًا للمنتجات. */
export function CategoryIcon({ icon, className = 'size-12' }: { icon: Category['icon']; className?: string }) {
  const common = {
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.5,
    strokeLinecap: 'square' as const,
    strokeLinejoin: 'miter' as const,
    className,
    'aria-hidden': true,
  };
  switch (icon) {
    case 'washer':
      return (
        <svg {...common}>
          <path d="M8 22h22v26H8zM30 30h8l4-4h10M52 22v8" />
          <path d="M14 48v6m12-6v6M13 30h12m-12 8h8" />
          <path d="M56 18l4-4m-4 12h5m-5 8 4 4" />
        </svg>
      );
    case 'sockets':
      return (
        <svg {...common}>
          <path d="M10 40l20-20 6 6-20 20z" />
          <path d="M36 14a8 8 0 1 1 14 14l-4-4-4 2-2-4-4-2 2-4z" />
          <rect x="40" y="38" width="12" height="16" />
          <path d="M43 38v-4h6v4" />
        </svg>
      );
    case 'toolcase':
      return (
        <svg {...common}>
          <path d="M8 20h44v30H8zM22 20v-6h16v6M8 32h44" />
          <path d="M26 30v6h8v-6" />
          <circle cx="14" cy="54" r="3" />
          <circle cx="46" cy="54" r="3" />
          <path d="M52 24h4v20" />
        </svg>
      );
    case 'power':
      return (
        <svg {...common}>
          <path d="M10 18h30v12H10zM40 22h12m-12 4h8M18 30l-4 22h10l2-22" />
          <path d="M30 34l-4 8h6l-4 8" />
        </svg>
      );
    case 'compressor':
      return (
        <svg {...common}>
          <path d="M10 26h30v18H10zM16 26v-6h18v6M40 32h8v6h-8" />
          <circle cx="25" cy="35" r="5" />
          <path d="M48 35h6c4 0 4 8 0 8h-4" />
          <path d="M14 44v6m22-6v6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M32 6 54 19v26L32 58 10 45V19z" />
          <path d="M24 24h16v16H24z" />
        </svg>
      );
  }
}
