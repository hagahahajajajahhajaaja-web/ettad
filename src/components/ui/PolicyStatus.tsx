import type { Policy } from '@/lib/schema';

const labels: Record<Policy['status'], string> = {
  approved: 'معتمدة',
  'describes-current-operation': 'تصف عمل الموقع الحالي',
  pending: 'قيد الإعداد',
};

export function PolicyStatusBadge({ status }: { status: Policy['status'] }) {
  const tone =
    status === 'approved'
      ? 'bg-success-50 text-success'
      : status === 'pending'
        ? 'bg-orange-50 text-orange-ink'
        : 'bg-plate text-steel-700';
  return <span className={`shrink-0 px-2 py-1 text-xs font-bold ${tone}`}>{labels[status]}</span>;
}
