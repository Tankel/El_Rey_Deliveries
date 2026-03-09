import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/state/AuthContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';

export default function AdminProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil admin</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Usuario</Text>
        <Text style={styles.value}>{user?.username ?? '-'}</Text>
        <Text style={styles.label}>Rol</Text>
        <Text style={styles.value}>{user?.role ?? '-'}</Text>
      </View>
      <PrimaryButton label="Cerrar sesion" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  label: {
    color: '#6b7280',
    fontSize: 12,
  },
  value: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
});
