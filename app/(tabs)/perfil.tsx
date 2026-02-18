import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useAuth } from '@/state/AuthContext';

export default function PerfilScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text>Usuario: {user?.username ?? 'Sin sesión'}</Text>
      <PrimaryButton label="Cerrar sesión" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
});
