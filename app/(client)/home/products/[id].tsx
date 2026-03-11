import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCatalog } from '@/context/CatalogContext';
import { useCart } from '@/context/CartContext';
import { formatProductPresentation } from '@/models/Product';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';
import { appStyles } from '@/ui/theme/appStyles';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function ProductDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { products, isHydrated } = useCatalog();
  const { addItem, items } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const product = useMemo(
    () => products.find((item) => item.id === params.id) ?? null,
    [params.id, products],
  );
  const isLoading = !isHydrated;

  const savings = useMemo(() => {
    if (!product) {
      return 0;
    }
    return Math.max(product.originalPrice - product.price, 0) * quantity;
  }, [product, quantity]);

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
        <Text style={appStyles.mutedText}>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerBox}>
        <Text style={appStyles.emptyText}>Producto no encontrado.</Text>
      </View>
    );
  }

  const hasStock = product.stock !== undefined;
  const currentStock = product.stock ?? 0;
  const outOfStock = hasStock && currentStock <= 0;
  const lowStock = hasStock && currentStock > 0 && currentStock <= 5;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.metaText}>{product.brand}</Text>
      <Text style={styles.metaText}>{formatProductPresentation(product)}</Text>
      {outOfStock ? <Text style={styles.stockOutText}>Sin stock</Text> : null}
      {lowStock ? <Text style={styles.stockLowText}>Ultimas unidades: {currentStock}</Text> : null}

      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatCurrency(product.price)}</Text>
        <Text style={styles.originalPrice}>{formatCurrency(product.originalPrice)}</Text>
        <Text style={styles.discount}>-{product.discountPercent}%</Text>
      </View>

      <Text style={styles.savings}>Total del producto: {formatCurrency(product.price * quantity)}</Text>
      <Text style={styles.savings}>Ahorro calculado: {formatCurrency(savings)}</Text>

      <View style={styles.qtyRow}>
        <Text style={styles.qtyLabel}>Cantidad</Text>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepButton}
            onPress={() => setQuantity((prev) => Math.max(prev - 1, 1))}
          >
            <Text style={styles.stepText}>-</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <Pressable
            style={styles.stepButton}
            onPress={() =>
              setQuantity((prev) => {
                if (!hasStock) {
                  return prev + 1;
                }
                return Math.min(prev + 1, Math.max(currentStock, 1));
              })
            }
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.infoTitle}>Vendido por</Text>
        <Text>{product.seller}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoTitle}>Empaque</Text>
        <Text>{product.packaging}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoTitle}>Tipo de contenedor</Text>
        <Text>{product.containerType}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoTitle}>Descripcion</Text>
        <Text>{product.description}</Text>
      </View>

      <PrimaryButton
        label={outOfStock ? 'Sin stock' : `Agregar (${quantity})`}
        disabled={outOfStock}
        onPress={() => {
          const existingQuantity = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
          const addNow = () => {
            const result = addItem(product, quantity);
            showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
          };

          if (existingQuantity > 0) {
            Alert.alert(
              'Producto ya en carrito',
              `Ya llevas ${existingQuantity} en el carrito. Quieres agregar ${quantity} mas?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Agregar', onPress: addNow },
              ],
            );
            return;
          }

          addNow();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  name: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaText: {
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  originalPrice: {
    fontSize: typography.body,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  discount: {
    color: colors.success,
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontWeight: '700',
  },
  savings: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stockOutText: {
    color: colors.danger,
    fontWeight: '700',
  },
  stockLowText: {
    color: colors.warning,
    fontWeight: '700',
  },
  qtyRow: {
    gap: spacing.sm,
  },
  qtyLabel: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    alignSelf: 'flex-start',
  },
  stepButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  stepText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  infoBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  infoTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
