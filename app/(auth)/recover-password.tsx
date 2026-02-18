import { StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';

export default function RecoverPasswordScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{es.auth.recoverPassword}</Text>
      <Text>Pantalla mock para fase 1 (MVP).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
});
