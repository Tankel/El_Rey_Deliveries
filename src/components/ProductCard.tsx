import { memo } from 'react';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Product, formatProductPresentation } from '@/models/Product';

type Props = {
  product: Product;
  onAdd: (product: Product) => void;
};

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function ProductCardComponent({ product, onAdd }: Props) {
  const router = useRouter();
  const hasStock = product.stock !== undefined;
  const stock = product.stock ?? 0;
  const outOfStock = hasStock && stock <= 0;
  const lowStock = hasStock && stock > 0 && stock <= 5;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/(client)/home/products/${product.id}`)}
    >
      <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
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
  stockOutText: {
    color: '#991b1b',
    fontWeight: '700',
    fontSize: 12,
  },
  stockLowText: {
    color: '#9a3412',
    fontWeight: '700',
    fontSize: 12,
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
  addButtonPressed: {
    backgroundColor: '#1f2937',
    transform: [{ scale: 0.98 }],
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
