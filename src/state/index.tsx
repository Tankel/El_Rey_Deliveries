import { PropsWithChildren } from 'react';
import { AuthProvider } from './AuthContext';
import { OrdersProvider } from './OrdersContext';
import { ToastProvider } from '@/ui/feedback/ToastContext';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <AuthProvider>
        <OrdersProvider>{children}</OrdersProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
