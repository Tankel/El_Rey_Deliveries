import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import {
  AccountProfile,
  AccountProfileUpdate,
  SavedAddress,
  createDefaultAccountProfile,
} from '@/models/AccountProfile';
import {
  addMyAddress,
  getMyProfile,
  removeMyAddress,
  setMyDefaultAddress,
  updateMyProfile,
} from '@/services/api/endpoints/profiles';
import { useAuth } from '@/state/AuthContext';

type ActionResult = {
  ok: boolean;
  message: string;
};

type ProfileContextValue = {
  profile: AccountProfile | null;
  isHydrated: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: AccountProfileUpdate) => Promise<ActionResult>;
  addSavedAddress: (payload: Omit<SavedAddress, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ActionResult>;
  removeSavedAddress: (addressId: string) => Promise<ActionResult>;
  setDefaultSavedAddress: (addressId: string) => Promise<ActionResult>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: PropsWithChildren) {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshProfile = async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      setIsHydrated(true);
      return;
    }

    try {
      const response = await getMyProfile();
      setProfile(response.profile);
    } catch {
      setProfile(createDefaultAccountProfile(user));
    } finally {
      setIsHydrated(true);
    }
  };

  useEffect(() => {
    setIsHydrated(false);
    void refreshProfile();
  }, [isAuthenticated, user?.id]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      isHydrated,
      refreshProfile,
      updateProfile: async (payload) => {
        if (!user) {
          return { ok: false, message: 'Debes iniciar sesion para editar tu perfil.' };
        }
        try {
          const response = await updateMyProfile(payload);
          setProfile(response.profile);
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo actualizar perfil.' };
        }
      },
      addSavedAddress: async (payload) => {
        if (!user) {
          return { ok: false, message: 'Debes iniciar sesion para guardar direcciones.' };
        }
        try {
          const response = await addMyAddress(payload);
          setProfile(response.profile);
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo guardar direccion.' };
        }
      },
      removeSavedAddress: async (addressId) => {
        if (!user) {
          return { ok: false, message: 'Debes iniciar sesion para editar direcciones.' };
        }
        try {
          const response = await removeMyAddress(addressId);
          setProfile(response.profile);
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo eliminar direccion.' };
        }
      },
      setDefaultSavedAddress: async (addressId) => {
        if (!user) {
          return { ok: false, message: 'Debes iniciar sesion para editar direcciones.' };
        }
        try {
          const response = await setMyDefaultAddress(addressId);
          setProfile(response.profile);
          return { ok: response.ok, message: response.message };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : 'No se pudo actualizar direccion predeterminada.' };
        }
      },
    }),
    [isHydrated, profile, user],
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
