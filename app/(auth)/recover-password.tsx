import { StyleSheet, Text, View } from 'react-native';
import { es } from '@/i18n/es';
import { colors, spacing } from '@/ui/theme/tokens';

export default function RecoverPasswordScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{es.auth.recoverPassword}</Text>
      <Text style={styles.subtitle}>Pantalla mock para fase 1 (MVP).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textMuted,
  },
});
