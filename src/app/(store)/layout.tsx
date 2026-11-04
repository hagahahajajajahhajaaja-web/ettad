import type { ReactNode } from 'react';
import { StoreChrome } from '@/components/layout/StoreChrome';

export default function StoreLayout({ children }: { children: ReactNode }) {
  return <StoreChrome>{children}</StoreChrome>;
}
