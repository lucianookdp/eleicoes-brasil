import type { Metadata } from 'next';
import { CompareView } from '@/components/compare-view';

export const metadata: Metadata = { title: 'Comparar estados' };

export default function ComparePage() {
  return <CompareView />;
}
