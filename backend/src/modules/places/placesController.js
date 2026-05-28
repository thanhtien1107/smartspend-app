const { hasConfiguredKey } = require('../../utils/requestUtils');
const { createPlacesService } = require('./placesService');

/**
 * @interface PlacesController
 * @description Exposes methods for Places routing.
 */
function createPlacesController(dependencies) {
  const { env } = dependencies;
  const { SERPAPI_API_KEY, GOOGLE_PLACES_API_KEY } = env;
  const service = createPlacesService(dependencies);

  return {
    async handleExpandedPlacesSearch(req, res) {
      const hasGooglePlaces = hasConfiguredKey(GOOGLE_PLACES_API_KEY, 'your_google_places_api_key_here');
      const hasSerpApi = hasConfiguredKey(SERPAPI_API_KEY, 'your_serpapi_api_key_here');
      if (!hasGooglePlaces && !hasSerpApi) {
        return res.status(501).json({
          configured: false,
          places: [],
          error: 'GOOGLE_PLACES_API_KEY hoặc SERPAPI_API_KEY chưa được cấu hình'
        });
      }

      const query = String(req.body.query || '').trim();
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);
      const radius = Math.min(Math.max(Number(req.body.radius || 1000), 100), 50000);
      if (!query || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return res.status(400).json({ error: 'Thiếu query hoặc tọa độ hợp lệ' });
      }

      try {
        const origin = { latitude, longitude };
        const queryVariants = service.buildPlaceSearchQueries(query);
        const searchPromises = [];

        queryVariants.forEach((searchQuery) => {
          if (hasGooglePlaces) {
            searchPromises.push(
              service.searchWithGooglePlaces({ query: searchQuery, latitude, longitude, radius })
                .then(places => places.map(p => ({ ...p, priority: 1, matchedQuery: searchQuery })))
                .catch(err => { console.log(`Google Places error (${searchQuery}):`, err.message); return []; })
            );
          }

          if (hasSerpApi) {
            searchPromises.push(
              service.searchWithSerpApi({ query: searchQuery, latitude, longitude, radius })
                .then(places => places.map(p => ({ ...p, priority: 0, matchedQuery: searchQuery })))
                .catch(err => { console.log(`SerpAPI error (${searchQuery}):`, err.message); return []; })
            );
          }
        });

        const results = await Promise.all(searchPromises);
        const rawPlaces = results.flat();
        const allPlaces = rawPlaces
          .map((place) => service.attachPlaceDistance(place, origin))
          .filter((place) => service.isPlaceWithinRadius(place, radius));

        const uniquePlacesByKey = new Map();
        allPlaces
          .sort(service.rankNearbyPlace)
          .forEach((place) => {
            const key = service.getPlaceDedupeKey(place);
            const existing = uniquePlacesByKey.get(key);
            uniquePlacesByKey.set(key, existing ? service.mergePlaceResult(existing, place) : place);
          });

        const finalPlaces = Array.from(uniquePlacesByKey.values())
          .sort(service.rankNearbyPlace)
          .slice(0, 20);

        return res.json({
          configured: true,
          source: hasSerpApi ? 'serpapi' : 'google_places',
          searchMeta: {
            queryVariants,
            rawCount: rawPlaces.length,
            inRadiusCount: allPlaces.length,
            returnedCount: finalPlaces.length,
            radius
          },
          places: finalPlaces
        });
      } catch (error) {
        return res.status(500).json({ error: 'Places search service error', details: error.message });
      }
    },

    async search(req, res) {
      const hasGooglePlaces = hasConfiguredKey(GOOGLE_PLACES_API_KEY, 'your_google_places_api_key_here');
      const hasSerpApi = hasConfiguredKey(SERPAPI_API_KEY, 'your_serpapi_api_key_here');
      if (!hasGooglePlaces && !hasSerpApi) {
        return res.status(501).json({
          configured: false,
          places: [],
          error: 'GOOGLE_PLACES_API_KEY hoặc SERPAPI_API_KEY chưa được cấu hình'
        });
      }

      const query = String(req.body.query || '').trim();
      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);
      const radius = Math.min(Number(req.body.radius || 1000), 50000);
      if (!query || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return res.status(400).json({ error: 'Thiếu query hoặc tọa độ hợp lệ' });
      }

      try {
        const searchPromises = [];

        if (!hasSerpApi && hasGooglePlaces) {
          searchPromises.push(
            service.searchWithGooglePlaces({ query, latitude, longitude, radius })
              .then(places => places.map(p => ({ ...p, priority: 1 })))
              .catch(err => { console.log('Google Places error:', err.message); return []; })
          );
        }

        if (hasSerpApi) {
          searchPromises.push(
            service.searchWithSerpApi({ query, latitude, longitude, radius })
              .then(places => places.map(p => ({ ...p, priority: 1 })))
              .catch(err => { console.log('SerpAPI error:', err.message); return []; })
          );
        }

        const results = await Promise.all(searchPromises);
        const allPlaces = results.flat();

        const uniquePlaces = [];
        const seen = new Set();

        allPlaces
          .sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return (a.distance || 0) - (b.distance || 0);
          })
          .forEach(place => {
            const key = `${place.name}-${place.lat?.toFixed(4)}-${place.lon?.toFixed(4)}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniquePlaces.push(place);
            }
          });

        const finalPlaces = uniquePlaces.slice(0, 12);

        res.json({
          configured: true,
          source: hasSerpApi ? 'serpapi' : 'google_places',
          places: finalPlaces
        });
      } catch (error) {
        res.status(500).json({ error: 'Places search service error', details: error.message });
      }
    }
  };
}

module.exports = {
  createPlacesController
};
