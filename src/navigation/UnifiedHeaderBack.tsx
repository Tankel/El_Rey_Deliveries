import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, typography } from '@/ui/theme/tokens';

type Props = {
  label: string;
  fallbackHref: string;
  style?: ViewStyle;
};

export function UnifiedHeaderBack({ label, fallbackHref, style }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={[styles.button, style]}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }
        router.replace(fallbackHref as never);
      }}
    >
      <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 36,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.subtitle - 1,
    fontWeight: '600',
  },
});
