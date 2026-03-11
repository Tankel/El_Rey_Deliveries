import { AddressValidationProvider, DeliveryLocation } from '@/types/domain';

type ValidationResult = {
  ok: boolean;
  message: string;
  location?: DeliveryLocation;
};

export type StructuredAddressInput = {
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  references?: string;
};

type PostalCodeContextResult = {
  ok: boolean;
  message: string;
  state?: string;
  city?: string;
};

type GeocodeGoogleResponse = {
  status: string;
  error_message?: string;
  results: Array<{
    formatted_address: string;
    place_id: string;
    partial_match?: boolean;
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type?: string;
    };
  }>;
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

function hasBasicAddressShape(address: string) {
  return address.length >= 12 && /\d/.test(address);
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function trimOrEmpty(value: string | undefined) {
  return value?.trim() ?? '';
}

function normalizePostalCode(postalCodeRaw: string) {
  return postalCodeRaw.replace(/\D/g, '').slice(0, 5);
}

function getAddressComponent(
  components: GeocodeGoogleResponse['results'][number]['address_components'],
  type: string,
) {
  return components?.find((component) => component.types.includes(type))?.long_name;
}

export function composeStructuredAddress(input: StructuredAddressInput) {
  const parts = [
    `${trimOrEmpty(input.street)} ${trimOrEmpty(input.exteriorNumber)}${trimOrEmpty(input.interiorNumber) ? ` Int ${trimOrEmpty(input.interiorNumber)}` : ''}`.trim(),
    trimOrEmpty(input.neighborhood),
    trimOrEmpty(input.city),
    trimOrEmpty(input.state),
    `CP ${normalizePostalCode(input.postalCode)}`,
    'Mexico',
  ];
  const references = trimOrEmpty(input.references);
  if (references) {
    parts.splice(1, 0, references);
  }
  return parts.filter(Boolean).join(', ');
}

export function validateStructuredAddressInput(input: StructuredAddressInput): ValidationResult {
  if (trimOrEmpty(input.street).length < 3) {
    return { ok: false, message: 'Captura una calle valida.' };
  }
  if (trimOrEmpty(input.exteriorNumber).length < 1) {
    return { ok: false, message: 'El numero exterior es obligatorio.' };
  }
  if (trimOrEmpty(input.neighborhood).length < 3) {
    return { ok: false, message: 'La colonia es obligatoria.' };
  }
  if (trimOrEmpty(input.city).length < 2) {
    return { ok: false, message: 'Captura municipio o ciudad.' };
  }
  if (trimOrEmpty(input.state).length < 3) {
    return { ok: false, message: 'Captura estado.' };
  }
  const postalCode = normalizePostalCode(input.postalCode);
  if (!/^\d{5}$/.test(postalCode)) {
    return { ok: false, message: 'El codigo postal debe tener 5 digitos.' };
  }
  return { ok: true, message: 'Datos de direccion completos.' };
}

function buildLocation(
  provider: AddressValidationProvider,
  formattedAddress: string,
  lat: number,
  lng: number,
  placeId?: string,
): DeliveryLocation {
  return {
    formattedAddress,
    lat,
    lng,
    placeId,
    validatedBy: provider,
    validatedAt: new Date().toISOString(),
  };
}

async function geocodeAddress(address: string): Promise<GeocodeGoogleResponse | null> {
  const params = new URLSearchParams({
    address,
    language: 'es',
    region: 'mx',
    key: GOOGLE_MAPS_API_KEY ?? '',
  });
  const response = await fetch(`${GOOGLE_GEOCODE_URL}?${params.toString()}`);
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as GeocodeGoogleResponse;
}

export async function validateDeliveryAddress(addressRaw: string): Promise<ValidationResult> {
  const address = addressRaw.trim();
  if (!hasBasicAddressShape(address)) {
    return {
      ok: false,
      message: 'Captura una direccion completa con calle y numero.',
    };
  }

  if (!GOOGLE_MAPS_API_KEY) {
    // Fallback local-first: permite flujo sin backend/key pero marca validacion manual.
    return {
      ok: true,
      message: 'Validacion manual aplicada. Configura EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para validacion real.',
      location: buildLocation('MANUAL', address, 19.4326, -99.1332),
    };
  }

  try {
    const payload = await geocodeAddress(address);
    if (!payload) {
      return {
        ok: false,
        message: 'No se pudo validar el domicilio en este momento.',
      };
    }
    if (payload.status !== 'OK' || !payload.results.length) {
      return {
        ok: false,
        message: payload.error_message || 'No se encontro un domicilio valido.',
      };
    }

    const first = payload.results[0];
    if (!first?.geometry?.location) {
      return {
        ok: false,
        message: 'No fue posible obtener coordenadas del domicilio.',
      };
    }

    if (first.partial_match) {
      return {
        ok: false,
        message: 'La direccion coincide parcialmente. Agrega mas detalle (colonia, numero, CP).',
      };
    }

    return {
      ok: true,
      message: 'Domicilio validado con Google Maps.',
      location: buildLocation(
        'GOOGLE',
        first.formatted_address,
        first.geometry.location.lat,
        first.geometry.location.lng,
        first.place_id,
      ),
    };
  } catch (error) {
    return {
      ok: false,
      message: `Error validando domicilio: ${String(error)}`,
    };
  }
}

export async function lookupPostalCodeContext(postalCodeRaw: string): Promise<PostalCodeContextResult> {
  const postalCode = normalizePostalCode(postalCodeRaw);
  if (!/^\d{5}$/.test(postalCode)) {
    return { ok: false, message: 'CP invalido.' };
  }
  if (!GOOGLE_MAPS_API_KEY) {
    return { ok: false, message: 'Google Maps API key no configurada.' };
  }

  try {
    const payload = await geocodeAddress(postalCode);
    if (!payload || payload.status !== 'OK' || !payload.results.length) {
      return { ok: false, message: 'No se encontro informacion para ese CP.' };
    }
    const components = payload.results[0]?.address_components;
    const state = getAddressComponent(components, 'administrative_area_level_1');
    const city =
      getAddressComponent(components, 'locality') ||
      getAddressComponent(components, 'administrative_area_level_2') ||
      getAddressComponent(components, 'sublocality');
    if (!state && !city) {
      return { ok: false, message: 'No fue posible obtener estado/ciudad para ese CP.' };
    }
    return {
      ok: true,
      message: 'Contexto de CP encontrado.',
      state: state ?? undefined,
      city: city ?? undefined,
    };
  } catch (error) {
    return { ok: false, message: `Error consultando CP: ${String(error)}` };
  }
}

export async function validateStructuredDeliveryAddress(
  input: StructuredAddressInput,
): Promise<ValidationResult> {
  const basicValidation = validateStructuredAddressInput(input);
  if (!basicValidation.ok) {
    return basicValidation;
  }

  const composedAddress = composeStructuredAddress(input);
  const result = await validateDeliveryAddress(composedAddress);
  if (!result.ok || !result.location) {
    return result;
  }

  if (result.location.validatedBy === 'MANUAL') {
    return {
      ...result,
      location: {
        ...result.location,
        formattedAddress: composedAddress,
      },
    };
  }

  // Validaciones cruzadas para evitar direccion ambigua.
  const payload = await geocodeAddress(composedAddress);
  const first = payload?.results?.[0];
  const components = first?.address_components;
  const geoPostalCode = getAddressComponent(components, 'postal_code');
  const geoState = getAddressComponent(components, 'administrative_area_level_1');
  const geoCity =
    getAddressComponent(components, 'locality') ||
    getAddressComponent(components, 'administrative_area_level_2');

  const requestedPostalCode = normalizePostalCode(input.postalCode);
  if (geoPostalCode && normalizePostalCode(geoPostalCode) !== requestedPostalCode) {
    return {
      ok: false,
      message: 'El CP no coincide con la direccion encontrada. Verifica los datos.',
    };
  }
  if (geoState && normalizeText(geoState) !== normalizeText(input.state)) {
    return {
      ok: false,
      message: 'El estado no coincide con la ubicacion encontrada.',
    };
  }
  if (geoCity && !normalizeText(geoCity).includes(normalizeText(input.city))) {
    return {
      ok: false,
      message: 'La ciudad/municipio no coincide con la ubicacion encontrada.',
    };
  }

  return {
    ok: true,
    message: 'Domicilio validado correctamente.',
    location: {
      ...result.location,
      formattedAddress: composedAddress,
    },
  };
}
