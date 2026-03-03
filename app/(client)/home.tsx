import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ProductCard } from '@/components/ProductCard';
import { useCart } from '@/context/CartContext';
import { getCategories, listLocalProducts } from '@/data/products';
import { es } from '@/i18n/es';
import { useAuth } from '@/state/AuthContext';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';

export default function ClientHomeScreen() {
  const { user, signOut } = useAuth();
  const { itemCount, isHydrated } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | string>('Todos');
  const [products, setProducts] = useState<Awaited<ReturnType<typeof listLocalProducts>>>([]);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoading(true);
      const localProducts = await listLocalProducts();
      if (isMounted) {
        setProducts(localProducts);
        setIsLoading(false);
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => ['Todos', ...getCategories(products)], [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const byCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      const byName = !normalizedQuery || product.name.toLowerCase().includes(normalizedQuery);
      return byCategory && byName;
    });
  }, [products, query, selectedCategory]);

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

      <TextInput
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
              style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
            >
              <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>{category}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#111827" />
          <Text>{es.common.loading}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text>{es.client.emptyProducts}</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          windowSize={7}
          removeClippedSubviews
        />
      )}

      <PrimaryButton label={es.common.logout} onPress={signOut} />
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
  header: {
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  greeting: {
    color: '#4b5563',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 14,
  },
  link: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryRow: {
    gap: 8,
    paddingVertical: 4,
    paddingRight: 8,
    alignItems: 'center',
  },
  categoryScroll: {
    minHeight: 52,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 42,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  categoryChipSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  categoryTextSelected: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 8,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
});
