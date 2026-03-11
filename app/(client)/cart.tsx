import { memo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCart } from '@/context/CartContext';
import { Product } from '@/models/Product';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

type CartRowItem = {
  product: Product;
  quantity: number;
};

type CartItemRowProps = {
  item: CartRowItem;
  onDecrease: (item: CartRowItem) => void;
  onIncrease: (item: CartRowItem) => void;
  onRemove: (item: CartRowItem) => void;
};

const CartItemRow = memo(function CartItemRow({ item, onDecrease, onIncrease, onRemove }: CartItemRowProps) {
  return (
    <View style={styles.item}>
      <Image source={{ uri: item.product.image }} style={styles.image} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        <Text style={styles.mutedText}>{formatCurrency(item.product.price)} c/u</Text>
        <View style={styles.qtyRow}>
          <Pressable style={styles.qtyButton} onPress={() => onDecrease(item)}>
            <Text style={styles.qtyButtonText}>-</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <Pressable style={styles.qtyButton} onPress={() => onIncrease(item)}>
            <Text style={styles.qtyButtonText}>+</Text>
          </Pressable>
        </View>
      </View>
      <Pressable style={styles.removeButton} onPress={() => onRemove(item)}>
        <Text style={styles.removeText}>Eliminar</Text>
      </Pressable>
    </View>
  );
});

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    isHydrated,
    subtotal,
    totalSavings,
    updateItemQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { showToast } = useToast();

  const handleConfirmOrder = () => {
    if (items.length === 0) {
      showToast({ message: 'No puedes confirmar un pedido vacio.', type: 'error' });
      return;
    }
    router.push('/(client)/checkout-address');
  };

  const handleClearCart = () => {
    Alert.alert('Vaciar carrito', 'Estas seguro que deseas vaciar el carrito?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Si, vaciar',
        style: 'destructive',
        onPress: () => {
          clearCart();
          showToast({ message: 'Carrito vaciado.', type: 'success' });
        },
      },
    ]);
  };

  const handleDecrease = useCallback(
    (item: CartRowItem) => {
      const next = Math.max(item.quantity - 1, 1);
      const result = updateItemQuantity(item.product.id, next);
      if (!result.ok) {
        showToast({ message: result.message, type: 'error' });
      }
    },
    [showToast, updateItemQuantity],
  );

  const handleIncrease = useCallback(
    (item: CartRowItem) => {
      const result = updateItemQuantity(item.product.id, item.quantity + 1);
      showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    },
    [showToast, updateItemQuantity],
  );

  const handleRemove = useCallback(
    (item: CartRowItem) => {
      const result = removeItem(item.product.id);
      showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    },
    [removeItem, showToast],
  );

  const renderItem = useCallback(
    ({ item }: { item: CartRowItem }) => (
      <CartItemRow
        item={item}
        onDecrease={handleDecrease}
        onIncrease={handleIncrease}
        onRemove={handleRemove}
      />
    ),
    [handleDecrease, handleIncrease, handleRemove],
  );

  if (!isHydrated) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
        <Text style={styles.mutedText}>Cargando carrito...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Carrito</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        ListEmptyComponent={
          <View style={styles.centerBox}>
            <Text style={styles.mutedText}>Tu carrito esta vacio.</Text>
          </View>
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />

      <View style={styles.summary}>
        <Text style={styles.summaryText}>Subtotal: {formatCurrency(subtotal)}</Text>
        <Text style={styles.summaryText}>Ahorro total: {formatCurrency(totalSavings)}</Text>
      </View>

      <PrimaryButton
        label="Confirmar pedido"
        onPress={handleConfirmOrder}
      />
      <PrimaryButton
        label="Vaciar carrito"
        onPress={handleClearCart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  mutedText: {
    color: colors.textMuted,
  },
  listContent: {
    gap: spacing.sm,
  },
  item: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 10,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  itemInfo: {
    flex: 1,
    gap: 6,
  },
  itemName: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  qtyButtonText: {
    fontWeight: '700',
    fontSize: 18,
    color: colors.textPrimary,
  },
  qtyValue: {
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '700',
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerBg,
  },
  removeText: {
    color: colors.danger,
    fontWeight: '700',
  },
  summary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 6,
  },
  summaryText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

