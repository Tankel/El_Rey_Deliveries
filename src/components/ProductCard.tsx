import { memo } from 'react';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Product, formatProductPresentation } from '@/models/Product';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

type Props = {
  product: Product;
  onAdd: (product: Product) => void;
};

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatPackageBadge(product: Product) {
  if (product.quantityPerPack > 1) {
    return `${product.quantityPerPack} pzs`;
  }

  const sizeText = Number.isInteger(product.sizeValue) ? String(product.sizeValue) : product.sizeValue.toFixed(1);
  return `${sizeText} ${product.unit}`;
}

function ProductCardComponent({ product, onAdd }: Props) {
  const router = useRouter();
  const hasStock = product.stock !== undefined;
  const stock = product.stock ?? 0;
  const outOfStock = hasStock && stock <= 0;
  const lowStock = hasStock && stock > 0 && stock <= 5;
  const packageBadgeText = formatPackageBadge(product);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/(client)/home/products/${product.id}`)}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        <View style={styles.imageBadge}>
          <Text style={styles.imageBadgeText}>{packageBadgeText}</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.presentation}>{formatProductPresentation(product)}</Text>
        {outOfStock ? <Text style={styles.stockOutText}>Sin stock</Text> : null}
        {lowStock ? <Text style={styles.stockLowText}>Ultimas unidades: {stock}</Text> : null}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          <Text style={styles.originalPrice}>{formatCurrency(product.originalPrice)}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{product.discountPercent}%</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            outOfStock && styles.addButtonDisabled,
            pressed && !outOfStock && styles.addButtonPressed,
          ]}
          onPress={(event) => {
            event.stopPropagation();
            onAdd(product);
          }}
          disabled={outOfStock}
        >
          <Text style={styles.addButtonText}>{outOfStock ? 'Sin stock' : 'Agregar'}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export const ProductCard = memo(ProductCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: colors.surfaceMuted,
  },
  imageBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(17,24,39,0.85)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  imageBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  name: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  presentation: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  stockOutText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  stockLowText: {
    color: colors.warning,
    fontWeight: '700',
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  badge: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.98 }],
  },
  addButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  addButtonText: {
    color: colors.primaryText,
    fontWeight: '600',
  },
});
