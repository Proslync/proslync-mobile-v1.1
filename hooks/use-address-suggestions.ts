// Mapbox Search Box API — address + POI (venues/businesses) autocomplete

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './use-debounce';
import type { LocationDetails } from '@/lib/api/events';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const SUGGEST_URL = 'https://api.mapbox.com/search/searchbox/v1/suggest';
const RETRIEVE_URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve';

export interface AddressSuggestion {
  id: string;
  mapboxId: string;
  fullAddress: string;
  name: string;
  locationDetails?: LocationDetails;
}

interface SuggestResult {
  name: string;
  full_address?: string;
  mapbox_id: string;
  feature_type: string;
  address?: string;
  place_formatted?: string;
}

interface RetrieveFeature {
  properties: {
    name?: string;
    full_address?: string;
    coordinates?: { longitude: number; latitude: number };
    context?: {
      address?: { name?: string; address_number?: string; street_name?: string };
      street?: { name?: string };
      place?: { name?: string };
      region?: { name?: string; region_code?: string };
      postcode?: { name?: string };
      country?: { name?: string; country_code?: string };
    };
  };
}

export function useAddressSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const sessionTokenRef = useRef(generateSessionToken());

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3 || !MAPBOX_TOKEN) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          access_token: MAPBOX_TOKEN,
          session_token: sessionTokenRef.current,
          limit: '5',
          types: 'address,poi',
          language: 'en',
        });

        const response = await fetch(`${SUGGEST_URL}?${params}`);
        if (!response.ok || cancelled) return;

        const data = await response.json();
        if (cancelled) return;

        const mapped: AddressSuggestion[] = (data.suggestions || []).map(
          (result: SuggestResult) => ({
            id: result.mapbox_id,
            mapboxId: result.mapbox_id,
            fullAddress: result.full_address || result.place_formatted || result.name,
            name: result.name,
          }),
        );

        setSuggestions(mapped);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchSuggestions();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const retrieve = useCallback(
    async (mapboxId: string): Promise<LocationDetails | undefined> => {
      if (!MAPBOX_TOKEN) return undefined;

      try {
        const params = new URLSearchParams({
          access_token: MAPBOX_TOKEN,
          session_token: sessionTokenRef.current,
        });

        const response = await fetch(`${RETRIEVE_URL}/${mapboxId}?${params}`);
        if (!response.ok) return undefined;

        const data = await response.json();
        const feature: RetrieveFeature | undefined = data.features?.[0];
        if (!feature) return undefined;

        // Reset session token after retrieve (billing optimization)
        sessionTokenRef.current = generateSessionToken();

        const ctx = feature.properties.context || {};
        const coords = feature.properties.coordinates;

        const streetNumber =
          ctx.address?.address_number || ctx.address?.name || '';
        const streetName = ctx.street?.name || '';
        const addressLine1 = streetNumber
          ? `${streetNumber} ${streetName}`.trim()
          : streetName || feature.properties.name || '';

        return {
          addressLine1,
          city: ctx.place?.name || '',
          state:
            ctx.region?.region_code?.replace(/^US-/, '') ||
            ctx.region?.name ||
            '',
          postalCode: ctx.postcode?.name || '',
          country: ctx.country?.name || '',
          formattedAddress: feature.properties.full_address || '',
          coordinates: coords
            ? { lat: coords.latitude, lng: coords.longitude }
            : undefined,
        };
      } catch {
        return undefined;
      }
    },
    [],
  );

  return { suggestions, isLoading, retrieve };
}

function generateSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
