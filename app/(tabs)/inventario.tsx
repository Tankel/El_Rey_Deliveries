import { StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';

export default function InventarioScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{es.inventory.title}</Text>
      <Text>{es.inventory.pending}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
});
