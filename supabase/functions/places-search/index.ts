import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type AutocompleteBody = {
  action: 'autocomplete';
  input: string;
  sessionToken?: string;
};

type DetailsBody = {
  action: 'details';
  placeId: string;
};

type MatchVenuesBody = {
  action: 'matchVenues';
  venues: Array<{ id: string; name: string; latitude: number; longitude: number }>;
};

type RequestBody = AutocompleteBody | DetailsBody | MatchVenuesBody;

type GoogleVenueSignal = {
  placeId: string;
  openNow: boolean | null;
  businessStatus: string | null;
  userRatingCount: number | null;
  rating: number | null;
  priceLevel: string | null;
  activityLevel: string;
  activityLabel: string;
};

type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
};

type PlaceLocation = {
  latitude: number;
  longitude: number;
  label: string;
};

function getPlacesApiKey(): string {
  const key = Deno.env.get('GOOGLE_MAPS_PLACES_API_KEY')?.trim();
  if (!key) {
    throw new Error('GOOGLE_MAPS_PLACES_API_KEY is not configured on Supabase');
  }
  return key;
}

async function autocomplete(
  input: string,
  sessionToken?: string,
): Promise<PlaceSuggestion[]> {
  const key = getPlacesApiKey();
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

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Places Autocomplete failed (${res.status})`);
  }

  return (json.suggestions ?? [])
    .map((s: { placePrediction?: Record<string, unknown> }) => s.placePrediction)
    .filter((p: { placeId?: string } | undefined): p is NonNullable<typeof p> => !!p?.placeId)
    .map((p: {
      placeId: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    }) => {
      const mainText = p.structuredFormat?.mainText?.text ?? p.text?.text ?? 'Place';
      const secondary = p.structuredFormat?.secondaryText?.text;
      const description = secondary ? `${mainText}, ${secondary}` : (p.text?.text ?? mainText);
      return { placeId: p.placeId, description, mainText };
    });
}

async function placeDetails(placeId: string): Promise<PlaceLocation> {
  const key = getPlacesApiKey();
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'location,displayName,formattedAddress',
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Place details failed (${res.status})`);
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

function deriveActivity(openNow: boolean | null | undefined, userRatingCount: number | null | undefined) {
  if (openNow === false) return { activityLevel: 'closed', activityLabel: 'Closed on Google' };
  const reviews = userRatingCount ?? 0;
  if (reviews >= 3000) return { activityLevel: 'very_popular', activityLabel: 'Very popular' };
  if (reviews >= 1000) return { activityLevel: 'popular', activityLabel: 'Popular' };
  if (reviews >= 300) return { activityLevel: 'moderate', activityLabel: 'Moderate' };
  return { activityLevel: 'quiet', activityLabel: 'Quieter' };
}

async function matchVenue(
  venue: { id: string; name: string; latitude: number; longitude: number },
): Promise<GoogleVenueSignal | null> {
  const key = getPlacesApiKey();
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

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Places search failed (${res.status})`);
  }

  const place = json.places?.[0];
  if (!place?.id) return null;

  const openNow = place.currentOpeningHours?.openNow ?? null;
  const { activityLevel, activityLabel } = deriveActivity(openNow, place.userRatingCount);

  return {
    placeId: place.id,
    openNow,
    businessStatus: place.businessStatus ?? null,
    userRatingCount: place.userRatingCount ?? null,
    rating: place.rating ?? null,
    priceLevel: place.priceLevel ?? null,
    activityLevel,
    activityLabel,
  };
}

async function matchVenues(
  venues: Array<{ id: string; name: string; latitude: number; longitude: number }>,
): Promise<Record<string, GoogleVenueSignal>> {
  const signals: Record<string, GoogleVenueSignal> = {};
  const limited = venues.slice(0, 12);

  await Promise.all(
    limited.map(async (venue) => {
      try {
        const signal = await matchVenue(venue);
        if (signal) signals[venue.id] = signal;
      } catch (e) {
        console.warn('[places-search] matchVenue failed', venue.name, e);
      }
    }),
  );

  return signals;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await req.json()) as RequestBody;

    if (body.action === 'autocomplete') {
      if (!body.input || body.input.trim().length < 2) {
        return jsonResponse({ suggestions: [] });
      }
      const suggestions = await autocomplete(body.input, body.sessionToken);
      return jsonResponse({ suggestions });
    }

    if (body.action === 'details') {
      if (!body.placeId?.trim()) {
        return jsonResponse({ error: 'placeId is required' }, 400);
      }
      const location = await placeDetails(body.placeId.trim());
      return jsonResponse({ location });
    }

    if (body.action === 'matchVenues') {
      if (!Array.isArray(body.venues)) {
        return jsonResponse({ error: 'venues array is required' }, 400);
      }
      const signals = await matchVenues(body.venues);
      return jsonResponse({ signals });
    }

    return jsonResponse({ error: 'Unknown action' }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Places search failed';
    console.error('[places-search]', message);
    return jsonResponse({ error: message }, 500);
  }
});
