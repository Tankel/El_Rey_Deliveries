import { useMemo, useState } from 'react';
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
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
};

const EMPTY_FORM: UserFormState = {
  username: '',
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

  const selectedUser = editingId ? users.find((user) => user.id === editingId) : null;

  const toggleColumn = (column: UserColumn) => {
    setVisibleColumns((prev) =>
      prev.includes(column) ? prev.filter((item) => item !== column) : [...prev, column],
    );
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setForm({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    });
  };

  const save = () => {
    const result = editingId
      ? updateUser(editingId, form)
      : createUser({
          ...form,
          username: form.username.trim().toLowerCase(),
        });
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    if (result.ok) {
      startCreate();
    }
  };

  const remove = (userId: string) => {
    const result = deleteUser(userId);
    showToast({ message: result.message, type: result.ok ? 'success' : 'error' });
    if (editingId === userId) {
      startCreate();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Usuarios</Text>

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
        {editingId ? <PrimaryButton label="Cancelar edicion" onPress={startCreate} /> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Columnas visibles</Text>
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
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tabla de usuarios</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Filtrar usuarios"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
        />
        {filteredUsers.map((item) => (
          <View key={item.id} style={styles.row}>
            {visibleColumns.includes('username') ? <Text style={styles.cell}>@{item.username}</Text> : null}
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

      {selectedUser ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Editando: {selectedUser.fullName}</Text>
          <Text style={styles.metaText}>ID: {selectedUser.id}</Text>
          <Text style={styles.metaText}>Creado: {new Date(selectedUser.createdAt).toLocaleString('es-MX')}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
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
  metaText: {
    color: '#4b5563',
  },
});
