import type { Metadata } from 'next';
import { StatesView } from '@/components/states-view';

export const metadata: Metadata = { title: 'Estados' };

export default function StatesPage() {
  return <StatesView />;
}
