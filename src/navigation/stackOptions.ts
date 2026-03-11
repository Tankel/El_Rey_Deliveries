import { colors } from '@/ui/theme/tokens';

export const standardStackScreenOptions = {
  animation: 'slide_from_right' as const,
  gestureEnabled: true,
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' as const },
};
