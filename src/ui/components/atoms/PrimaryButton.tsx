import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/ui/theme/tokens';

type Props = {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  loadingLabel,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primaryText} />
      ) : null}
      <Text style={styles.text}>{loading ? loadingLabel ?? label : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonPressed: {
    backgroundColor: colors.primaryPressed,
    borderColor: colors.borderStrong,
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted,
    borderColor: colors.textMuted,
    opacity: 0.8,
  },
  text: {
    color: colors.primaryText,
    fontWeight: '600',
    textAlign: 'center',
  },
});
