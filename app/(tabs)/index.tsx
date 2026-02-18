import { StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{es.dashboard.title}</Text>
      <Text>{es.dashboard.kpiSummary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
});
