import type { Metadata } from 'next';
import { OperationsView } from '@/components/operations-view';

export const metadata: Metadata = { title: 'Ao vivo' };

export default function OperationsPage() {
  return <OperationsView />;
}
