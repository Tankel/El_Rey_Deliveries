import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { jsonStorage } from '@/core/storage/jsonStorage';
import {
  AccountProfile,
  AccountProfileUpdate,
  SavedAddress,
  createDefaultAccountProfile,
} from '@/models/AccountProfile';
import { useAuth } from '@/state/AuthContext';

type ActionResult = {
  ok: boolean;
  message: string;
};

type ProfileContextValue = {
  profile: AccountProfile | null;
  isHydrated: boolean;
  updateProfile: (payload: AccountProfileUpdate) => ActionResult;
  addSavedAddress: (payload: Omit<SavedAddress, 'id' | 'createdAt' | 'updatedAt'>) => ActionResult;
  removeSavedAddress: (addressId: string) => ActionResult;
  setDefaultSavedAddress: (addressId: string) => ActionResult;
};

type StoredProfiles = Record<string, AccountProfile>;

const PROFILE_STORAGE_KEY = 'mvp.account.profiles';
const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

function normalizeSavedAddresses(addresses: SavedAddress[] | undefined): SavedAddress[] {
  if (!addresses?.length) {
    return [];
  }
  const normalized = addresses
    .map((item) => ({
      ...item,
      id: item.id || `addr-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      label: item.label?.trim() || 'Direccion',
      formattedAddress: item.formattedAddress?.trim() || '',
      street: item.street?.trim() || '',
      exteriorNumber: item.exteriorNumber?.trim() || '',
      interiorNumber: item.interiorNumber?.trim() || '',
      neighborhood: item.neighborhood?.trim() || '',
      city: item.city?.trim() || '',
      state: item.state?.trim() || '',
      postalCode: item.postalCode?.trim() || '',
      references: item.references?.trim() || '',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      isDefault: Boolean(item.isDefault),
    }))
    .filter((item) => item.formattedAddress.length > 0);

  if (!normalized.length) {
    return [];
  }

  const hasDefault = normalized.some((item) => item.isDefault);
  if (!hasDefault) {
    normalized[0] = { ...normalized[0], isDefault: true };
  }

  return normalized;
}

function normalizeProfile(profile: AccountProfile): AccountProfile {
  return {
    ...profile,
    savedAddresses: normalizeSavedAddresses(profile.savedAddresses),
  };
}

export function ProfileProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<StoredProfiles>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const stored = await jsonStorage.read<StoredProfiles>(PROFILE_STORAGE_KEY, {});
      setProfiles(stored);
      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void jsonStorage.write(PROFILE_STORAGE_KEY, profiles);
  }, [isHydrated, profiles]);

  useEffect(() => {
    if (!isHydrated || !user) {
      return;
    }

    if (!profiles[user.id]) {
      setProfiles((prev) => ({
        ...prev,
        [user.id]: createDefaultAccountProfile(user),
      }));
    }
  }, [isHydrated, profiles, user]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile: user ? normalizeProfile(profiles[user.id] ?? createDefaultAccountProfile(user)) : null,
      isHydrated,
      updateProfile: (payload: AccountProfileUpdate) => {
        if (!user) {
          return { ok: false, message: 'Debes iniciar sesion para editar tu perfil.' };
        }

        if (payload.fullName !== undefined && !payload.fullName.trim()) {
          return { ok: false, message: 'El nombre completo no puede quedar vacio.' };
        }

        const base = normalizeProfile(profiles[user.id] ?? createDefaultAccountProfile(user));
        const next: AccountProfile = {
          ...base,
          ...payload,
          fullName: payload.fullName?.trim() ?? base.fullName,
          accountNumber: payload.accountNumber?.trim().toUpperCase() ?? base.accountNumber,
          email: payload.email?.trim() ?? base.email,
          phone: payload.phone?.trim() ?? base.phone,
          businessName: payload.businessName?.trim() ?? base.businessName,
          taxId: payload.taxId?.trim().toUpperCase() ?? base.taxId,
          billingAddress: payload.billingAddress?.trim() ?? base.billingAddress,
          savedAddresses: normalizeSavedAddresses(base.savedAddresses),
        };

        setProfiles((prev) => ({
          ...prev,
          [user.id]: next,
        }));

        return { ok: true, message: 'Perfil actualizado.' };
      },
      addSavedAddress: (payload) => {
        if (!user) {
          return { ok: false, message: 'Debes iniciar sesion para guardar direcciones.' };
        }
        if (!payload.formattedAddress.trim()) {
          return { ok: false, message: 'La direccion no es valida para guardarse.' };
        }

        const base = normalizeProfile(profiles[user.id] ?? createDefaultAccountProfile(user));
        const exists = base.savedAddresses.some(
          (item) => item.formattedAddress.toLowerCase() === payload.formattedAddress.trim().toLowerCase(),
        );
        if (exists) {
          return { ok: false, message: 'Esa direccion ya esta guardada.' };
        }

        const now = new Date().toISOString();
        const nextAddress: SavedAddress = {
          ...payload,
          id: `addr-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          label: payload.label.trim() || 'Direccion',
          formattedAddress: payload.formattedAddress.trim(),
          street: payload.street.trim(),
          exteriorNumber: payload.exteriorNumber.trim(),
          interiorNumber: payload.interiorNumber?.trim(),
          neighborhood: payload.neighborhood.trim(),
          city: payload.city.trim(),
          state: payload.state.trim(),
          postalCode: payload.postalCode.trim(),
          references: payload.references?.trim(),
          createdAt: now,
          updatedAt: now,
          isDefault: base.savedAddresses.length === 0,
        };

        const next: AccountProfile = {
          ...base,
          savedAddresses: [...base.savedAddresses, nextAddress],
          billingAddress: base.billingAddress === 'Direccion fiscal pendiente' ? nextAddress.formattedAddress : base.billingAddress,
        };

        setProfiles((prev) => ({
          ...prev,
          [user.id]: next,
        }));

        return { ok: true, message: 'Direccion guardada.' };
      },
      removeSavedAddress: (addressId) => {
        if (!user) {
          return { ok: false, message: 'Debes iniciar sesion para editar direcciones.' };
        }
        const base = normalizeProfile(profiles[user.id] ?? createDefaultAccountProfile(user));
        const target = base.savedAddresses.find((item) => item.id === addressId);
        if (!target) {
          return { ok: false, message: 'Direccion no encontrada.' };
        }
        const filtered = base.savedAddresses.filter((item) => item.id !== addressId);
        const nextAddresses =
          filtered.length > 0 && !filtered.some((item) => item.isDefault)
            ? [{ ...filtered[0], isDefault: true }, ...filtered.slice(1)]
            : filtered;
        const next: AccountProfile = {
          ...base,
          savedAddresses: nextAddresses,
        };
        setProfiles((prev) => ({
          ...prev,
          [user.id]: next,
        }));
        return { ok: true, message: 'Direccion eliminada.' };
      },
      setDefaultSavedAddress: (addressId) => {
        if (!user) {
          return { ok: false, message: 'Debes iniciar sesion para editar direcciones.' };
        }
        const base = normalizeProfile(profiles[user.id] ?? createDefaultAccountProfile(user));
        const exists = base.savedAddresses.some((item) => item.id === addressId);
        if (!exists) {
          return { ok: false, message: 'Direccion no encontrada.' };
        }

        const next: AccountProfile = {
          ...base,
          savedAddresses: base.savedAddresses.map((item) => ({
            ...item,
            isDefault: item.id === addressId,
            updatedAt: item.id === addressId ? new Date().toISOString() : item.updatedAt,
          })),
        };
        setProfiles((prev) => ({
          ...prev,
          [user.id]: next,
        }));
        return { ok: true, message: 'Direccion predeterminada actualizada.' };
      },
    }),
    [isHydrated, profiles, user],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used inside ProfileProvider');
  }
  return context;
}
