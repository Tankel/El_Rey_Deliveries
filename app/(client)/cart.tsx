import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCart } from '@/context/CartContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function CartScreen() {
  const {
    items,
    isHydrated,
    subtotal,
    totalSavings,
    updateItemQuantity,
    removeItem,
    confirmOrder,
    clearCart,
  } = useCart();
  const { showToast } = useToast();

  if (!isHydrated) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#111827" />
        <Text>Cargando carrito...</Text>
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
            <Text>Tu carrito esta vacio.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: item.product.image }} style={styles.image} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text>{formatCurrency(item.product.price)} c/u</Text>
              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.qtyButton}
                  onPress={() => {
                    const next = Math.max(item.quantity - 1, 1);
                    const result = updateItemQuantity(item.product.id, next);
                    if (!result.ok) {
                      showToast({ message: result.message, type: 'error' });
                    }
                  }}
                >
                  <Text style={styles.qtyButtonText}>-</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable
                  style={styles.qtyButton}
                  onPress={() => {
                    const result = updateItemQuantity(item.product.id, item.quantity + 1);
                    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
                  }}
                >
                  <Text style={styles.qtyButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              style={styles.removeButton}
              onPress={() => {
                const result = removeItem(item.product.id);
                showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
              }}
            >
              <Text style={styles.removeText}>Eliminar</Text>
            </Pressable>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.summary}>
        <Text>Subtotal: {formatCurrency(subtotal)}</Text>
        <Text>Ahorro total: {formatCurrency(totalSavings)}</Text>
      </View>

      <PrimaryButton
        label="Confirmar pedido"
        onPress={() => {
          const result = confirmOrder();
          showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
        }}
      />
      <PrimaryButton
        label="Vaciar carrito"
        onPress={() => {
          clearCart();
          showToast({ message: 'Carrito vaciado.', type: 'success' });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  listContent: {
    gap: 8,
  },
  item: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
    gap: 6,
  },
  itemName: {
    fontWeight: '700',
    color: '#111827',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  qtyButtonText: {
    fontWeight: '700',
    fontSize: 18,
  },
  qtyValue: {
    minWidth: 24,
    textAlign: 'center',
    fontWeight: '700',
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  removeText: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  summary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
});
