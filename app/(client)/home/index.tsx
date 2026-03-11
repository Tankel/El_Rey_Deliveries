import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import { buildReorderSuggestions } from '@/services/insights/reorderSuggestions';
import { useAuth } from '@/state/AuthContext';
import { useOrders } from '@/state/OrdersContext';
import { SearchField } from '@/ui/components/atoms/SearchField';
import { useToast } from '@/ui/feedback/ToastContext';
import { useDebouncedValue } from '@/ui/hooks/useDebouncedValue';
import { appStyles } from '@/ui/theme/appStyles';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

export default function ClientHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { orders } = useOrders();
  const { products, isHydrated: isCatalogHydrated } = useCatalog();
  const { itemCount, isHydrated, getItemQuantity, addItem } = useCart();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | string>('Todos');
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);
  const isLoading = !isCatalogHydrated;
  const productsById = useMemo(() => new Map(products.map((item) => [item.id, item])), [products]);

  const categories = useMemo(() => ['Todos', ...getCategories(products)], [products]);
  const reorderSuggestions = useMemo(() => {
    if (!user) {
      return [];
    }
    return buildReorderSuggestions({
      products,
      orders,
      clientId: user.id,
      lookbackDays: 90,
      maxItems: 7,
    });
  }, [orders, products, user]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    return products.filter((product) => {
      const byCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      const byName = !normalizedQuery || product.name.toLowerCase().includes(normalizedQuery);
      return byCategory && byName;
    });
  }, [debouncedQuery, products, selectedCategory]);

  const addProductWithQuantity = useCallback(
    (product: Product, quantity: number) => {
      const normalizedQuantity = Math.max(1, Math.round(quantity));
      const existingQuantity = getItemQuantity(product.id);

      const addAnother = () => {
        const result = addItem(product, normalizedQuantity);
        showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
      };

      if (existingQuantity > 0) {
        Alert.alert(
          'Producto ya en carrito',
          `Ya llevas ${existingQuantity} en el carrito. Quieres agregar ${normalizedQuantity} mas?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Agregar', onPress: addAnother },
          ],
        );
        return;
      }

      addAnother();
    },
    [addItem, getItemQuantity, showToast],
  );

  const handleAddProduct = useCallback(
    (product: Product) => {
      addProductWithQuantity(product, 1);
    },
    [addProductWithQuantity],
  );

  const handleQuickReorder = useCallback(
    (productId: string, suggestedQuantity: number) => {
      const product = productsById.get(productId);
      if (!product) {
        showToast({ message: 'Producto no disponible.', type: 'error' });
        return;
      }
      addProductWithQuantity(product, suggestedQuantity);
    },
    [addProductWithQuantity, productsById, showToast],
  );

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => <ProductCard product={item} onAdd={handleAddProduct} />,
    [handleAddProduct],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.headerContent}>
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

        <View style={styles.searchRow}>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder={es.client.searchPlaceholder}
            style={[styles.searchInput, styles.searchInputFlex]}
          />
          <Pressable style={styles.filterButton} onPress={() => setShowCategoryFilters((prev) => !prev)}>
            <Ionicons name="options-outline" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>

        {showCategoryFilters ? (
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
        ) : null}

        {reorderSuggestions.length > 0 ? (
          <View style={styles.reorderSection}>
            <View style={styles.reorderHeader}>
              <Text style={styles.reorderTitle}>Volver a comprar</Text>
              <Text style={styles.reorderHint}>Basado en tus ultimos pedidos</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reorderRow}
            >
              {reorderSuggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.productId}
                  style={styles.reorderCard}
                  onPress={() => router.push(`/(client)/home/products/${suggestion.productId}`)}
                >
                  <Image source={{ uri: suggestion.image }} style={styles.reorderImage} resizeMode="cover" />
                  <Text style={styles.reorderCardTitle} numberOfLines={2}>
                    {suggestion.productName}
                  </Text>
                  <Text style={styles.reorderCardMeta}>
                    {suggestion.reason} - {suggestion.confidence}%
                  </Text>
                  <Text style={styles.reorderCardMeta}>Sugerido: {suggestion.suggestedQuantity}</Text>
                  <Pressable
                    style={styles.reorderAddButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      handleQuickReorder(suggestion.productId, suggestion.suggestedQuantity);
                    }}
                  >
                    <Text style={styles.reorderAddButtonText}>Reagregar</Text>
                  </Pressable>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    ),
    [
      categories,
      handleQuickReorder,
      isHydrated,
      itemCount,
      query,
      reorderSuggestions,
      router,
      selectedCategory,
      showCategoryFilters,
      user?.username,
    ],
  );

  return (
    <View style={styles.container}>
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
          ListHeaderComponent={listHeader}
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
  },
  headerContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    minHeight: 42,
  },
  searchInputFlex: {
    flex: 1,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
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
  reorderSection: {
    gap: spacing.sm,
  },
  reorderHeader: {
    gap: 2,
  },
  reorderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  reorderHint: {
    color: colors.textMuted,
    fontSize: typography.caption,
  },
  reorderRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  reorderCard: {
    width: 176,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    gap: 6,
  },
  reorderImage: {
    width: '100%',
    height: 92,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  reorderCardTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: typography.caption,
    minHeight: 32,
  },
  reorderCardMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  reorderAddButton: {
    marginTop: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderAddButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
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
