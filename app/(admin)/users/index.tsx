import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useUsers } from '@/context/UsersContext';
import { AdminUser } from '@/models/AdminUser';
import { UserRole } from '@/types/domain';
import { SearchField } from '@/ui/components/atoms/SearchField';
import { useToast } from '@/ui/feedback/ToastContext';
import { useDebouncedValue } from '@/ui/hooks/useDebouncedValue';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

type UserColumn = 'username' | 'fullName' | 'role' | 'email' | 'phone' | 'isActive';

const ALL_COLUMNS: Array<{ key: UserColumn; label: string }> = [
  { key: 'username', label: 'Usuario' },
  { key: 'fullName', label: 'Nombre' },
  { key: 'role', label: 'Rol' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Telefono' },
  { key: 'isActive', label: 'Activo' },
];
const FIXED_COLUMNS: UserColumn[] = ['username'];
const FILTERABLE_COLUMNS = ALL_COLUMNS.filter((column) => !FIXED_COLUMNS.includes(column.key));

type UserFormState = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
};

const EMPTY_FORM: UserFormState = {
  username: '',
  password: '',
  fullName: '',
  email: '',
  phone: '',
  role: 'CLIENT',
  isActive: true,
};

const PLACEHOLDER_COLOR = colors.textMuted;

export default function AdminUsersScreen() {
  const { users, createUser, updateUser, deleteUser } = useUsers();
  const { showToast } = useToast();
  const listRef = useRef<FlatList<AdminUser>>(null);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [visibleColumns, setVisibleColumns] = useState<UserColumn[]>([
    'username',
    'fullName',
    'role',
    'email',
  ]);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);

  const filteredUsers = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();
    if (!normalized) {
      return users;
    }
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(normalized) ||
        user.fullName.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized),
    );
  }, [debouncedQuery, users]);

  const toggleColumn = useCallback((column: UserColumn) => {
    if (FIXED_COLUMNS.includes(column)) {
      return;
    }
    setVisibleColumns((prev) => {
      const normalized: UserColumn[] = prev.includes('username') ? prev : ['username', ...prev];
      if (normalized.includes(column)) {
        return normalized.filter((item) => item !== column) as UserColumn[];
      }
      return [...normalized, column] as UserColumn[];
    });
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
    (user: AdminUser) => {
      setEditingId(user.id);
      setForm({
        username: user.username,
        password: '',
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      });
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

  const save = useCallback(async () => {
    setIsSaving(true);
    const result = editingId
      ? updateUser(editingId, {
          ...form,
          username: form.username.trim().toLowerCase(),
          password: form.password.trim() || undefined,
        })
      : createUser({
          ...form,
          username: form.username.trim().toLowerCase(),
          password: form.password.trim(),
        });
    const resolved = await result;
    setIsSaving(false);
    showToast({ message: resolved.message, type: resolved.ok ? 'success' : 'error' });
    if (resolved.ok) {
      closeForm();
    }
  }, [closeForm, createUser, editingId, form, showToast, updateUser]);

  const remove = useCallback(
    (user: AdminUser) => {
      Alert.alert(
        'Eliminar usuario',
        `Se eliminara el usuario "${user.username}". Esta accion no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              const result = await deleteUser(user.id);
              showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
              if (editingId === user.id) {
                closeForm();
              }
            },
          },
        ],
      );
    },
    [closeForm, deleteUser, editingId, showToast],
  );

  const renderRow = useCallback(
    ({ item }: { item: AdminUser }) => (
      <View style={styles.row}>
        <Text style={styles.cell}>{item.username}</Text>
        {visibleColumns.includes('fullName') ? <Text style={styles.cell}>{item.fullName}</Text> : null}
        {visibleColumns.includes('role') ? <Text style={styles.cell}>{item.role}</Text> : null}
        {visibleColumns.includes('email') ? <Text style={styles.cell}>{item.email}</Text> : null}
        {visibleColumns.includes('phone') ? <Text style={styles.cell}>{item.phone}</Text> : null}
        {visibleColumns.includes('isActive') ? (
          <Text style={styles.cell}>{item.isActive ? 'Activo' : 'Inactivo'}</Text>
        ) : null}
        <View style={styles.rowActions}>
          <Pressable style={styles.actionBtn} onPress={() => startEdit(item)}>
            <Text style={styles.actionText}>Editar</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => remove(item)}>
            <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    ),
    [remove, startEdit, visibleColumns],
  );

  const header = useMemo(
    () => (
      <View style={styles.headerContent}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Usuarios</Text>
          <Pressable style={styles.addButton} onPress={openCreateForm}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primaryText} />
            <Text style={styles.addButtonText}>Agregar usuario</Text>
          </Pressable>
        </View>

        {isFormOpen ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{editingId ? 'Editar usuario' : 'Agregar usuario'}</Text>

            <Text style={styles.fieldLabel}>
              Username
              <Text style={styles.required}> *</Text>
            </Text>
            <TextInput
              value={form.username}
              onChangeText={(value) => setForm((prev) => ({ ...prev, username: value }))}
              placeholder="Username"
              autoCapitalize="none"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>
              {editingId ? 'Nueva contrasena (opcional)' : 'Contrasena'}
              {editingId ? null : <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
              value={form.password}
              onChangeText={(value) => setForm((prev) => ({ ...prev, password: value }))}
              placeholder={editingId ? 'Dejar vacio para conservar' : 'Minimo 6 caracteres'}
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>
              Nombre completo
              <Text style={styles.required}> *</Text>
            </Text>
            <TextInput
              value={form.fullName}
              onChangeText={(value) => setForm((prev) => ({ ...prev, fullName: value }))}
              placeholder="Nombre completo"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>
              Correo
              <Text style={styles.required}> *</Text>
            </Text>
            <TextInput
              value={form.email}
              onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
              placeholder="Correo"
              autoCapitalize="none"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>
              Telefono
              <Text style={styles.required}> *</Text>
            </Text>
            <TextInput
              value={form.phone}
              onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
              placeholder="Telefono"
              placeholderTextColor={PLACEHOLDER_COLOR}
              style={styles.input}
            />

            <View style={styles.roleRow}>
              {(['CLIENT', 'ADMIN', 'DRIVER'] as UserRole[]).map((role) => {
                const selected = role === form.role;
                return (
                  <Pressable
                    key={role}
                    onPress={() => setForm((prev) => ({ ...prev, role }))}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{role}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Activo</Text>
              <Switch
                value={form.isActive}
                onValueChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))}
              />
            </View>

            <View style={styles.formActions}>
              <Pressable style={styles.saveButton} onPress={() => void save()} disabled={isSaving}>
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Guardando...' : editingId ? 'Guardar usuario' : 'Crear usuario'}
                </Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={closeForm}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tabla de usuarios</Text>
          <View style={styles.searchRow}>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Filtrar usuarios"
              style={styles.searchInput}
            />
            <Pressable style={styles.filterButton} onPress={() => setShowColumnFilters((prev) => !prev)}>
              <Ionicons name="options-outline" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
          {showColumnFilters ? (
            <View style={styles.chipsWrap}>
              {FILTERABLE_COLUMNS.map((column) => {
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
      editingId,
      form.email,
      form.fullName,
      form.isActive,
      form.password,
      form.phone,
      form.role,
      form.username,
      isFormOpen,
      isSaving,
      openCreateForm,
      query,
      save,
      showColumnFilters,
      toggleColumn,
      visibleColumns,
    ],
  );

  return (
    <FlatList
      ref={listRef}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={filteredUsers}
      keyExtractor={(item) => item.id}
      renderItem={renderRow}
      ItemSeparatorComponent={() => <View style={styles.rowSpacer} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={styles.card}>
          <Text style={styles.emptyText}>No hay usuarios para ese filtro.</Text>
        </View>
      }
      keyboardShouldPersistTaps="handled"
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
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
  required: {
    color: colors.danger,
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
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchText: {
    color: colors.textPrimary,
    fontWeight: '600',
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
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.primaryText,
    fontWeight: '800',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  rowSpacer: {
    height: spacing.sm,
  },
  row: {
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
});
