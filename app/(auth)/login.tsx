import { Redirect } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useAuth } from '@/state/AuthContext';

export default function LoginScreen() {
  const { user, signIn } = useAuth();
  const [username, setUsername] = useState('');

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>El Rey Distribuidora</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Usuario"
        style={styles.input}
      />
      <PrimaryButton
        label="Iniciar sesión"
        onPress={() => signIn(username || 'operador')}
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
  input: {
    borderColor: '#9ca3af',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
