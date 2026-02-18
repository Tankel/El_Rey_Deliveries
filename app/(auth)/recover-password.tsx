import { StyleSheet, Text, View } from 'react-native';

export default function RecoverPasswordScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text>Pantalla mock para fase 1 (MVP).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '600' },
});
