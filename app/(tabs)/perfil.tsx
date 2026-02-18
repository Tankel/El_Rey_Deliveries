import { StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useAuth } from '@/state/AuthContext';

export default function PerfilScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{es.profile.title}</Text>
      <Text>
        {es.profile.user}: {user?.username ?? es.profile.noSession}
      </Text>
      <PrimaryButton label={es.common.logout} onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
});
