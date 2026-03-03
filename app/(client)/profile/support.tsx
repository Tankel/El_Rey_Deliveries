import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SupportScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Soporte y ayuda</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Canales de contacto</Text>
        <Text>WhatsApp: +52 55 0000 0000</Text>
        <Text>Email: soporte@elrey.local</Text>
        <Text>Horario: Lun a Sab, 8:00 a 18:00</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preguntas frecuentes</Text>
        <Text style={styles.question}>1. Como rastreo un pedido?</Text>
        <Text style={styles.answer}>Entra a Pedidos y abre el detalle para ver su estado.</Text>
        <Text style={styles.question}>2. Como actualizo mis datos fiscales?</Text>
        <Text style={styles.answer}>Desde Perfil, edita la seccion de informacion personal.</Text>
        <Text style={styles.question}>3. Como obtengo mis facturas?</Text>
        <Text style={styles.answer}>Entra a Perfil y abre la seccion Facturas.</Text>
      </View>

      <Link href="/(client)/profile/billing" asChild>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Ir a facturas</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  question: {
    fontWeight: '700',
    marginTop: 6,
    color: '#111827',
  },
  answer: {
    color: '#4b5563',
  },
  actionButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  actionButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
});
