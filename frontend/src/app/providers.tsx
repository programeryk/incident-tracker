'use client';

import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { AppShell } from '@/features/layout/AppShell';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <AppShell>{children}</AppShell>
    </Provider>
  );
}
