import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/state/AuthContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

type FormState = {
  fullName: string;
  accountNumber: string;
  email: string;
  phone: string;
  businessName: string;
  taxId: string;
  billingAddress: string;
};

const EMPTY_FORM: FormState = {
  fullName: '',
  accountNumber: '',
  email: '',
  phone: '',
  businessName: '',
  taxId: '',
  billingAddress: '',
};
const PLACEHOLDER_COLOR = colors.textMuted;

export default function ClientProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, isHydrated, updateProfile } = useProfile();
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setForm({
      fullName: profile.fullName,
      accountNumber: profile.accountNumber,
      email: profile.email,
      phone: profile.phone,
      businessName: profile.businessName,
      taxId: profile.taxId,
      billingAddress: profile.billingAddress,
    });
  }, [profile]);

  if (!isHydrated || !profile) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
        <Text style={styles.metaText}>Cargando perfil...</Text>
      </View>
    );
  }

  const saveProfile = async () => {
    setIsSaving(true);
    const result = updateProfile(form);
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    await new Promise((resolve) => setTimeout(resolve, 250));
    setIsSaving(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mi cuenta</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informacion personal</Text>
        <Text style={styles.fieldLabel}>Nombre completo</Text>
        <TextInput
          value={form.fullName}
          onChangeText={(value) => setForm((prev) => ({ ...prev, fullName: value }))}
          placeholder="Nombre completo"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
        />
        <Text style={styles.fieldLabel}>Numero de cuenta</Text>
        <TextInput
          value={form.accountNumber}
          onChangeText={(value) => setForm((prev) => ({ ...prev, accountNumber: value }))}
          placeholder="Numero de cuenta"
          autoCapitalize="characters"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
        />
        <Text style={styles.fieldLabel}>Correo</Text>
        <TextInput
          value={form.email}
          onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
          placeholder="Correo"
          autoCapitalize="none"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
        />
        <Text style={styles.fieldLabel}>Telefono</Text>
        <TextInput
          value={form.phone}
          onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
          placeholder="Telefono"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
        />
        <Text style={styles.fieldLabel}>Nombre comercial</Text>
        <TextInput
          value={form.businessName}
          onChangeText={(value) => setForm((prev) => ({ ...prev, businessName: value }))}
          placeholder="Nombre comercial"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
        />
        <Text style={styles.fieldLabel}>RFC</Text>
        <TextInput
          value={form.taxId}
          onChangeText={(value) => setForm((prev) => ({ ...prev, taxId: value }))}
          placeholder="RFC"
          autoCapitalize="characters"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
        />
        <Text style={styles.fieldLabel}>Direccion fiscal</Text>
        <TextInput
          value={form.billingAddress}
          onChangeText={(value) => setForm((prev) => ({ ...prev, billingAddress: value }))}
          placeholder="Direccion fiscal"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
        />
        <PrimaryButton
          label="Guardar cambios"
          loading={isSaving}
          loadingLabel="Guardando..."
          onPress={saveProfile}
        />
        <Text style={styles.metaText}>Usuario: {user?.username ?? '-'}</Text>
        <Text style={styles.metaText}>Rol: {profile.role}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mas secciones</Text>
        <Link href="/(client)/profile/billing" asChild>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Ir a facturas</Text>
          </Pressable>
        </Link>
        <Link href="/(client)/profile/support" asChild>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Obtener soporte y ayuda</Text>
          </Pressable>
        </Link>
      </View>

      <PrimaryButton label="Cerrar sesion" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 12,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 2,
  },
  input: {
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
  },
  metaText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surfaceMuted,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

