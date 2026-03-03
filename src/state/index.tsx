import { PropsWithChildren } from 'react';
import { AuthProvider } from './AuthContext';
import { OrdersProvider } from './OrdersContext';
import { ToastProvider } from '@/ui/feedback/ToastContext';
import { CartProvider } from '@/context/CartContext';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <AuthProvider>
        <OrdersProvider>
          <CartProvider>{children}</CartProvider>
        </OrdersProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
