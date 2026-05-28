const { hasConfiguredKey } = require('../../utils/requestUtils');
const { createServerCacheKey, fetchWithServerCache, getMemoryCacheEntry, setMemoryCacheEntry } = require('../../utils/serverCache');

// Copied utility functions from server.js

function getSerpApiZoom(radius = 10000) {
  const meters = Number(radius) || 10000;
  if (meters <= 500) return 16;
  if (meters <= 1000) return 15;
  if (meters <= 2000) return 14;
  if (meters <= 5000) return 13;
  if (meters <= 10000) return 12;
  if (meters <= 25000) return 11;
  return 10;
}

function normalizePlaceUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function normalizePlaceSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDistanceMeters(from, to) {
  const fromLatitude = Number(from.latitude);
  const fromLongitude = Number(from.longitude);
  const toLatitude = Number(to.lat);
  const toLongitude = Number(to.lon);
  if (![fromLatitude, fromLongitude, toLatitude, toLongitude].every(Number.isFinite)) return null;

  const earthRadius = 6371000;
  const lat1 = fromLatitude * Math.PI / 180;
  const lat2 = toLatitude * Math.PI / 180;
  const deltaLat = (toLatitude - fromLatitude) * Math.PI / 180;
  const deltaLon = (toLongitude - fromLongitude) * Math.PI / 180;
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function attachPlaceDistance(place, origin) {
  const distance = getDistanceMeters(origin, { lat: place.lat, lon: place.lon });
  return { ...place, distance, distanceMeters: distance };
}

function isPlaceWithinRadius(place, radius) {
  if (!Number.isFinite(place.distance)) return false;
  return place.distance <= Number(radius || 0) + 80;
}

function buildPlaceSearchQueries(query) {
  const normalized = normalizePlaceSearchText(query);
  const variants = [query];
  const add = (...items) => {
    items.forEach((item) => {
      const value = String(item || '').trim();
      const normalizedValue = normalizePlaceSearchText(value);
      if (value && !variants.some((current) => normalizePlaceSearchText(current) === normalizedValue)) {
        variants.push(value);
      }
    });
  };

  if (normalized.includes('cafe') || normalized.includes('coffee') || normalized.includes('ca phe')) {
    add('cafe', 'cà phê', 'coffee', 'quán cà phê', 'coffee shop');
  }
  if (normalized.includes('highlands')) {
    add('Highlands Coffee', 'Highlands cafe');
  }
  if (normalized.includes('restaurant') || normalized.includes('nha hang') || normalized.includes('quan an') || normalized.includes('food')) {
    add('quán ăn', 'nhà hàng', 'restaurant', 'food');
  }
  if (normalized.includes('store') || normalized.includes('shop') || normalized.includes('sieu thi')) {
    add('cửa hàng', 'siêu thị', 'store', 'shop');
  }
  return variants.slice(0, 6);
}

function getPlaceDedupeKey(place) {
  const lat = Number(place.lat);
  const lon = Number(place.lon);
  const name = normalizePlaceSearchText(place.name);
  if (name && Number.isFinite(lat) && Number.isFinite(lon)) {
    return `geo:${name}:${Math.round(lat * 10000)}:${Math.round(lon * 10000)}`;
  }
  const id = place.rawPlaceId || place.placeId || place.dataId || place.dataCid || place.id;
  return id ? `id:${id}` : `fallback:${name}:${normalizePlaceSearchText(place.address)}`;
}

function mergePlaceResult(existing, incoming) {
  const preferred = existing.source === 'serpapi' ? existing : incoming.source === 'serpapi' ? incoming : existing;
  const fallback = preferred === existing ? incoming : existing;
  return {
    ...fallback,
    ...preferred,
    website: preferred.website || fallback.website || '',
    googleMapsUrl: preferred.googleMapsUrl || fallback.googleMapsUrl || '',
    phone: preferred.phone || fallback.phone || '',
    rating: preferred.rating || fallback.rating || null,
    userRatingCount: Math.max(Number(preferred.userRatingCount || 0), Number(fallback.userRatingCount || 0)),
    price: preferred.price || fallback.price || '',
    types: preferred.types?.length ? preferred.types : fallback.types || [],
    distance: Math.min(
      Number.isFinite(preferred.distance) ? preferred.distance : Number.MAX_SAFE_INTEGER,
      Number.isFinite(fallback.distance) ? fallback.distance : Number.MAX_SAFE_INTEGER
    ),
    distanceMeters: Math.min(
      Number.isFinite(preferred.distanceMeters) ? preferred.distanceMeters : Number.MAX_SAFE_INTEGER,
      Number.isFinite(fallback.distanceMeters) ? fallback.distanceMeters : Number.MAX_SAFE_INTEGER
    )
  };
}

function rankNearbyPlace(a, b) {
  const distanceA = Number.isFinite(a.distance) ? a.distance : Number.MAX_SAFE_INTEGER;
  const distanceB = Number.isFinite(b.distance) ? b.distance : Number.MAX_SAFE_INTEGER;
  if (distanceA !== distanceB) return distanceA - distanceB;

  const reviewsA = Number(a.userRatingCount || 0);
  const reviewsB = Number(b.userRatingCount || 0);
  const ratingA = Number(a.rating || 0);
  const ratingB = Number(b.rating || 0);
  return (ratingB * 100 + Math.min(reviewsB, 500)) - (ratingA * 100 + Math.min(reviewsA, 500));
}

function createPlacesService(dependencies) {
  const { env } = dependencies;
  const { SERPAPI_API_KEY, GOOGLE_PLACES_API_KEY } = env;

  // Implementation for mapGooglePlace, mapSerpApiPlace, searchWithSerpApi, searchWithGooglePlaces
  // To avoid huge file size, I will only implement the skeleton required.
  // We can include the mapping functions inside this service.
  
  function mapSerpApiPlace(place = {}) {
    const lat = place.gps_coordinates?.latitude;
    const lon = place.gps_coordinates?.longitude;
    return {
      id: place.place_id || place.data_id || place.data_cid || place.position,
      source: 'serpapi',
      placeId: place.place_id || '',
      dataId: place.data_id || '',
      dataCid: place.data_cid || '',
      name: place.title || 'Địa điểm',
      type: place.type || place.types?.[0] || 'place',
      typeLabel: 'SerpApi Maps',
      address: place.address || '',
      lat,
      lon,
      website: normalizePlaceUrl(place.website || place.links?.website || ''),
      googleMapsUrl: place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : '',
      phone: place.phone || '',
      rating: place.rating || null,
      userRatingCount: place.reviews || 0,
      price: place.price || '',
      types: place.types || []
    };
  }

  function mapGooglePlace(place = {}) {
    const legacyLocation = place.geometry?.location || {};
    const lat = place.location?.latitude ?? legacyLocation.lat;
    const lon = place.location?.longitude ?? legacyLocation.lng;
    const name = place.displayName?.text || place.formattedAddress || 'Địa điểm';
    const legacyName = place.name || place.formatted_address || place.vicinity || '';
    const type = Array.isArray(place.types) ? place.types[0] : 'place';
    const priceLevel = place.priceLevel ? place.priceLevel.replace('PRICE_LEVEL_', '') : (Number.isFinite(place.price_level) ? '$'.repeat(Math.max(1, Number(place.price_level))) : '');
    const placeId = place.id || place.place_id;
    return {
      id: placeId,
      source: 'google_places',
      rawPlaceId: placeId,
      name: legacyName || name,
      type,
      typeLabel: 'Google Places',
      address: place.formattedAddress || place.formatted_address || place.vicinity || '',
      lat,
      lon,
      website: place.websiteUri || '',
      googleMapsUrl: place.googleMapsUri || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : ''),
      phone: place.nationalPhoneNumber || '',
      rating: place.rating || null,
      userRatingCount: place.userRatingCount || place.user_ratings_total || 0,
      price: priceLevel,
      types: place.types || []
    };
  }

  async function searchWithSerpApi({ query, latitude, longitude, radius }) {
    const cacheKey = createServerCacheKey('serpapi-search', query, Number(latitude).toFixed(4), Number(longitude).toFixed(4), radius);
    return fetchWithServerCache(
      cacheKey,
      async () => {
        const params = new URLSearchParams({
          engine: 'google_maps',
          type: 'search',
          q: query,
          ll: `@${latitude},${longitude},${getSerpApiZoom(radius)}z`,
          num: '20',
          hl: 'vi',
          gl: 'vn',
          api_key: SERPAPI_API_KEY
        });
        const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
        const payload = await response.json();
        if (!response.ok || payload.error) {
          const error = new Error(payload.error || 'SerpApi search failed');
          error.status = response.status;
          throw error;
        }
        return (payload.local_results || []).map(mapSerpApiPlace);
      },
      { ttl: 10 * 60 * 1000, staleTtl: 24 * 60 * 60 * 1000 }
    );
  }

  async function searchWithGooglePlaces({ query, latitude, longitude, radius }) {
    const cacheKey = createServerCacheKey('google-places-search', query, Number(latitude).toFixed(4), Number(longitude).toFixed(4), radius);
    return fetchWithServerCache(
      cacheKey,
      async () => {
        const params = new URLSearchParams({
          query,
          location: `${latitude},${longitude}`,
          radius: String(Math.min(Math.max(Number(radius || 1000), 100), 50000)),
          language: 'vi',
          region: 'vn',
          key: GOOGLE_PLACES_API_KEY
        });
        const response = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`);
        const payload = await response.json();
        if (!response.ok || (payload.status && !['OK', 'ZERO_RESULTS'].includes(payload.status))) {
          const error = new Error(payload.error_message || payload.status || 'Google Places legacy search failed');
          error.status = response.status;
          throw error;
        }
        return (payload.results || []).map(mapGooglePlace);
      },
      { ttl: 10 * 60 * 1000, staleTtl: 24 * 60 * 60 * 1000 }
    );
  }

  return {
    searchWithSerpApi,
    searchWithGooglePlaces,
    buildPlaceSearchQueries,
    attachPlaceDistance,
    isPlaceWithinRadius,
    getPlaceDedupeKey,
    mergePlaceResult,
    rankNearbyPlace
  };
}

module.exports = {
  createPlacesService
};
