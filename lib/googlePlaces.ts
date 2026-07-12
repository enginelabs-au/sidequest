import { DEV_PLACES_FALLBACK_ENABLED, getDevPlacesApiKey } from '@/constants/devPlacesFallback';
import type { PlaceLocation, PlaceSuggestion } from '@/lib/googlePlaces.types';
import {
    deriveGoogleActivity,
    type GoogleVenueSignal,
} from '@/lib/googleVenueSignals';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type { PlaceLocation, PlaceSuggestion } from '@/lib/googlePlaces.types';
export type { GoogleVenueSignal } from '@/lib/googleVenueSignals';

type VenueMatchInput = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

type RawGooglePlace = {
  id?: string;
  displayName?: { text?: string };
  userRatingCount?: number;
  rating?: number;
  priceLevel?: string;
  businessStatus?: string;
  currentOpeningHours?: { openNow?: boolean };
};

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
  error?: { message?: string };
};

type PlaceDetailsResponse = {
  location?: { latitude?: number; longitude?: number };
  displayName?: { text?: string };
  formattedAddress?: string;
  error?: { message?: string };
};

export function isGooglePlacesConfigured(): boolean {
  return DEV_PLACES_FALLBACK_ENABLED || isSupabaseConfigured;
}

export function usesDevPlacesFallback(): boolean {
  return DEV_PLACES_FALLBACK_ENABLED;
}

async function invokePlacesSearch<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('places-search', { body });

  if (error) {
    throw new Error(error.message ?? 'Places search request failed');
  }

  const payload = data as T & { error?: string };
  if (payload && typeof payload === 'object' && 'error' in payload && payload.error) {
    throw new Error(payload.error);
  }

  return payload;
}

async function fetchPlaceSuggestionsDirect(
  input: string,
  sessionToken?: string,
): Promise<PlaceSuggestion[]> {
  const key = getDevPlacesApiKey();
  if (!key) return [];

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
    },
    body: JSON.stringify({
      input: input.trim(),
      sessionToken,
      includedRegionCodes: ['au'],
    }),
  });

  const json = (await res.json()) as AutocompleteResponse;
  if (!res.ok) {
    throw new Error(json.error?.message ?? `Places Autocomplete failed (${res.status})`);
  }

  return (json.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p?.placeId)
    .map((p) => {
      const mainText = p.structuredFormat?.mainText?.text ?? p.text?.text ?? 'Place';
      const secondary = p.structuredFormat?.secondaryText?.text;
      const description = secondary ? `${mainText}, ${secondary}` : (p.text?.text ?? mainText);
      return { placeId: p.placeId!, description, mainText };
    });
}

async function fetchPlaceLocationDirect(placeId: string): Promise<PlaceLocation | null> {
  const key = getDevPlacesApiKey();
  if (!key) return null;

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'location,displayName,formattedAddress',
      },
    },
  );

  const json = (await res.json()) as PlaceDetailsResponse;
  if (!res.ok) {
    throw new Error(json.error?.message ?? `Place details failed (${res.status})`);
  }

  const lat = json.location?.latitude;
  const lng = json.location?.longitude;
  if (lat === undefined || lng === undefined) {
    throw new Error('Place details did not include coordinates');
  }

  return {
    latitude: lat,
    longitude: lng,
    label: json.displayName?.text ?? json.formattedAddress ?? 'Selected place',
  };
}

export async function fetchPlaceSuggestions(
  input: string,
  sessionToken?: string,
): Promise<PlaceSuggestion[]> {
  if (input.trim().length < 2) return [];

  if (DEV_PLACES_FALLBACK_ENABLED) {
    return fetchPlaceSuggestionsDirect(input, sessionToken);
  }

  if (!isSupabaseConfigured) return [];

  const result = await invokePlacesSearch<{ suggestions: PlaceSuggestion[] }>({
    action: 'autocomplete',
    input: input.trim(),
    sessionToken,
  });

  return result.suggestions ?? [];
}

export async function fetchPlaceLocation(placeId: string): Promise<PlaceLocation | null> {
  if (DEV_PLACES_FALLBACK_ENABLED) {
    return fetchPlaceLocationDirect(placeId);
  }

  if (!isSupabaseConfigured) return null;

  const result = await invokePlacesSearch<{ location: PlaceLocation }>({
    action: 'details',
    placeId,
  });

  return result.location ?? null;
}

function toVenueSignal(place: RawGooglePlace): GoogleVenueSignal | null {
  const placeId = place.id;
  if (!placeId) return null;

  const openNow = place.currentOpeningHours?.openNow ?? null;
  const userRatingCount = place.userRatingCount ?? null;
  const { level, label } = deriveGoogleActivity({ openNow, userRatingCount });

  return {
    placeId,
    openNow,
    businessStatus: place.businessStatus ?? null,
    userRatingCount,
    rating: place.rating ?? null,
    priceLevel: place.priceLevel ?? null,
    activityLevel: level,
    activityLabel: label,
  };
}

async function matchVenueDirect(venue: VenueMatchInput): Promise<GoogleVenueSignal | null> {
  const key = getDevPlacesApiKey();
  if (!key) return null;

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.userRatingCount,places.rating,places.priceLevel,places.businessStatus,places.currentOpeningHours',
    },
    body: JSON.stringify({
      textQuery: venue.name,
      maxResultCount: 1,
      locationBias: {
        circle: {
          center: { latitude: venue.latitude, longitude: venue.longitude },
          radius: 400,
        },
      },
      includedRegionCodes: ['au'],
    }),
  });

  const json = (await res.json()) as { places?: RawGooglePlace[]; error?: { message?: string } };
  if (!res.ok) {
    throw new Error(json.error?.message ?? `Places search failed (${res.status})`);
  }

  const place = json.places?.[0];
  return place ? toVenueSignal(place) : null;
}

export async function fetchGoogleVenueSignals(
  venues: VenueMatchInput[],
): Promise<Record<string, GoogleVenueSignal>> {
  if (!venues.length || !isGooglePlacesConfigured()) return {};

  const limited = venues.slice(0, 12);

  if (DEV_PLACES_FALLBACK_ENABLED) {
    const entries = await Promise.all(
      limited.map(async (venue) => {
        try {
          const signal = await matchVenueDirect(venue);
          return signal ? ([venue.id, signal] as const) : null;
        } catch {
          return null;
        }
      }),
    );
    return Object.fromEntries(entries.filter((e): e is [string, GoogleVenueSignal] => !!e));
  }

  if (!isSupabaseConfigured) return {};

  const result = await invokePlacesSearch<{ signals: Record<string, GoogleVenueSignal> }>({
    action: 'matchVenues',
    venues: limited,
  });

  return result.signals ?? {};
}
