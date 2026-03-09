import { PropsWithChildren } from 'react';
import { AuthProvider } from './AuthContext';
import { OrdersProvider } from './OrdersContext';
import { ToastProvider } from '@/ui/feedback/ToastContext';
import { CartProvider } from '@/context/CartContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { CatalogProvider } from '@/context/CatalogContext';
import { UsersProvider } from '@/context/UsersContext';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <UsersProvider>
        <AuthProvider>
          <CatalogProvider>
            <ProfileProvider>
              <OrdersProvider>
                <CartProvider>{children}</CartProvider>
              </OrdersProvider>
            </ProfileProvider>
          </CatalogProvider>
        </AuthProvider>
      </UsersProvider>
    </ToastProvider>
  );
}
