import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

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
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  question: {
    fontWeight: '700',
    marginTop: 6,
    color: colors.textPrimary,
  },
  answer: {
    color: colors.textSecondary,
  },
  actionButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surfaceMuted,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

