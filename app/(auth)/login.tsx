import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useUsers } from '@/context/UsersContext';
import { useAuth } from '@/state/AuthContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';
import { colors, radius, spacing } from '@/ui/theme/tokens';
import { getHomeRouteByRole } from '@/utils/routing';

export default function LoginScreen() {
  const { user, signIn, isHydrated } = useAuth();
  const { resetToDemoUsers } = useUsers();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingUsers, setIsResettingUsers] = useState(false);

  if (!isHydrated) {
    return null;
  }

  if (user) {
    return <Redirect href={getHomeRouteByRole(user.role)} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>El Rey Distribuidora</Text>
      <Text style={styles.subtitle}>Inicia sesion con tu usuario y contraseña</Text>

      <Text style={styles.label}>Usuario</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Usuario"
        autoCapitalize="none"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />

      <PrimaryButton
        label="Iniciar sesion"
        loading={isSubmitting}
        loadingLabel="Ingresando..."
        onPress={async () => {
          setIsSubmitting(true);
          const result = await signIn({ username, password });
          showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
          setIsSubmitting(false);
        }}
      />

      {__DEV__ ? (
        <Pressable
          style={styles.debugButton}
          disabled={isResettingUsers}
          onPress={async () => {
            setIsResettingUsers(true);
            const result = await resetToDemoUsers();
            showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
            setIsResettingUsers(false);
          }}
        >
          <Text style={styles.debugButtonText}>
            {isResettingUsers ? 'Reseteando usuarios...' : 'Debug: reset usuarios demo'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  debugButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
  },
  debugButtonText: {
    color: colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
  },
});
