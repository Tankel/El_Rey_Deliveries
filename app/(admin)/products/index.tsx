import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCatalog } from '@/context/CatalogContext';
import { Product, ProductCategory, ProductUnit } from '@/models/Product';
import { SearchField } from '@/ui/components/atoms/SearchField';
import { useToast } from '@/ui/feedback/ToastContext';
import { useDebouncedValue } from '@/ui/hooks/useDebouncedValue';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

type ProductColumn = 'id' | 'name' | 'brand' | 'category' | 'price' | 'stock' | 'discountPercent';

const ALL_COLUMNS: Array<{ key: ProductColumn; label: string }> = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Nombre' },
  { key: 'brand', label: 'Marca' },
  { key: 'category', label: 'Categoria' },
  { key: 'price', label: 'Precio' },
  { key: 'stock', label: 'Stock' },
  { key: 'discountPercent', label: 'Descuento' },
];

const CATEGORIES: ProductCategory[] = ['Bebidas', 'Snacks', 'Abarrotes', 'Promociones'];
const UNITS: ProductUnit[] = ['ml', 'g', 'pz', 'l', 'kg'];
const PLACEHOLDER_COLOR = colors.textMuted;

type ProductFormState = {
  name: string;
  brand: string;
  image: string;
  price: string;
  originalPrice: string;
  unit: ProductUnit;
  sizeValue: string;
  quantityPerPack: string;
  containerType: string;
  packaging: string;
  seller: string;
  description: string;
  category: ProductCategory;
  stock: string;
};

const EMPTY_FORM: ProductFormState = {
  name: '',
  brand: '',
  image: '',
  price: '',
  originalPrice: '',
  unit: 'ml',
  sizeValue: '1',
  quantityPerPack: '1',
  containerType: '',
  packaging: '',
  seller: 'El Rey Distribuidora',
  description: '',
  category: 'Bebidas',
  stock: '0',
};

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function toForm(product: Product): ProductFormState {
  return {
    name: product.name,
    brand: product.brand,
    image: product.image,
    price: String(product.price),
    originalPrice: String(product.originalPrice),
    unit: product.unit,
    sizeValue: String(product.sizeValue),
    quantityPerPack: String(product.quantityPerPack),
    containerType: product.containerType,
    packaging: product.packaging,
    seller: product.seller,
    description: product.description,
    category: product.category,
    stock: String(product.stock ?? 0),
  };
}

function parseNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function AdminProductsScreen() {
  const {
    products,
    createProduct,
    updateProduct,
    deleteProduct,
    containerTypeOptions,
    packagingOptions,
    addContainerTypeOption,
    addPackagingOption,
  } = useCatalog();
  const { showToast } = useToast();
  const listRef = useRef<FlatList<Product>>(null);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [visibleColumns, setVisibleColumns] = useState<ProductColumn[]>([
    'name',
    'brand',
    'category',
    'price',
    'stock',
  ]);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [newContainerType, setNewContainerType] = useState('');
  const [newPackaging, setNewPackaging] = useState('');
  const [stockModalProductId, setStockModalProductId] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState('10');

  const containerOptions = useMemo(() => {
    const options = new Set(containerTypeOptions);
    if (form.containerType.trim()) {
      options.add(form.containerType.trim());
    }
    return Array.from(options);
  }, [containerTypeOptions, form.containerType]);

  const packagingSelectOptions = useMemo(() => {
    const options = new Set(packagingOptions);
    if (form.packaging.trim()) {
      options.add(form.packaging.trim());
    }
    return Array.from(options);
  }, [form.packaging, packagingOptions]);

  const filteredProducts = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    if (!normalized) {
      return products;
    }
    return products.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.brand.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized) ||
        item.id.toLowerCase().includes(normalized),
    );
  }, [debouncedQuery, products]);

  const toggleColumn = useCallback((column: ProductColumn) => {
    setVisibleColumns((prev) =>
      prev.includes(column) ? prev.filter((item) => item !== column) : [...prev, column],
    );
  }, []);

  const scrollToTop = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
    scrollToTop();
  }, [scrollToTop]);

  const startEdit = useCallback(
    (product: Product) => {
      setEditingId(product.id);
      setForm(toForm(product));
      setIsFormOpen(true);
      scrollToTop();
    },
    [scrollToTop],
  );

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }, []);

  const save = useCallback(() => {
    const payload = {
      ...form,
      price: parseNumber(form.price),
      originalPrice: parseNumber(form.originalPrice, parseNumber(form.price)),
      sizeValue: parseNumber(form.sizeValue, 1),
      quantityPerPack: parseNumber(form.quantityPerPack, 1),
      stock: parseNumber(form.stock, 0),
      containerType: form.containerType.trim(),
      packaging: form.packaging.trim(),
    };

    const result = editingId
      ? updateProduct(editingId, payload)
      : createProduct({
          ...payload,
          image: payload.image.trim() || 'https://dummyimage.com/800x600/e5e7eb/111827&text=Producto',
          containerType: payload.containerType || 'N/A',
          packaging: payload.packaging || 'N/A',
          seller: payload.seller || 'El Rey Distribuidora',
          description: payload.description || 'Producto agregado desde panel admin.',
        });

    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    if (result.ok) {
      closeForm();
    }
  }, [closeForm, createProduct, editingId, form, showToast, updateProduct]);

  const remove = useCallback(
    (product: Product) => {
      Alert.alert(
        'Eliminar producto',
        `Se eliminara "${product.name}". Esta accion no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: () => {
              const result = deleteProduct(product.id);
              showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
              if (editingId === product.id) {
                closeForm();
              }
            },
          },
        ],
      );
    },
    [closeForm, deleteProduct, editingId, showToast],
  );

  const createContainerOption = useCallback(() => {
    const result = addContainerTypeOption(newContainerType);
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    if (result.ok) {
      const value = newContainerType.trim();
      setForm((prev) => ({ ...prev, containerType: value }));
      setNewContainerType('');
    }
  }, [addContainerTypeOption, newContainerType, showToast]);

  const createPackagingOption = useCallback(() => {
    const result = addPackagingOption(newPackaging);
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    if (result.ok) {
      const value = newPackaging.trim();
      setForm((prev) => ({ ...prev, packaging: value }));
      setNewPackaging('');
    }
  }, [addPackagingOption, newPackaging, showToast]);

  const openStockModal = useCallback((productId: string) => {
    setStockModalProductId(productId);
    setStockInput('10');
  }, []);

  const closeStockModal = useCallback(() => {
    setStockModalProductId(null);
    setStockInput('10');
  }, []);

  const applyStockIncrement = useCallback(() => {
    if (!stockModalProductId) {
      return;
    }
    const toAdd = Math.floor(Number(stockInput));
    if (!Number.isFinite(toAdd) || toAdd <= 0) {
      showToast({ message: 'Ingresa una cantidad valida mayor a 0.', type: 'error' });
      return;
    }
    const product = products.find((item) => item.id === stockModalProductId);
    if (!product) {
      showToast({ message: 'Producto no encontrado.', type: 'error' });
      closeStockModal();
      return;
    }
    const nextStock = (product.stock ?? 0) + toAdd;
    const result = updateProduct(product.id, { stock: nextStock });
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    if (result.ok) {
      closeStockModal();
    }
  }, [closeStockModal, products, showToast, stockInput, stockModalProductId, updateProduct]);

  const renderRow = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.tableRow}>
        {visibleColumns.includes('id') ? <Text style={styles.cell}>{item.id}</Text> : null}
        {visibleColumns.includes('name') ? <Text style={styles.cell}>{item.name}</Text> : null}
        {visibleColumns.includes('brand') ? <Text style={styles.cell}>{item.brand}</Text> : null}
        {visibleColumns.includes('category') ? <Text style={styles.cell}>{item.category}</Text> : null}
        {visibleColumns.includes('price') ? <Text style={styles.cell}>{formatCurrency(item.price)}</Text> : null}
        {visibleColumns.includes('stock') ? <Text style={styles.cell}>Stock: {item.stock ?? 0}</Text> : null}
        {visibleColumns.includes('discountPercent') ? (
          <Text style={styles.cell}>-{item.discountPercent}%</Text>
        ) : null}
        <View style={styles.rowActions}>
          <Pressable style={styles.actionBtn} onPress={() => openStockModal(item.id)}>
            <Text style={styles.actionText}>Agregar stock</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => startEdit(item)}>
            <Text style={styles.actionText}>Editar</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => remove(item)}>
            <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    ),
    [openStockModal, remove, startEdit, visibleColumns],
  );

  const header = useMemo(
    () => (
      <View style={styles.headerContent}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Productos</Text>
          <Pressable style={styles.addButton} onPress={openCreateForm}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primaryText} />
            <Text style={styles.addButtonText}>Agregar producto</Text>
          </Pressable>
        </View>

        {isFormOpen ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{editingId ? 'Editar producto' : 'Agregar producto'}</Text>

            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              placeholder="Nombre"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Marca</Text>
            <TextInput
              value={form.brand}
              onChangeText={(value) => setForm((prev) => ({ ...prev, brand: value }))}
              placeholder="Marca"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>URL imagen</Text>
            <TextInput
              value={form.image}
              onChangeText={(value) => setForm((prev) => ({ ...prev, image: value }))}
              placeholder="https://..."
              autoCapitalize="none"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Precio / Precio original / Stock</Text>
            <View style={styles.row}>
              <TextInput
                value={form.price}
                onChangeText={(value) => setForm((prev) => ({ ...prev, price: value }))}
                placeholder="Precio"
                keyboardType="numeric"
                placeholderTextColor={PLACEHOLDER_COLOR}
                style={[styles.input, styles.flexInput]}
              />
              <TextInput
                value={form.originalPrice}
                onChangeText={(value) => setForm((prev) => ({ ...prev, originalPrice: value }))}
                placeholder="Precio original"
                keyboardType="numeric"
                placeholderTextColor={PLACEHOLDER_COLOR}
                style={[styles.input, styles.flexInput]}
              />
              <TextInput
                value={form.stock}
                onChangeText={(value) => setForm((prev) => ({ ...prev, stock: value }))}
                placeholder="Stock"
                keyboardType="numeric"
                placeholderTextColor={PLACEHOLDER_COLOR}
                style={[styles.input, styles.flexInput]}
              />
            </View>

            <Text style={styles.formLabel}>Categoria</Text>
            <View style={styles.chipsWrap}>
              {CATEGORIES.map((category) => {
                const selected = category === form.category;
                return (
                  <Pressable
                    key={category}
                    onPress={() => setForm((prev) => ({ ...prev, category }))}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{category}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.formLabel}>Unidad</Text>
            <View style={styles.chipsWrap}>
              {UNITS.map((unit) => {
                const selected = unit === form.unit;
                return (
                  <Pressable
                    key={unit}
                    onPress={() => setForm((prev) => ({ ...prev, unit }))}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{unit}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Piezas por pack / Tamano</Text>
            <View style={styles.row}>
              <TextInput
                value={form.quantityPerPack}
                onChangeText={(value) => setForm((prev) => ({ ...prev, quantityPerPack: value }))}
                placeholder="Piezas por pack"
                keyboardType="numeric"
                placeholderTextColor={PLACEHOLDER_COLOR}
                style={[styles.input, styles.flexInput]}
              />
              <TextInput
                value={form.sizeValue}
                onChangeText={(value) => setForm((prev) => ({ ...prev, sizeValue: value }))}
                placeholder="Tamano"
                keyboardType="numeric"
                placeholderTextColor={PLACEHOLDER_COLOR}
                style={[styles.input, styles.flexInput]}
              />
            </View>

            <Text style={styles.formLabel}>Tipo de contenedor</Text>
            <View style={styles.chipsWrap}>
              {containerOptions.map((option) => {
                const selected = option === form.containerType;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setForm((prev) => ({ ...prev, containerType: option }))}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.row}>
              <TextInput
                value={newContainerType}
                onChangeText={setNewContainerType}
                placeholder="Agregar tipo de contenedor"
                placeholderTextColor={PLACEHOLDER_COLOR}
                style={[styles.input, styles.flexInput]}
              />
              <Pressable style={styles.addOptionBtn} onPress={createContainerOption}>
                <Text style={styles.addOptionText}>Agregar</Text>
              </Pressable>
            </View>

            <Text style={styles.formLabel}>Empaque</Text>
            <View style={styles.chipsWrap}>
              {packagingSelectOptions.map((option) => {
                const selected = option === form.packaging;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setForm((prev) => ({ ...prev, packaging: option }))}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.row}>
              <TextInput
                value={newPackaging}
                onChangeText={setNewPackaging}
                placeholder="Agregar empaque"
                placeholderTextColor={PLACEHOLDER_COLOR}
                style={[styles.input, styles.flexInput]}
              />
              <Pressable style={styles.addOptionBtn} onPress={createPackagingOption}>
                <Text style={styles.addOptionText}>Agregar</Text>
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Vendedor</Text>
            <TextInput
              value={form.seller}
              onChangeText={(value) => setForm((prev) => ({ ...prev, seller: value }))}
              placeholder="Vendedor"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Descripcion</Text>
            <TextInput
              value={form.description}
              onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
              placeholder="Descripcion"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input}
            />

            <View style={styles.formActions}>
              <Pressable style={styles.saveButton} onPress={save}>
                <Text style={styles.saveButtonText}>{editingId ? 'Guardar producto' : 'Crear producto'}</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={closeForm}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tabla de productos</Text>
          <View style={styles.searchRow}>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Filtrar productos"
              style={styles.searchInput}
            />
            <Pressable style={styles.filterButton} onPress={() => setShowColumnFilters((prev) => !prev)}>
              <Ionicons name="options-outline" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
          {showColumnFilters ? (
            <View style={styles.chipsWrap}>
              {ALL_COLUMNS.map((column) => {
                const selected = visibleColumns.includes(column.key);
                return (
                  <Pressable
                    key={column.key}
                    onPress={() => toggleColumn(column.key)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{column.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
    ),
    [
      closeForm,
      createContainerOption,
      createPackagingOption,
      editingId,
      form.brand,
      form.category,
      form.containerType,
      form.description,
      form.image,
      form.originalPrice,
      form.packaging,
      form.price,
      form.quantityPerPack,
      form.seller,
      form.sizeValue,
      form.stock,
      form.unit,
      isFormOpen,
      newContainerType,
      newPackaging,
      openCreateForm,
      packagingSelectOptions,
      containerOptions,
      query,
      save,
      showColumnFilters,
      toggleColumn,
      visibleColumns,
    ],
  );

  return (
    <View style={styles.screen}>
      <FlatList
        ref={listRef}
        style={styles.container}
        contentContainerStyle={styles.listContent}
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        ItemSeparatorComponent={() => <View style={styles.rowSpacer} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.card}>
            <Text style={styles.emptyText}>No hay productos para ese filtro.</Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
      />

      <Modal visible={Boolean(stockModalProductId)} transparent animationType="fade" onRequestClose={closeStockModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar stock</Text>
            <Text style={styles.modalText}>Cuantas unidades deseas agregar?</Text>
            <TextInput
              value={stockInput}
              onChangeText={setStockInput}
              keyboardType="numeric"
              placeholder="Ej. 20"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalPrimaryButton} onPress={applyStockIncrement}>
                <Text style={styles.modalPrimaryText}>Guardar</Text>
              </Pressable>
              <Pressable style={styles.modalSecondaryButton} onPress={closeStockModal}>
                <Text style={styles.modalSecondaryText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerContent: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: typography.caption,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
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
  formLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: typography.caption,
    marginTop: 2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.primaryText,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  flexInput: {
    flex: 1,
  },
  addOptionBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
  },
  addOptionText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  saveButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.primaryText,
    fontWeight: '800',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  rowSpacer: {
    height: spacing.sm,
  },
  tableRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    backgroundColor: colors.surface,
  },
  cell: {
    color: colors.textPrimary,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 6,
  },
  actionBtn: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.surfaceMuted,
  },
  actionText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deleteBtn: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  deleteText: {
    color: colors.danger,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.subtitle,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalText: {
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalPrimaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  modalPrimaryText: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  modalSecondaryButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  modalSecondaryText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
});

