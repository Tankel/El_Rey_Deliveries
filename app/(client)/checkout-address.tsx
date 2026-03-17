import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MX_STATES } from '@/data/mxStates';
import { useProfile } from '@/context/ProfileContext';
import {
  StructuredAddressInput,
  composeStructuredAddress,
  lookupPostalCodeContext,
  validateStructuredAddressInput,
  validateStructuredDeliveryAddress,
} from '@/services/maps/googleAddress';
import {
  AddressSuggestion,
  canUseGooglePlaces,
  getAddressSuggestionDetails,
  searchAddressSuggestions,
} from '@/services/maps/googlePlaces';
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
  const { profile, addSavedAddress, setDefaultSavedAddress } = useProfile();
  const { showToast } = useToast();
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingPostalCode, setIsResolvingPostalCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Completa tu domicilio para continuar al pago.');
  const debouncedPostalCode = useDebouncedValue(form.postalCode);
  const debouncedSearch = useDebouncedValue(searchQuery);
  const lastPostalCodeLookup = useRef('');
  const hasPrefilledDefault = useRef(false);

  useEffect(() => {
    if (!profile || hasPrefilledDefault.current) {
      return;
    }
    const defaultAddress = profile.savedAddresses.find((item) => item.isDefault) ?? profile.savedAddresses[0];
    if (defaultAddress) {
      setForm({
        street: defaultAddress.street,
        exteriorNumber: defaultAddress.exteriorNumber,
        interiorNumber: defaultAddress.interiorNumber ?? '',
        neighborhood: defaultAddress.neighborhood,
        city: defaultAddress.city,
        state: defaultAddress.state,
        postalCode: defaultAddress.postalCode,
        references: defaultAddress.references ?? '',
      });
      setSearchQuery(defaultAddress.formattedAddress);
      setStatusMessage('Usando tu direccion guardada predeterminada.');
      hasPrefilledDefault.current = true;
      return;
    }

    if (profile.billingAddress) {
      setForm((prev) => ({ ...prev, references: prev.references || profile.billingAddress }));
      hasPrefilledDefault.current = true;
    }
  }, [profile]);

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
        if (isCancelled || !result.ok) {
          return;
        }
        setForm((prev) => ({
          ...prev,
          state: prev.state.trim() ? prev.state : result.state ?? prev.state,
          city: prev.city.trim() ? prev.city : result.city ?? prev.city,
        }));
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

  useEffect(() => {
    if (!canUseGooglePlaces()) {
      setSuggestions([]);
      return;
    }
    const query = debouncedSearch.trim();
    if (query.length < 4) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setIsLoadingSuggestions(true);
    void searchAddressSuggestions(query)
      .then((result) => {
        if (!cancelled) {
          setSuggestions(result);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSuggestions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const localValidation = useMemo(() => validateStructuredAddressInput(form), [form]);
  const composedAddress = useMemo(() => composeStructuredAddress(form), [form]);
  const normalizedComposedAddress = useMemo(() => composedAddress.toLowerCase().trim(), [composedAddress]);

  const stateSuggestions = useMemo(() => {
    const query = form.state.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return MX_STATES.filter((state) => state.toLowerCase().includes(query)).slice(0, 6);
  }, [form.state]);

  const selectedSavedAddressId = useMemo(() => {
    if (!profile?.savedAddresses.length) {
      return null;
    }
    const match = profile.savedAddresses.find(
      (item) => item.formattedAddress.toLowerCase().trim() === normalizedComposedAddress,
    );
    return match?.id ?? null;
  }, [normalizedComposedAddress, profile?.savedAddresses]);

  const displayStatusMessage = localValidation.ok ? statusMessage : localValidation.message;

  const setField = <K extends keyof AddressForm>(field: K, value: AddressForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const applySavedAddress = (addressId: string) => {
    const target = profile?.savedAddresses.find((item) => item.id === addressId);
    if (!target) {
      return;
    }
    setForm({
      street: target.street,
      exteriorNumber: target.exteriorNumber,
      interiorNumber: target.interiorNumber ?? '',
      neighborhood: target.neighborhood,
      city: target.city,
      state: target.state,
      postalCode: target.postalCode,
      references: target.references ?? '',
    });
    setSearchQuery(target.formattedAddress);
    setSuggestions([]);
    setStatusMessage('Direccion guardada aplicada.');
    const result = setDefaultSavedAddress(addressId);
    if (!result.ok) {
      showToast({ message: result.message, type: 'error' });
    }
  };

  const applySuggestion = async (suggestion: AddressSuggestion) => {
    setIsLoadingSuggestions(true);
    const details = await getAddressSuggestionDetails(suggestion.placeId);
    setIsLoadingSuggestions(false);

    if (!details) {
      showToast({ message: 'No se pudo cargar esa direccion. Intenta otra opcion.', type: 'error' });
      return;
    }

    setForm((prev) => ({
      ...prev,
      street: details.parsed.street ?? prev.street,
      exteriorNumber: details.parsed.exteriorNumber ?? prev.exteriorNumber,
      interiorNumber: details.parsed.interiorNumber ?? prev.interiorNumber,
      neighborhood: details.parsed.neighborhood ?? prev.neighborhood,
      city: details.parsed.city ?? prev.city,
      state: details.parsed.state ?? prev.state,
      postalCode: details.parsed.postalCode ?? prev.postalCode,
    }));
    setSearchQuery(details.formattedAddress);
    setSuggestions([]);
    setStatusMessage('Direccion sugerida aplicada. Revisa y ajusta si falta algun dato.');
  };

  const proceedToPayment = (location: {
    formattedAddress: string;
    lat: number;
    lng: number;
    validatedBy: 'GOOGLE' | 'MANUAL';
    placeId?: string;
  }) => {
    router.push({
      pathname: '/(client)/payment',
      params: {
        address: location.formattedAddress,
        lat: String(location.lat),
        lng: String(location.lng),
        validatedBy: location.validatedBy,
        placeId: location.placeId ?? '',
      },
    });
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
    const location = result.location;

    showToast({ message: result.message, type: 'success' });

    const alreadySaved = profile?.savedAddresses.some(
      (item) =>
        (location.placeId && item.placeId === location.placeId) ||
        item.formattedAddress.toLowerCase().trim() === location.formattedAddress.toLowerCase().trim(),
    );

    if (!alreadySaved) {
      Alert.alert(
        'Guardar direccion',
        'Quieres guardar esta direccion para usarla despues?',
        [
          {
            text: 'No guardar',
            style: 'cancel',
            onPress: () => proceedToPayment(location),
          },
          {
            text: 'Guardar y continuar',
            onPress: () => {
              const saveResult = addSavedAddress({
                label: `${form.street} ${form.exteriorNumber}`.trim() || 'Direccion',
                formattedAddress: location.formattedAddress,
                street: form.street,
                exteriorNumber: form.exteriorNumber,
                interiorNumber: form.interiorNumber,
                neighborhood: form.neighborhood,
                city: form.city,
                state: form.state,
                postalCode: form.postalCode,
                references: form.references,
                lat: location.lat,
                lng: location.lng,
                placeId: location.placeId,
                validatedBy: location.validatedBy,
                isDefault: false,
              });
              if (!saveResult.ok) {
                showToast({ message: saveResult.message, type: 'error' });
              } else {
                showToast({ message: saveResult.message, type: 'success' });
              }
              proceedToPayment(location);
            },
          },
        ],
      );
      return;
    }

    proceedToPayment(location);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Domicilio de entrega</Text>
      <Text style={styles.subtitle}>Completa los datos como en cualquier tienda. Validamos automaticamente al continuar.</Text>

      {profile?.savedAddresses.length ? (
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Direcciones guardadas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedRow}>
            {profile.savedAddresses.map((item) => {
              const selected = item.id === selectedSavedAddressId;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => applySavedAddress(item.id)}
                  style={[styles.savedChip, selected && styles.savedChipSelected]}
                >
                  <Text style={[styles.savedChipTitle, selected && styles.savedChipTitleSelected]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={[styles.savedChipText, selected && styles.savedChipTextSelected]} numberOfLines={2}>
                    {item.formattedAddress}
                  </Text>
                  {item.isDefault ? <Text style={styles.defaultBadge}>Predeterminada</Text> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Buscar direccion (autocompletar)</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Ej. Av Reforma 145, CDMX"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        {canUseGooglePlaces() ? (
          <Text style={styles.helperText}>Escribe al menos 4 caracteres para ver sugerencias.</Text>
        ) : (
          <Text style={styles.helperText}>Configura EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para autocompletado.</Text>
        )}

        {isLoadingSuggestions ? <Text style={styles.helperText}>Buscando sugerencias...</Text> : null}
        {suggestions.length > 0 ? (
          <View style={styles.suggestionsBox}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.placeId}
                style={styles.suggestionItem}
                onPress={() => applySuggestion(suggestion)}
              >
                <Text style={styles.suggestionTitle}>{suggestion.primaryText}</Text>
                <Text style={styles.suggestionSubtitle}>{suggestion.secondaryText || suggestion.description}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

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
        <Text style={[styles.statusText, localValidation.ok ? styles.statusOk : styles.statusWarn]}>
          {displayStatusMessage}
        </Text>
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
  savedRow: {
    gap: 8,
    paddingRight: spacing.sm,
  },
  savedChip: {
    width: 210,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: 10,
    gap: 2,
  },
  savedChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoBg,
  },
  savedChipTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 12,
  },
  savedChipTitleSelected: {
    color: colors.info,
  },
  savedChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  savedChipTextSelected: {
    color: colors.textPrimary,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
    borderWidth: 1,
    borderColor: colors.successBorder,
    backgroundColor: colors.successBg,
    color: colors.success,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    fontSize: 10,
    fontWeight: '700',
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
  suggestionsBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  suggestionItem: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  suggestionTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  suggestionSubtitle: {
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
