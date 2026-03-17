import { StructuredAddressInput } from '@/services/maps/googleAddress';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_PLACE_AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const GOOGLE_PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

export type AddressSuggestion = {
  placeId: string;
  description: string;
  primaryText: string;
  secondaryText: string;
};

export type AddressSuggestionDetails = {
  placeId: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  parsed: Partial<StructuredAddressInput>;
};

type AutocompleteResponse = {
  status: string;
  error_message?: string;
  predictions: Array<{
    description: string;
    place_id: string;
    structured_formatting?: {
      main_text?: string;
      secondary_text?: string;
    };
  }>;
};

type PlaceAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type PlaceDetailsResponse = {
  status: string;
  error_message?: string;
  result?: {
    place_id: string;
    formatted_address: string;
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
    address_components?: PlaceAddressComponent[];
  };
};

function getAddressComponent(components: PlaceAddressComponent[] | undefined, type: string) {
  return components?.find((component) => component.types.includes(type))?.long_name;
}

export function canUseGooglePlaces() {
  return Boolean(GOOGLE_MAPS_API_KEY);
}

export async function searchAddressSuggestions(queryRaw: string): Promise<AddressSuggestion[]> {
  const query = queryRaw.trim();
  if (!GOOGLE_MAPS_API_KEY || query.length < 4) {
    return [];
  }

  const params = new URLSearchParams({
    input: query,
    types: 'address',
    components: 'country:mx',
    language: 'es',
    key: GOOGLE_MAPS_API_KEY,
  });

  const response = await fetch(`${GOOGLE_PLACE_AUTOCOMPLETE_URL}?${params.toString()}`);
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as AutocompleteResponse;
  if (payload.status !== 'OK') {
    return [];
  }

  return payload.predictions.slice(0, 6).map((item) => ({
    placeId: item.place_id,
    description: item.description,
    primaryText: item.structured_formatting?.main_text ?? item.description,
    secondaryText: item.structured_formatting?.secondary_text ?? '',
  }));
}

export async function getAddressSuggestionDetails(placeId: string): Promise<AddressSuggestionDetails | null> {
  if (!GOOGLE_MAPS_API_KEY || !placeId.trim()) {
    return null;
  }

  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'place_id,formatted_address,address_component,geometry/location',
    language: 'es',
    key: GOOGLE_MAPS_API_KEY,
  });
  const response = await fetch(`${GOOGLE_PLACE_DETAILS_URL}?${params.toString()}`);
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json()) as PlaceDetailsResponse;
  if (payload.status !== 'OK' || !payload.result?.geometry?.location) {
    return null;
  }

  const components = payload.result.address_components;
  const parsed: Partial<StructuredAddressInput> = {
    street: getAddressComponent(components, 'route') ?? '',
    exteriorNumber: getAddressComponent(components, 'street_number') ?? '',
    interiorNumber: getAddressComponent(components, 'subpremise') ?? '',
    neighborhood:
      getAddressComponent(components, 'neighborhood') ??
      getAddressComponent(components, 'sublocality_level_1') ??
      '',
    city:
      getAddressComponent(components, 'locality') ??
      getAddressComponent(components, 'administrative_area_level_2') ??
      '',
    state: getAddressComponent(components, 'administrative_area_level_1') ?? '',
    postalCode: getAddressComponent(components, 'postal_code') ?? '',
  };

  return {
    placeId: payload.result.place_id,
    formattedAddress: payload.result.formatted_address,
    lat: payload.result.geometry.location.lat,
    lng: payload.result.geometry.location.lng,
    parsed,
  };
}
