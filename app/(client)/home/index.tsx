import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ProductCard } from '@/components/ProductCard';
import { useCatalog } from '@/context/CatalogContext';
import { useCart } from '@/context/CartContext';
import { getCategories } from '@/data/products';
import { es } from '@/i18n/es';
import { Product } from '@/models/Product';
import { useAuth } from '@/state/AuthContext';
import { SearchField } from '@/ui/components/atoms/SearchField';
import { useToast } from '@/ui/feedback/ToastContext';
import { useDebouncedValue } from '@/ui/hooks/useDebouncedValue';
import { appStyles } from '@/ui/theme/appStyles';
import { colors, spacing, typography } from '@/ui/theme/tokens';

export default function ClientHomeScreen() {
  const { user } = useAuth();
  const { products, isHydrated: isCatalogHydrated } = useCatalog();
  const { itemCount, isHydrated, getItemQuantity, addItem } = useCart();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | string>('Todos');
  const isLoading = !isCatalogHydrated;

  const categories = useMemo(() => ['Todos', ...getCategories(products)], [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    return products.filter((product) => {
      const byCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      const byName = !normalizedQuery || product.name.toLowerCase().includes(normalizedQuery);
      return byCategory && byName;
    });
  }, [debouncedQuery, products, selectedCategory]);

  const handleAddProduct = useCallback(
    (product: Product) => {
      const existingQuantity = getItemQuantity(product.id);

      const addAnother = () => {
        const result = addItem(product, 1);
        showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
      };

      if (existingQuantity > 0) {
        Alert.alert(
          'Producto ya en carrito',
          `Ya llevas ${existingQuantity} en el carrito. Quieres agregar otro?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Agregar otro', onPress: addAnother },
          ],
        );
        return;
      }

      addAnother();
    },
    [addItem, getItemQuantity, showToast],
  );

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} onAdd={handleAddProduct} />,
    [handleAddProduct],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{es.client.title}</Text>
        <Text style={styles.greeting}>
          {es.client.greeting}, {user?.username}
        </Text>
        <View style={styles.headerActions}>
          <Link href="/(client)/cart" style={styles.link}>
            {es.client.cart}: {isHydrated ? itemCount : 0}
          </Link>
          <Link href="/(client)/orders" style={styles.link}>
            {es.client.goToOrders}
          </Link>
        </View>
      </View>

      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={es.client.searchPlaceholder}
        style={styles.searchInput}
      />

      <ScrollView
        style={styles.categoryScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map((category) => {
          const isSelected = category === selectedCategory;
          return (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[appStyles.chip, styles.categoryChip, isSelected && appStyles.chipSelected]}
            >
              <Text style={[appStyles.chipText, styles.categoryText, isSelected && appStyles.chipTextSelected]}>
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={appStyles.mutedText}>{es.common.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={appStyles.emptyText}>{es.client.emptyProducts}</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  greeting: {
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 14,
  },
  link: {
    color: colors.link,
    fontWeight: '700',
  },
  searchInput: {
    minHeight: 42,
  },
  categoryRow: {
    gap: spacing.sm,
    paddingVertical: 4,
    paddingRight: spacing.sm,
    alignItems: 'center',
  },
  categoryScroll: {
    minHeight: 52,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 42,
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: typography.body,
  },
  listContent: {
    paddingBottom: spacing.sm,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
});

