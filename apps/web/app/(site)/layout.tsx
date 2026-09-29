import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';

/** Header, footer and phone navigation for every page of the site (the 404 page stays bare). */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
