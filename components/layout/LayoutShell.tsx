'use client';

import { usePathname } from 'next/navigation';

export function HideOnDialer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/dialer') return null;
  return <>{children}</>;
}

export function DialerGridRows() {
  const pathname = usePathname();
  // On dialer page: no top bar row, just sidebar + content
  // On other pages: top bar (52px) + sidebar + content
  return pathname === '/dialer' ? '1fr' : '52px 1fr';
}
