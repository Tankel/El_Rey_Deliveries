import { PropsWithChildren } from 'react';
import { AuthProvider } from './AuthContext';

export function AppProviders({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}
