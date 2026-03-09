import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useUsers } from '@/context/UsersContext';
import { useAuth } from '@/state/AuthContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';
import { getHomeRouteByRole } from '@/utils/routing';

export default function LoginScreen() {
  const { user, signIn, isHydrated } = useAuth();
  const { resetToDemoUsers } = useUsers();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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
        placeholderTextColor="#6b7280"
        style={styles.input}
      />
      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        secureTextEntry
        autoCapitalize="none"
        placeholderTextColor="#6b7280"
        style={styles.input}
      />

      <PrimaryButton
        label="Iniciar sesion"
        onPress={() => {
          const result = signIn({ username, password });
          showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
        }}
      />

      {__DEV__ ? (
        <Pressable
          style={styles.debugButton}
          onPress={() => {
            const result = resetToDemoUsers();
            showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
          }}
        >
          <Text style={styles.debugButtonText}>Debug: reset usuarios demo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 12,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    color: '#4b5563',
    marginBottom: 8,
  },
  label: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    borderColor: '#9ca3af',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  debugButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
  },
  debugButtonText: {
    color: '#374151',
    fontWeight: '700',
    textAlign: 'center',
  },
});
