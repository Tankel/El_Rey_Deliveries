import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleProp, StyleSheet, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/ui/theme/tokens';

type Props = {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

export function SearchField({
  value,
  onChangeText,
  placeholder,
  style,
  inputStyle,
  autoCapitalize = 'none',
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search-outline" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, inputStyle]}
        autoCapitalize={autoCapitalize}
      />
      {value.trim().length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpiar busqueda"
          onPress={() => onChangeText('')}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    minHeight: 42,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
