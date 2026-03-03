import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { jsonStorage } from '@/core/storage/jsonStorage';
import { AccountProfile, AccountProfileUpdate, createDefaultAccountProfile } from '@/models/AccountProfile';
import { useAuth } from '@/state/AuthContext';

type ActionResult = {
  ok: boolean;
  message: string;
};

type ProfileContextValue = {
  profile: AccountProfile | null;
  isHydrated: boolean;
  updateProfile: (payload: AccountProfileUpdate) => ActionResult;
};

type StoredProfiles = Record<string, AccountProfile>;

const PROFILE_STORAGE_KEY = 'mvp.account.profiles';
const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

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
      profile: user ? profiles[user.id] ?? createDefaultAccountProfile(user) : null,
      isHydrated,
      updateProfile: (payload: AccountProfileUpdate) => {
        if (!user) {
          return { ok: false, message: 'Debes iniciar sesion para editar tu perfil.' };
        }

        if (payload.fullName !== undefined && !payload.fullName.trim()) {
          return { ok: false, message: 'El nombre completo no puede quedar vacio.' };
        }

        const base = profiles[user.id] ?? createDefaultAccountProfile(user);
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
        };

        setProfiles((prev) => ({
          ...prev,
          [user.id]: next,
        }));

        return { ok: true, message: 'Perfil actualizado.' };
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
