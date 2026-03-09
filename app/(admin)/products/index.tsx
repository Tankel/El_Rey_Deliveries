import { useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCatalog } from '@/context/CatalogContext';
import { Product, ProductCategory, ProductUnit } from '@/models/Product';
import { useToast } from '@/ui/feedback/ToastContext';

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
const PLACEHOLDER_COLOR = '#6b7280';

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
  const [query, setQuery] = useState('');
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
  const scrollRef = useRef<ScrollView>(null);

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
    const normalized = query.trim().toLowerCase();
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
  }, [products, query]);

  const toggleColumn = (column: ProductColumn) => {
    setVisibleColumns((prev) =>
      prev.includes(column) ? prev.filter((item) => item !== column) : [...prev, column],
    );
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 0);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm(toForm(product));
    setIsFormOpen(true);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 0);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const save = () => {
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
  };

  const remove = (productId: string) => {
    const result = deleteProduct(productId);
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    if (editingId === productId) {
      closeForm();
    }
  };

  const createContainerOption = () => {
    const result = addContainerTypeOption(newContainerType);
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    if (result.ok) {
      const value = newContainerType.trim();
      setForm((prev) => ({ ...prev, containerType: value }));
      setNewContainerType('');
    }
  };

  const createPackagingOption = () => {
    const result = addPackagingOption(newPackaging);
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    if (result.ok) {
      const value = newPackaging.trim();
      setForm((prev) => ({ ...prev, packaging: value }));
      setNewPackaging('');
    }
  };

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Productos</Text>
        <Pressable style={styles.addButton} onPress={openCreateForm}>
          <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
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
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Filtrar productos"
            placeholderTextColor={PLACEHOLDER_COLOR}
            style={[styles.input, styles.searchInput]}
          />
          <Pressable
            style={styles.filterButton}
            onPress={() => setShowColumnFilters((prev) => !prev)}
          >
            <Ionicons name="options-outline" size={18} color="#0f172a" />
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
        {filteredProducts.map((item) => (
          <View key={item.id} style={styles.tableRow}>
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
              <Pressable style={styles.actionBtn} onPress={() => startEdit(item)}>
                <Text style={styles.actionText}>Editar</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => remove(item.id)}>
                <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {filteredProducts.length === 0 ? <Text style={styles.emptyText}>No hay productos para ese filtro.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    borderWidth: 1,
    borderColor: '#111827',
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  fieldLabel: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#9ca3af',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#f8fafc',
    color: '#111827',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formLabel: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
  },
  chipSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  chipText: {
    color: '#4b5563',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  flexInput: {
    flex: 1,
  },
  addOptionBtn: {
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
  },
  addOptionText: {
    color: '#111827',
    fontWeight: '700',
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  saveButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#111827',
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '700',
  },
  tableRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    gap: 4,
    marginTop: 8,
  },
  cell: {
    color: '#111827',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#f8fafc',
  },
  actionText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  deleteText: {
    color: '#991b1b',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
