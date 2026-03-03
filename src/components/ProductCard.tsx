import { useRouter } from 'expo-router';
import { GestureResponderEvent, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCart } from '@/context/CartContext';
import { Product, formatProductPresentation } from '@/models/Product';
import { useToast } from '@/ui/feedback/ToastContext';

type Props = {
  product: Product;
};

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export function ProductCard({ product }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const handleAdd = (event: GestureResponderEvent) => {
    event.stopPropagation();
    const result = addItem(product, 1);
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
  };

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/(client)/products/${product.id}`)}>
      <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.presentation}>{formatProductPresentation(product)}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          <Text style={styles.originalPrice}>{formatCurrency(product.originalPrice)}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{product.discountPercent}%</Text>
          </View>
        </View>
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Agregar</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 12,
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  presentation: {
    color: '#4b5563',
    fontSize: 13,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  badge: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
