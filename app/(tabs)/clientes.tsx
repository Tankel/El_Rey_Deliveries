import { StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';

export default function ClientesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{es.clients.title}</Text>
      <Text>{es.clients.pending}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
});
