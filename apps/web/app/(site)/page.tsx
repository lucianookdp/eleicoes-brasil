'use client';

import { OverviewView } from '@/components/overview';

/**
 * The site's address shows the results of the election that matters now, in the round a link
 * without "t" opens (the shell picks both). It used to load, ask the API which election that is
 * and only then go to /eleicao/: one more trip before the first number on a slow connection.
 */
export default function Home() {
  return <OverviewView initial={null} />;
}
