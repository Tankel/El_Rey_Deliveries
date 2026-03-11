import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MX_STATES } from '@/data/mxStates';
import { useProfile } from '@/context/ProfileContext';
import {
  StructuredAddressInput,
  composeStructuredAddress,
  lookupPostalCodeContext,
  validateStructuredAddressInput,
  validateStructuredDeliveryAddress,
} from '@/services/maps/googleAddress';
import { PrimaryButton } from '@/ui/components/atoms/PrimaryButton';
import { useToast } from '@/ui/feedback/ToastContext';
import { useDebouncedValue } from '@/ui/hooks/useDebouncedValue';
import { colors, radius, spacing, typography } from '@/ui/theme/tokens';

type AddressForm = StructuredAddressInput;

const EMPTY_FORM: AddressForm = {
  street: '',
  exteriorNumber: '',
  interiorNumber: '',
  neighborhood: '',
  city: '',
  state: '',
  postalCode: '',
  references: '',
};

export default function CheckoutAddressScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { showToast } = useToast();
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingPostalCode, setIsResolvingPostalCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Completa tu domicilio para continuar al pago.');
  const debouncedPostalCode = useDebouncedValue(form.postalCode);
  const lastPostalCodeLookup = useRef('');

  useEffect(() => {
    if (!profile?.billingAddress) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      references: prev.references || profile.billingAddress,
    }));
  }, [profile?.billingAddress]);

  useEffect(() => {
    const postalCode = debouncedPostalCode.replace(/\D/g, '').slice(0, 5);
    if (postalCode.length !== 5) {
      return;
    }
    if (postalCode === lastPostalCodeLookup.current) {
      return;
    }

    let isCancelled = false;
    setIsResolvingPostalCode(true);
    void lookupPostalCodeContext(postalCode)
      .then((result) => {
        if (isCancelled) {
          return;
        }
        if (result.ok) {
          setForm((prev) => ({
            ...prev,
            state: prev.state.trim() ? prev.state : result.state ?? prev.state,
            city: prev.city.trim() ? prev.city : result.city ?? prev.city,
          }));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsResolvingPostalCode(false);
          lastPostalCodeLookup.current = postalCode;
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedPostalCode]);

  const localValidation = useMemo(() => validateStructuredAddressInput(form), [form]);
  const composedAddress = useMemo(() => composeStructuredAddress(form), [form]);

  const stateSuggestions = useMemo(() => {
    const query = form.state.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return MX_STATES.filter((state) => state.toLowerCase().includes(query)).slice(0, 6);
  }, [form.state]);
  const displayStatusMessage = localValidation.ok ? statusMessage : localValidation.message;

  const setField = <K extends keyof AddressForm>(field: K, value: AddressForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const continueToPayment = async () => {
    const basic = validateStructuredAddressInput(form);
    if (!basic.ok) {
      setStatusMessage(basic.message);
      showToast({ message: basic.message, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    const result = await validateStructuredDeliveryAddress(form);
    setIsSubmitting(false);
    setStatusMessage(result.message);

    if (!result.ok || !result.location) {
      showToast({ message: result.message, type: 'error' });
      return;
    }

    showToast({ message: result.message, type: 'success' });

    router.push({
      pathname: '/(client)/payment',
      params: {
        address: result.location.formattedAddress,
        lat: String(result.location.lat),
        lng: String(result.location.lng),
        validatedBy: result.location.validatedBy,
        placeId: result.location.placeId ?? '',
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Domicilio de entrega</Text>
      <Text style={styles.subtitle}>Completa los datos como en cualquier tienda y validamos automaticamente al continuar.</Text>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Calle</Text>
        <TextInput
          value={form.street}
          onChangeText={(value) => setField('street', value)}
          placeholder="Ej. Av. Reforma"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.flexField}>
            <Text style={styles.fieldLabel}>Numero exterior</Text>
            <TextInput
              value={form.exteriorNumber}
              onChangeText={(value) => setField('exteriorNumber', value)}
              placeholder="Ej. 145"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>
          <View style={styles.flexField}>
            <Text style={styles.fieldLabel}>Numero interior (opcional)</Text>
            <TextInput
              value={form.interiorNumber}
              onChangeText={(value) => setField('interiorNumber', value)}
              placeholder="Ej. 3B"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Colonia</Text>
        <TextInput
          value={form.neighborhood}
          onChangeText={(value) => setField('neighborhood', value)}
          placeholder="Ej. Juarez"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.flexField}>
            <Text style={styles.fieldLabel}>Codigo postal</Text>
            <TextInput
              value={form.postalCode}
              onChangeText={(value) => setField('postalCode', value.replace(/\D/g, '').slice(0, 5))}
              placeholder="Ej. 06600"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              keyboardType="number-pad"
            />
            {isResolvingPostalCode ? <Text style={styles.helperText}>Buscando estado/ciudad por CP...</Text> : null}
          </View>
          <View style={styles.flexField}>
            <Text style={styles.fieldLabel}>Ciudad / Municipio</Text>
            <TextInput
              value={form.city}
              onChangeText={(value) => setField('city', value)}
              placeholder="Ej. Cuauhtemoc"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Estado</Text>
        <TextInput
          value={form.state}
          onChangeText={(value) => setField('state', value)}
          placeholder="Ej. Ciudad de Mexico"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        {stateSuggestions.length > 0 && !stateSuggestions.includes(form.state as (typeof MX_STATES)[number]) ? (
          <View style={styles.suggestionWrap}>
            {stateSuggestions.map((state) => (
              <Pressable key={state} style={styles.suggestionChip} onPress={() => setField('state', state)}>
                <Text style={styles.suggestionText}>{state}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>Referencias (opcional)</Text>
        <TextInput
          value={form.references}
          onChangeText={(value) => setField('references', value)}
          placeholder="Ej. Entre calle A y B, porton negro"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.textArea]}
          multiline
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Vista previa</Text>
        <Text style={styles.previewText}>{composedAddress}</Text>
        <Text style={[styles.statusText, localValidation.ok ? styles.statusOk : styles.statusWarn]}>{displayStatusMessage}</Text>
      </View>

      <PrimaryButton
        label="Continuar a pago"
        loading={isSubmitting}
        loadingLabel="Validando domicilio..."
        onPress={continueToPayment}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textMuted,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  flexField: {
    flex: 1,
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: typography.caption,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 9,
    minHeight: 42,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  suggestionText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  previewText: {
    color: colors.textPrimary,
    lineHeight: 19,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusOk: {
    color: colors.success,
  },
  statusWarn: {
    color: colors.warning,
  },
});
