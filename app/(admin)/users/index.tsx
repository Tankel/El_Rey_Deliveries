import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { AdminUser } from '@/models/AdminUser';
import { useUsers } from '@/context/UsersContext';
import { UserRole } from '@/types/domain';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';

type UserColumn = 'username' | 'fullName' | 'role' | 'email' | 'phone' | 'isActive';

const ALL_COLUMNS: Array<{ key: UserColumn; label: string }> = [
  { key: 'username', label: 'Usuario' },
  { key: 'fullName', label: 'Nombre' },
  { key: 'role', label: 'Rol' },
  { key: 'email', label: 'Correo' },
  { key: 'phone', label: 'Telefono' },
  { key: 'isActive', label: 'Activo' },
];

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
const PLACEHOLDER_COLOR = '#6b7280';

export default function AdminUsersScreen() {
  const { users, createUser, updateUser, deleteUser } = useUsers();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<UserColumn[]>([
    'username',
    'fullName',
    'role',
    'email',
  ]);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return users;
    }
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(normalized) ||
        user.fullName.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized),
    );
  }, [query, users]);

  const toggleColumn = (column: UserColumn) => {
    setVisibleColumns((prev) =>
      prev.includes(column) ? prev.filter((item) => item !== column) : [...prev, column],
    );
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const startEdit = (user: AdminUser) => {
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
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const save = () => {
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
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    if (result.ok) {
      closeForm();
    }
  };

  const remove = (userId: string) => {
    const result = deleteUser(userId);
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    if (editingId === userId) {
      closeForm();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Usuarios</Text>
        <Pressable style={styles.addButton} onPress={openCreateForm}>
          <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
          <Text style={styles.addButtonText}>Agregar usuario</Text>
        </Pressable>
      </View>

      {isFormOpen ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{editingId ? 'Editar usuario' : 'Agregar usuario'}</Text>
          <Text style={styles.fieldLabel}>Username</Text>
          <TextInput
            value={form.username}
            onChangeText={(value) => setForm((prev) => ({ ...prev, username: value }))}
            placeholder="Username"
            autoCapitalize="none"
            placeholderTextColor={PLACEHOLDER_COLOR}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>
            {editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
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
          <Text style={styles.fieldLabel}>Nombre completo</Text>
          <TextInput
            value={form.fullName}
            onChangeText={(value) => setForm((prev) => ({ ...prev, fullName: value }))}
            placeholder="Nombre completo"
            placeholderTextColor={PLACEHOLDER_COLOR}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Correo</Text>
          <TextInput
            value={form.email}
            onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
            placeholder="Correo"
            autoCapitalize="none"
            placeholderTextColor={PLACEHOLDER_COLOR}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Telefono</Text>
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
            <Text>Activo</Text>
            <Switch
              value={form.isActive}
              onValueChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))}
            />
          </View>

          <PrimaryButton label={editingId ? 'Guardar usuario' : 'Crear usuario'} onPress={save} />
          <PrimaryButton label="Cancelar" onPress={closeForm} />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tabla de usuarios</Text>
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Filtrar usuarios"
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
        {filteredUsers.map((item) => (
          <View key={item.id} style={styles.row}>
            {visibleColumns.includes('username') ? <Text style={styles.cell}>{item.username}</Text> : null}
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
              <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => remove(item.id)}>
                <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {filteredUsers.length === 0 ? <Text style={styles.emptyText}>No hay usuarios para ese filtro.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#f9fafb',
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
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
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
