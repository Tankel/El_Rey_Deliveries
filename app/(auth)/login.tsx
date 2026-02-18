import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/state/AuthContext';
import { UserRole } from '@/types/domain';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { getHomeRouteByRole } from '@/utils/routing';

export default function LoginScreen() {
  const { user, signIn, isHydrated } = useAuth();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('CLIENT');

  if (!isHydrated) {
    return null;
  }

  if (user) {
    return <Redirect href={getHomeRouteByRole(user.role)} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>El Rey Distribuidora</Text>
      <Text style={styles.subtitle}>MVP roles: Cliente, Admin y Repartidor</Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Usuario"
        autoCapitalize="none"
        style={styles.input}
      />

      <View style={styles.roleRow}>
        <PrimaryButton label="Cliente" onPress={() => setRole('CLIENT')} />
        <PrimaryButton label="Admin" onPress={() => setRole('ADMIN')} />
        <PrimaryButton label="Repartidor" onPress={() => setRole('DRIVER')} />
      </View>

      <Text style={styles.currentRole}>Rol seleccionado: {role}</Text>

      <PrimaryButton
        label="Iniciar sesion"
        onPress={() =>
          signIn({
            username: username || 'operador',
            role,
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#4b5563',
  },
  input: {
    borderColor: '#9ca3af',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currentRole: {
    fontWeight: '600',
  },
});
