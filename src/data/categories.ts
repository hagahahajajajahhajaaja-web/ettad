import type { Category } from '@/lib/schema';

/**
 * أقسام المتجر. القسم الذي لا يحتوي على منتجات لا يظهر في الموقع تلقائيًا،
 * لذلك يمكن تجهيز أقسام مستقبلية هنا دون إنشاء صفحات فارغة.
 */
export const categories: Category[] = [
  {
    id: 'washing-cleaning',
    name: 'معدات الغسيل والتنظيف',
    shortName: 'الغسيل والتنظيف',
    description: 'ماكينات الغسيل بالضغط العالي ومعدات التنظيف للمنزل والسيارة وأماكن العمل.',
    icon: 'washer',
    sortOrder: 1,
  },
  {
    id: 'power-tools',
    name: 'الأدوات الكهربائية',
    shortName: 'الأدوات الكهربائية',
    description: 'الدريلات اللاسلكية لأعمال الثقب وربط البراغي.',
    icon: 'power',
    sortOrder: 2,
  },
  {
    id: 'hand-tools',
    name: 'العدد والأدوات اليدوية',
    shortName: 'العدد اليدوية',
    description: 'أطقم البوكسات والمفاتيح وشنط العدة لأعمال الصيانة والتركيب.',
    icon: 'sockets',
    sortOrder: 3,
  },
  {
    id: 'maintenance-kits',
    name: 'أطقم وأدوات الصيانة',
    shortName: 'أطقم الصيانة',
    description: 'حقائب وأطقم أدوات متكاملة لأعمال الصيانة المتنقلة.',
    icon: 'toolcase',
    sortOrder: 4,
  },
  {
    id: 'car-tools',
    name: 'معدات السيارات',
    shortName: 'معدات السيارات',
    description: 'مفاتيح التواير اللاسلكية ومنفاخ الإطارات.',
    icon: 'compressor',
    sortOrder: 5,
  },
];
