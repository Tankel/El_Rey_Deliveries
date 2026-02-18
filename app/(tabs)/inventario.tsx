import { StyleSheet, Text, View } from 'react-native';

export default function InventarioScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventario</Text>
      <Text>Entradas/salidas y validación de stock (pendiente).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
});
