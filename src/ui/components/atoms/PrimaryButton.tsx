import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

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
        <ActivityIndicator size="small" color="#ffffff" />
      ) : null}
      <Text style={styles.text}>{loading ? loadingLabel ?? label : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#111827',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonPressed: {
    backgroundColor: '#374151',
    borderColor: '#9ca3af',
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  buttonDisabled: {
    backgroundColor: '#6b7280',
    borderColor: '#6b7280',
    opacity: 0.8,
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
});
