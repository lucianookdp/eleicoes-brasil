'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Realtime events invalidate; polling is only the fallback when SSE is down.
            staleTime: 5_000,
            refetchInterval: 60_000,
            refetchOnWindowFocus: true,
            retry: 2,
          },
        },
      }),
  );
  // A signature for whoever opens the developer tools (recruiters, other developers).
  useEffect(() => {
    console.info(
      '%cEleições Brasil%c feito por lucianookdp · https://lucianookdp.dev',
      'font-weight:700;color:#28b870',
      'color:inherit',
    );
  }, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
