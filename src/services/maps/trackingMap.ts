import { DeliveryLocation } from '@/types/domain';

type GeoPoint = {
  lat: number;
  lng: number;
};

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export const DEFAULT_WAREHOUSE_ORIGIN: GeoPoint = {
  lat: 19.4326,
  lng: -99.1332,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function encodePoint(point: GeoPoint) {
  return `${point.lat},${point.lng}`;
}

export function buildSimulatedDriverPosition(
  destination: DeliveryLocation,
  progressPercent: number,
  origin: GeoPoint = DEFAULT_WAREHOUSE_ORIGIN,
): GeoPoint {
  const t = clamp(progressPercent / 100, 0, 1);
  return {
    lat: origin.lat + (destination.lat - origin.lat) * t,
    lng: origin.lng + (destination.lng - origin.lng) * t,
  };
}

export function buildGoogleStaticTrackingMapUrl(
  destination: DeliveryLocation,
  progressPercent: number,
  origin: GeoPoint = DEFAULT_WAREHOUSE_ORIGIN,
) {
  if (!GOOGLE_MAPS_API_KEY) {
    return null;
  }
  const driver = buildSimulatedDriverPosition(destination, progressPercent, origin);
  const path = `color:0x1d4ed8|weight:5|${encodePoint(origin)}|${encodePoint(destination)}`;

  const params = new URLSearchParams({
    size: '900x420',
    maptype: 'roadmap',
    path,
    markers: `color:green|label:D|${encodePoint(driver)}`,
    key: GOOGLE_MAPS_API_KEY,
  });

  params.append('markers', `color:red|label:E|${encodePoint(destination)}`);
  params.append('markers', `color:blue|label:O|${encodePoint(origin)}`);

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export function buildGoogleDirectionsUrl(destination: DeliveryLocation) {
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
}
