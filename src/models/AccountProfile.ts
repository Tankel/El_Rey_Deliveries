import { UserRole } from '@/types/domain';

export type AccountProfile = {
  userId: string;
  role: UserRole;
  fullName: string;
  accountNumber: string;
  email: string;
  phone: string;
  businessName: string;
  taxId: string;
  billingAddress: string;
};

export type AccountProfileUpdate = Partial<
  Pick<
    AccountProfile,
    'fullName' | 'accountNumber' | 'email' | 'phone' | 'businessName' | 'taxId' | 'billingAddress'
  >
>;

type DefaultProfileInput = {
  id: string;
  username: string;
  role: UserRole;
};

export function createDefaultAccountProfile(user: DefaultProfileInput): AccountProfile {
  return {
    userId: user.id,
    role: user.role,
    fullName: user.username,
    accountNumber: `ERD-${user.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)}`,
    email: `${user.id}@elrey.local`,
    phone: '+52 000 000 0000',
    businessName: 'Negocio Demo',
    taxId: 'XAXX010101000',
    billingAddress: 'Direccion fiscal pendiente',
  };
}
