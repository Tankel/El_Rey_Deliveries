import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCatalog } from '@/context/CatalogContext';
import { useCart } from '@/context/CartContext';
import { formatProductPresentation } from '@/models/Product';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function ProductDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { products, isHydrated } = useCatalog();
  const { addItem } = useCart();
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
        <ActivityIndicator size="large" color="#111827" />
        <Text>Cargando producto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerBox}>
        <Text>Producto no encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.metaText}>{product.brand}</Text>
      <Text style={styles.metaText}>{formatProductPresentation(product)}</Text>

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
          <Pressable style={styles.stepButton} onPress={() => setQuantity((prev) => prev + 1)}>
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
        label={`Agregar (${quantity})`}
        onPress={() => {
          const result = addItem(product, quantity);
          showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#f9fafb',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  metaText: {
    color: '#4b5563',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 16,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  discount: {
    color: '#047857',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontWeight: '700',
  },
  savings: {
    fontWeight: '600',
    color: '#111827',
  },
  qtyRow: {
    gap: 8,
  },
  qtyLabel: {
    fontWeight: '600',
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
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  stepText: {
    fontSize: 20,
    fontWeight: '700',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  infoBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 4,
  },
  infoTitle: {
    fontWeight: '700',
    color: '#111827',
  },
});
