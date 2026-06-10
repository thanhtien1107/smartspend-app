<template>
  <section id="add" class="screen active add-expense-screen">
    <div class="add-header">
      <span>SmartSpend</span>
      <h2>Thêm giao dịch</h2>
    </div>

    <p v-if="errorMessage" class="notification-box expense-error">
      {{ errorMessage }}
    </p>

    <form
      id="expense-form"
      class="expense-card"
      @submit.prevent="submitExpense"
    >
      <label class="amount-field">
        <span>Số tiền</span>
        <input
          v-model.number="expenseForm.amount"
          type="number"
          id="expense-amount"
          inputmode="numeric"
          placeholder="100.000 VND"
          min="1"
          required
        />
      </label>

      <div class="form-list">
        <label class="form-row">
          <span class="row-icon">{{ expenseForm.type === 'income' ? '💰' : '💸' }}</span>
          <span class="row-label">Giao dịch</span>
          <select v-model="expenseForm.type" id="transaction-type">
            <option value="expense">Chi tiêu</option>
            <option value="income">Thu vào</option>
          </select>
          <span class="row-arrow">&gt;</span>
        </label>

        <label class="form-row">
          <span class="row-icon">{{
            getCategoryIcon(expenseForm.category)
          }}</span>
          <span class="row-label">Loại</span>
          <select v-model="expenseForm.category" id="expense-category">
            <option
              v-for="category in availableCategories"
              :key="category"
              :value="category"
            >
              {{ getCategoryIcon(category) }} {{ category }}
            </option>
          </select>
          <span class="row-arrow">&gt;</span>
        </label>

        <label class="form-row">
          <span class="row-icon">📅</span>
          <span class="row-label">Ngày</span>
          <input
            v-model="expenseForm.date"
            type="date"
            id="expense-date"
            required
          />
          <span class="row-arrow">&gt;</span>
        </label>

        <label class="form-row">
          <span class="row-icon">⏰</span>
          <span class="row-label">Giờ</span>
          <input
            v-model="expenseForm.time"
            type="time"
            id="expense-time"
            required
          />
          <span class="row-arrow">&gt;</span>
        </label>

        <label class="form-row form-row-text">
          <span class="row-icon">📝</span>
          <span class="row-label">Ghi chú</span>
          <textarea
            v-model.trim="expenseForm.note"
            id="expense-note"
            placeholder="Mô tả giao dịch"
          ></textarea>
          <span class="row-arrow">&gt;</span>
        </label>

        <div class="form-row location-row">
          <span class="row-icon">📍</span>
          <label class="row-label" for="expense-location">Vị trí</label>
          <div class="location-input-wrap">
            <input
              v-model.trim="expenseForm.location"
              type="text"
              id="expense-location"
              placeholder="Địa điểm"
              autocomplete="off"
              @focus="handleLocationFocus"
              @blur="closeLocationSuggestionsSoon"
              @keydown.esc="clearLocationSuggestions"
            />
            <span
              v-if="locationSearchLoading"
              class="location-inline-spinner"
            ></span>
            <button
              type="button"
              class="location-target-btn"
              aria-label="Lấy vị trí hiện tại"
              title="Lấy vị trí hiện tại"
              :disabled="gpsLoading"
              @mousedown.prevent
              @click="locateCurrentPosition(true)"
            >
              <span v-if="gpsLoading" class="mini-spinner"></span>
              <span v-else>⌖</span>
            </button>

            <div v-if="locationSuggestions.length" class="location-suggestions">
              <button
                v-for="suggestion in locationSuggestions"
                :key="suggestion.place_id"
                type="button"
                class="location-suggestion"
                @mousedown.prevent="selectLocationSuggestion(suggestion)"
              >
                <strong>{{ getSuggestionTitle(suggestion) }}</strong>
                <span>{{ suggestion.description }}</span>
                <small v-if="getSuggestionMeta(suggestion)">{{
                  getSuggestionMeta(suggestion)
                }}</small>
              </button>
            </div>
          </div>
          <span class="row-arrow">&gt;</span>
        </div>

        <div
          v-if="placeDetailsLoading"
          class="place-detail-panel place-detail-loading"
        >
          <span class="mini-spinner"></span>
          <span>Đang tải thông tin địa điểm...</span>
        </div>

        <div v-if="selectedPlace" class="place-detail-panel">
          <div class="place-detail-heading">
            <div>
              <strong>{{ selectedPlace.name }}</strong>
              <p>{{ selectedPlace.formatted_address }}</p>
            </div>
            <span class="place-rating"
              >⭐ {{ selectedPlace.rating || "Chưa có" }}</span
            >
          </div>

          <div
            v-if="selectedPlace.website || selectedPlace.googleMapsUrl"
            class="place-link-row"
          >
            <a
              v-if="selectedPlace.website"
              :href="selectedPlace.website"
              target="_blank"
              rel="noopener"
              >Website</a
            >
            <a
              v-if="selectedPlace.googleMapsUrl"
              :href="selectedPlace.googleMapsUrl"
              target="_blank"
              rel="noopener"
              >Google Maps</a
            >
          </div>

          <div v-if="placeReviews.length" class="place-review-list">
            <article
              v-for="review in placeReviews"
              :key="review.key"
              class="place-review"
            >
              <strong>{{ review.author_name || "Khách hàng" }}</strong>
              <span>⭐ {{ review.rating || "-" }}</span>
              <p>{{ review.text }}</p>
            </article>
          </div>

          <iframe
            v-if="selectedPlace.mapEmbedUrl"
            class="mini-map"
            :src="selectedPlace.mapEmbedUrl"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Bản đồ địa điểm đã chọn"
          ></iframe>
          <p v-if="directionsInfo" class="directions-info">
            {{ directionsInfo.distance }} · {{ directionsInfo.duration }}
          </p>
        </div>

        <label class="form-row">
          <span class="row-icon">👥</span>
          <span class="row-label">Bạn bè</span>
          <input
            v-model.trim="expenseForm.friends"
            type="text"
            id="expense-friends"
            placeholder="Tên người tham gia"
          />
          <span class="row-arrow">&gt;</span>
        </label>
      </div>

      <div class="attachment-panel">
        <div class="attachment-heading">
          <span class="row-icon">🧾</span>
          <div>
            <strong>Đính kèm</strong>
            <p>Hóa đơn hoặc hình ảnh giao dịch</p>
          </div>
        </div>

        <div class="attachment-actions">
          <button
            type="button"
            class="attachment-btn"
            @click="openLibraryPicker"
          >
            Chọn từ thư viện
          </button>
          <button
            type="button"
            class="attachment-btn"
            @click="openCameraPicker"
          >
            Chụp ảnh
          </button>
        </div>

        <input
          ref="libraryInput"
          type="file"
          accept="image/*"
          class="hidden-file-input"
          @change="handleImageChange"
        />
        <input
          ref="cameraInput"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden-file-input"
          @change="handleImageChange"
        />

        <div v-if="imagePreview" class="image-preview">
          <img :src="imagePreview" alt="Ảnh đính kèm đã chọn" />
          <button type="button" class="remove-image-btn" @click="clearImage">
            Xóa ảnh
          </button>
        </div>
      </div>

      <button
        type="submit"
        class="primary-btn save-expense-btn"
        id="expense-form-submit"
        :disabled="loading"
      >
        {{ loading ? "Đang lưu..." : expenseForm.type === 'income' ? "Lưu thu vào" : "Lưu chi tiêu" }}
      </button>
    </form>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/useAppStore';
import { apiFetch } from '../services/api';
import { getCategoryIcon } from '../utils/categoryIcons';
import { validateExpenseData } from '../utils/financialAnalysis';
import { createCacheKey, fetchWithCache } from '../utils/cache';
import { INCOME_CATEGORIES, normalizeTransactionType } from '../utils/transactionCategories';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'ĐIỀN_API_KEY_CỦA_BẠN_Ở_ĐÂY';
const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-javascript-sdk';
const LOCATION_RESULT_LIMIT = 8;
const BACKEND_PLACE_RADIUS_METERS = 10000;
const BACKEND_PLACE_SEARCH_ENDPOINT = '/api/places/search';
const AUTOCOMPLETE_RADIUS_METERS = 50000;
const NEARBY_SEARCH_RADII = [2000, 5000, 10000, 25000, 50000];
const NEARBY_TYPES = ['cafe', 'restaurant', 'store', 'food'];

const router = useRouter();
const appStore = useAppStore();
const { categories } = storeToRefs(appStore);

const googleReady = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const gpsLoading = ref(false);
const locationSearchLoading = ref(false);
const placeDetailsLoading = ref(false);
const locationSuggestions = ref([]);
const userCoordinates = ref(null);
const selectedPlace = ref(null);
const placeReviews = ref([]);
const directionsInfo = ref(null);
const selectedImage = ref(null);
const imagePreview = ref('');
const libraryInput = ref(null);
const cameraInput = ref(null);

let googleMapsLoadPromise = null;
let autocompleteService = null;
let placesService = null;
let geocoder = null;
let autocompleteSessionToken = null;
let locationSearchTimer = null;
let locationBlurTimer = null;
let ignoreNextLocationSearch = false;
let locationSearchRequestId = 0;

const expenseForm = reactive({
  type: 'expense',
  amount: null,
  category: 'Ăn uống',
  date: getCurrentDate(),
  time: getCurrentTime(),
  note: '',
  location: '',
  friends: ''
});

const availableCategories = computed(() => {
  if (expenseForm.type === 'income') return INCOME_CATEGORIES;
  return categories.value.length ? categories.value : ['Ăn uống'];
});

onMounted(async () => {
  errorMessage.value = '';
  locationSuggestions.value = [];
  await appStore.fetchCategories();
  syncDefaultCategory();
});

onBeforeUnmount(() => {
  revokePreviewUrl();
  clearLocationTimers();
  clearMapOverlays();
});

watch(categories, syncDefaultCategory);
watch(
  () => expenseForm.type,
  () => {
    expenseForm.type = normalizeTransactionType(expenseForm.type);
    syncDefaultCategory();
  }
);
watch(
  () => expenseForm.location,
  (value) => {
    if (ignoreNextLocationSearch) {
      ignoreNextLocationSearch = false;
      return;
    }

    clearSelectedPlace();
    clearLocationSuggestions();
    queueLocationSearch(value);
  }
);

function getCurrentDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function syncDefaultCategory() {
  const list = availableCategories.value;
  if (list.length && !list.includes(expenseForm.category)) {
    expenseForm.category = list[0];
  }
}

async function initializeGoogleMaps() {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'ĐIỀN_API_KEY_CỦA_BẠN_Ở_ĐÂY') {
    errorMessage.value = 'Thiếu Google Maps API key. Hãy cấu hình VITE_GOOGLE_MAPS_API_KEY trong .env hoặc sửa GOOGLE_MAPS_API_KEY.';
    return false;
  }

  if (!googleMapsLoadPromise) {
    googleMapsLoadPromise = loadGoogleMapsScript()
      .then(() => {
        autocompleteService = new window.google.maps.places.AutocompleteService();
        placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
        geocoder = new window.google.maps.Geocoder();
        autocompleteSessionToken = createAutocompleteSessionToken();
        googleReady.value = true;
        console.log('Google Maps JavaScript SDK legacy đã sẵn sàng!');
        return true;
      })
      .catch((error) => {
        console.error('Google Maps SDK load failed', error);
        googleReady.value = false;
        errorMessage.value = 'Không thể tải Google Maps SDK. Hãy kiểm tra API key, Billing và HTTP Referrers.';
        return false;
      });
  }

  return googleMapsLoadPromise;
}

function loadGoogleMapsScript() {
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      libraries: 'places',
      language: 'vi',
      region: 'VN'
    });

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function createAutocompleteSessionToken() {
  const TokenClass = window.google?.maps?.places?.AutocompleteSessionToken;
  return TokenClass ? new TokenClass() : undefined;
}

async function ensureGoogleReady() {
  if (window.google?.maps?.places) return true;
  return await initializeGoogleMaps();
}

function getCurrentPosition(showErrors = true) {
  if (!navigator.geolocation) {
    if (showErrors) errorMessage.value = 'Trình duyệt không hỗ trợ định vị GPS.';
    return Promise.reject(new Error('Geolocation is not supported'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coordinates = { latitude, longitude };
        userCoordinates.value = coordinates;
        resolve(coordinates);
      },
      (error) => {
        console.warn('Geolocation failed', error);
        if (showErrors) errorMessage.value = 'Không thể lấy vị trí hiện tại. Hãy kiểm tra quyền vị trí của trình duyệt.';
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000
      }
    );
  });
}

async function locateCurrentPosition(showErrors = true) {
  gpsLoading.value = true;
  try {
    const { latitude, longitude } = await getCurrentPosition(showErrors);
    clearLocationSuggestions();
    clearSelectedPlace();
    setLocationValue('Đang xác định địa chỉ...');
    const address = await reverseGeocodeCurrentLocation(latitude, longitude);
    setLocationValue(address || 'Vị trí hiện tại');
    errorMessage.value = '';
  } catch (error) {
    if (error?.message !== 'Geolocation is not supported') {
      console.warn('Reverse geocoding failed', error);
    }
    if (userCoordinates.value) {
      setLocationValue('Vị trí hiện tại');
      if (showErrors) errorMessage.value = 'Đã lấy được GPS nhưng chưa đổi được thành địa chỉ chữ.';
    }
  } finally {
    gpsLoading.value = false;
  }
}

async function reverseGeocodeCurrentLocation(latitude, longitude) {
  const googleAddress = await reverseGeocodeWithGoogle(latitude, longitude).catch(() => '');
  if (googleAddress) return googleAddress;

  return await reverseGeocodeWithOpenStreetMap(latitude, longitude);
}

function reverseGeocodeWithGoogle(latitude, longitude) {
  if (!geocoder) return Promise.resolve('');

  return new Promise((resolve, reject) => {
    geocoder.geocode(
      {
        location: { lat: latitude, lng: longitude },
        language: 'vi',
        region: 'VN'
      },
      (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK) {
          resolve(results?.[0]?.formatted_address || '');
          return;
        }

        reject(new Error(`Google reverse geocoding failed: ${status}`));
      }
    );
  });
}

async function reverseGeocodeWithOpenStreetMap(latitude, longitude) {
  const cacheKey = createCacheKey('places', 'osm-reverse', getCoordinateCacheScope({ latitude, longitude }));
  return fetchWithCache(
    cacheKey,
    async () => {
      const params = new URLSearchParams({
        format: 'jsonv2',
        lat: String(latitude),
        lon: String(longitude),
        zoom: '18',
        addressdetails: '1',
        'accept-language': 'vi'
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'vi'
        }
      });

      if (!response.ok) {
        const error = new Error(`OpenStreetMap reverse geocoding failed: ${response.status}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return data.display_name || formatOsmAddress(data.address) || '';
    },
    { ttl: 24 * 60 * 60 * 1000, staleTtl: 7 * 24 * 60 * 60 * 1000 }
  );
}

function formatOsmAddress(address = {}) {
  return [
    address.house_number && address.road ? `${address.house_number} ${address.road}` : address.road,
    address.suburb || address.city_district || address.district,
    address.city || address.town || address.village,
    address.state
  ]
    .filter(Boolean)
    .join(', ');
}

function queueLocationSearch(query) {
  window.clearTimeout(locationSearchTimer);
  locationSearchTimer = window.setTimeout(() => {
    searchLocations(query);
  }, 500);
}

function handleLocationFocus() {
  if (expenseForm.location?.trim().length >= 2) {
    queueLocationSearch(expenseForm.location);
  }
}

async function searchLocations(query) {
  const normalizedQuery = String(query || '').trim();
  const requestId = ++locationSearchRequestId;

  if (normalizedQuery.length < 2) {
    clearLocationSuggestions();
    return;
  }

  locationSearchLoading.value = true;
  errorMessage.value = '';

  try {
    const suggestions = await searchBackendNearbyPlaces(normalizedQuery);
    if (requestId !== locationSearchRequestId) return;

    if (suggestions.length) {
      locationSuggestions.value = suggestions.slice(0, LOCATION_RESULT_LIMIT);
      return;
    }

    const fallbackSuggestions = await searchGoogleAutocompleteFallback(normalizedQuery);
    if (requestId !== locationSearchRequestId) return;
    locationSuggestions.value = fallbackSuggestions.slice(0, LOCATION_RESULT_LIMIT);
  } catch (error) {
    console.warn('Backend place search failed, falling back to Google autocomplete', error);
    if (requestId === locationSearchRequestId) {
      try {
        const suggestions = await searchGoogleAutocompleteFallback(normalizedQuery);
        if (requestId !== locationSearchRequestId) return;
        locationSuggestions.value = suggestions.slice(0, LOCATION_RESULT_LIMIT);
      } catch (fallbackError) {
        console.error('Location search failed', fallbackError);
        locationSuggestions.value = [];
        errorMessage.value = 'Không thể tải gợi ý địa điểm. Hãy bật vị trí rồi thử lại.';
      }
    }
  } finally {
    if (requestId === locationSearchRequestId) {
      locationSearchLoading.value = false;
    }
  }
}

async function searchBackendNearbyPlaces(query) {
  if (!userCoordinates.value) {
    await getCurrentPosition(false).catch(() => null);
  }

  if (!userCoordinates.value) {
    return [];
  }

  const searchQueries = buildLocationSearchQueries(query);
  const searchResults = await Promise.all(
    searchQueries.map(async (searchQuery) => {
      try {
        const cacheKey = createCacheKey(
          'places',
          'backend-search',
          normalizeSearchText(searchQuery),
          getCoordinateCacheScope(userCoordinates.value),
          BACKEND_PLACE_RADIUS_METERS
        );

        return await fetchWithCache(
          cacheKey,
          async () => {
            const response = await apiFetch(BACKEND_PLACE_SEARCH_ENDPOINT, {
              method: 'POST',
              body: JSON.stringify({
                query: searchQuery,
                latitude: userCoordinates.value.latitude,
                longitude: userCoordinates.value.longitude,
                radius: BACKEND_PLACE_RADIUS_METERS
              })
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
              const error = new Error(payload.error || 'Backend place search failed');
              error.status = response.status;
              throw error;
            }

            return payload.places || [];
          },
          { ttl: 10 * 60 * 1000, staleTtl: 24 * 60 * 60 * 1000 }
        );
      } catch (error) {
        console.warn(`Backend place search failed for ${searchQuery}`, error);
        return [];
      }
    })
  );

  return dedupeLocationSuggestions(
    searchResults
      .flat()
      .map(mapBackendPlace)
      .filter(Boolean)
  ).sort(sortNearbySuggestions);
}

function buildLocationSearchQueries(query) {
  const normalized = normalizeSearchText(query);
  const queries = [query];
  const addQuery = (value) => {
    const text = String(value || '').trim();
    if (!text) return;

    const normalizedText = normalizeSearchText(text);
    if (!queries.some((item) => normalizeSearchText(item) === normalizedText)) {
      queries.push(text);
    }
  };

  if (normalized.includes('high')) {
    addQuery('Highlands Coffee');
    addQuery('Highlands');
  }

  return queries.slice(0, 3);
}

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function getCoordinateCacheScope(coordinates) {
  if (!coordinates) return 'no-location';
  const latitude = Number(coordinates.latitude);
  const longitude = Number(coordinates.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return 'no-location';
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

function dedupeLocationSuggestions(suggestions) {
  const seen = new Set();
  return suggestions.filter((suggestion) => {
    const location = suggestion.geometry?.location;
    const lat = typeof location?.lat === 'function' ? location.lat() : location?.lat;
    const lng = typeof location?.lng === 'function' ? location.lng() : location?.lng;
    const key = [
      normalizeSearchText(getSuggestionTitle(suggestion)),
      Number.isFinite(Number(lat)) ? Number(lat).toFixed(4) : '',
      Number.isFinite(Number(lng)) ? Number(lng).toFixed(4) : ''
    ].join(':');

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchGoogleAutocompleteFallback(query) {
  const ready = await ensureGoogleReady();
  if (!ready || !autocompleteService) return [];
  return await fetchWithCache(
    createCacheKey(
      'places',
      'google-autocomplete',
      normalizeSearchText(query),
      getCoordinateCacheScope(userCoordinates.value),
      AUTOCOMPLETE_RADIUS_METERS
    ),
    () => getPlacePredictions(query),
    { ttl: 10 * 60 * 1000, staleTtl: 60 * 60 * 1000 }
  );
}

function getPlacePredictions(input) {
  const request = {
    input,
    componentRestrictions: { country: 'vn' },
    types: ['establishment'],
    sessionToken: autocompleteSessionToken
  };

  if (userCoordinates.value) {
    request.location = new window.google.maps.LatLng(userCoordinates.value.latitude, userCoordinates.value.longitude);
    request.radius = AUTOCOMPLETE_RADIUS_METERS;
    request.bounds = createLatLngBounds(userCoordinates.value, AUTOCOMPLETE_RADIUS_METERS);
    request.strictBounds = true;
  }

  return new Promise((resolve, reject) => {
    autocompleteService.getPlacePredictions(request, (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        resolve((predictions || []).map(mapAutocompletePrediction).filter(Boolean));
        return;
      }

      if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
        return;
      }

      reject(new Error(`Google autocomplete failed: ${status}`));
    });
  });
}

async function loadNearbyPlaces(showErrors = true) {
  const requestId = ++locationSearchRequestId;
  const ready = await ensureGoogleReady();
  if (!ready || !placesService || !userCoordinates.value) return;

  locationSearchLoading.value = true;
  errorMessage.value = '';

  try {
    const suggestions = await findNearbyPlacesProgressively();
    if (requestId !== locationSearchRequestId) return;
    locationSuggestions.value = suggestions;

    if (!suggestions.length && showErrors) {
      errorMessage.value = 'Không tìm thấy quán ăn, cafe hoặc cửa hàng quanh vị trí hiện tại.';
    }
  } catch (error) {
    console.error('Google nearby search failed', error);
    if (requestId === locationSearchRequestId) {
      locationSuggestions.value = [];
      if (showErrors) {
        const detail = getGoogleErrorDetail(error);
        errorMessage.value = `Không thể quét địa điểm xung quanh bằng Places API legacy${detail ? ` (${detail})` : ''}.`;
      }
    }
  } finally {
    if (requestId === locationSearchRequestId) {
      locationSearchLoading.value = false;
    }
  }
}

async function findNearbyPlacesProgressively() {
  const collected = new Map();
  let firstBlockingError = null;

  for (const radius of NEARBY_SEARCH_RADII) {
    for (const type of NEARBY_TYPES) {
      try {
        const results = await nearbySearch(radius, type);
        results.forEach((place) => {
          const suggestion = mapNearbyPlace(place, radius);
          if (suggestion?.place_id && !collected.has(suggestion.place_id)) {
            collected.set(suggestion.place_id, suggestion);
          }
        });
      } catch (error) {
        console.warn(`Legacy nearbySearch failed for ${type}/${radius}`, error);
        if (!firstBlockingError && String(error?.message || '').includes('REQUEST_DENIED')) {
          firstBlockingError = error;
        }
      }

      if (collected.size >= LOCATION_RESULT_LIMIT) break;
    }

    if (collected.size >= LOCATION_RESULT_LIMIT) break;
  }

  if (!collected.size && firstBlockingError) {
    throw firstBlockingError;
  }

  const topSuggestions = Array.from(collected.values())
    .sort(sortNearbySuggestions)
    .slice(0, LOCATION_RESULT_LIMIT);

  return await enrichNearbySuggestions(topSuggestions);
}

function nearbySearch(radius, type) {
  return new Promise((resolve, reject) => {
    const request = {
      location: new window.google.maps.LatLng(userCoordinates.value.latitude, userCoordinates.value.longitude),
      radius,
      type
    };

    if (type === 'food') {
      request.keyword = 'food';
    }

    placesService.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        resolve(results || []);
        return;
      }

      if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
        return;
      }

      if (status === window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST && type === 'food') {
        resolve([]);
        return;
      }

      reject(new Error(`Google nearbySearch failed: ${status}`));
    });
  });
}

async function enrichNearbySuggestions(suggestions) {
  return await Promise.all(
    suggestions.map(async (suggestion) => {
      try {
        const details = await getPlaceDetailsById(suggestion.place_id, [
          'place_id',
          'name',
          'rating',
          'website',
          'formatted_address',
          'geometry',
          'reviews',
          'vicinity'
        ]);
        return {
          ...suggestion,
          description: details.formatted_address || details.vicinity || suggestion.description,
          rating: details.rating ?? suggestion.rating,
          website: details.website || suggestion.website,
          reviews: details.reviews || [],
          rawPlace: details,
          geometry: details.geometry || suggestion.geometry
        };
      } catch (error) {
        console.warn('Could not enrich nearby place details', error);
        return suggestion;
      }
    })
  );
}

function mapAutocompletePrediction(prediction) {
  if (!prediction?.place_id) return null;

  return {
    type: 'autocomplete',
    place_id: prediction.place_id,
    description: prediction.description,
    structured_formatting: prediction.structured_formatting || {
      main_text: prediction.description?.split(',')[0] || prediction.description,
      secondary_text: ''
    },
    distanceMeters: prediction.distance_meters || null,
    rawPrediction: prediction
  };
}

function mapNearbyPlace(place, radius) {
  if (!place?.place_id) return null;

  const location = place.geometry?.location;
  const distanceMeters = location ? getDistanceMetersToLocation(location) : null;
  const description = [place.name, place.vicinity].filter(Boolean).join(', ');

  return {
    type: 'nearby',
    place_id: place.place_id,
    description,
    structured_formatting: {
      main_text: place.name || 'Địa điểm',
      secondary_text: place.vicinity || ''
    },
    distanceMeters,
    radius,
    rating: place.rating || null,
    website: '',
    geometry: place.geometry,
    rawPlace: place
  };
}

function mapBackendPlace(place) {
  const lat = Number(place.lat);
  const lng = Number(place.lon);
  if (!place?.id && !place?.placeId && !place?.rawPlaceId && !place?.dataId && !place?.dataCid) return null;

  const distanceMeters = Number.isFinite(lat) && Number.isFinite(lng) && userCoordinates.value
    ? calculateDistanceMeters(userCoordinates.value.latitude, userCoordinates.value.longitude, lat, lng)
    : null;
  const placeId = place.rawPlaceId || place.placeId || place.id || '';
  const description = [place.name, place.address].filter(Boolean).join(', ');

  return {
    type: 'backend',
    source: place.source,
    place_id: `${place.source}-${placeId || place.dataId || place.dataCid}`,
    placeId,
    dataId: place.dataId || '',
    dataCid: place.dataCid || '',
    description,
    structured_formatting: {
      main_text: place.name || 'Địa điểm',
      secondary_text: place.address || place.typeLabel || ''
    },
    distanceMeters,
    rating: place.rating || null,
    website: normalizeExternalUrl(place.website || ''),
    googleMapsUrl: normalizeExternalUrl(place.googleMapsUrl || ''),
    userRatingCount: place.userRatingCount || 0,
    phone: place.phone || '',
    geometry: Number.isFinite(lat) && Number.isFinite(lng)
      ? { location: { lat, lng } }
      : null,
    rawPlace: place
  };
}

function sortNearbySuggestions(a, b) {
  const distanceA = Number.isFinite(a.distanceMeters) ? a.distanceMeters : Number.MAX_SAFE_INTEGER;
  const distanceB = Number.isFinite(b.distanceMeters) ? b.distanceMeters : Number.MAX_SAFE_INTEGER;
  if (distanceA !== distanceB) return distanceA - distanceB;
  return Number(b.rating || 0) - Number(a.rating || 0);
}

async function selectLocationSuggestion(suggestion) {
  setLocationValue(getSuggestionTitle(suggestion));
  clearLocationSuggestions();
  placeDetailsLoading.value = true;
  errorMessage.value = '';

  try {
    const place = await getPlaceDetails(suggestion);
    selectedPlace.value = place;
    placeReviews.value = normalizeReviews(place.reviews).slice(0, 3);
    setLocationValue(place.formatted_address || place.name || suggestion.description);
    directionsInfo.value = suggestion.distanceMeters
      ? { distance: `${formatDistance(suggestion.distanceMeters)} từ bạn`, duration: '' }
      : null;
    autocompleteSessionToken = createAutocompleteSessionToken();
  } catch (error) {
    console.error('Google place details failed', error);
    selectedPlace.value = buildFallbackPlace(suggestion);
    setLocationValue(suggestion.description);
    errorMessage.value = '';
  } finally {
    placeDetailsLoading.value = false;
  }
}

async function getPlaceDetails(suggestion) {
  if (suggestion.type === 'backend') {
    return await getBackendPlaceDetails(suggestion);
  }

  const place = await getPlaceDetailsById(suggestion.place_id, [
    'place_id',
    'name',
    'rating',
    'reviews',
    'geometry',
    'formatted_address',
    'website',
    'vicinity',
    'url'
  ]);

  return {
    place_id: place.place_id || suggestion.place_id,
    name: place.name || getSuggestionTitle(suggestion),
    formatted_address: place.formatted_address || place.vicinity || suggestion.description,
    rating: place.rating ?? suggestion.rating,
    website: place.website || suggestion.website || '',
    googleMapsUrl: place.url || suggestion.googleMapsUrl || '',
    reviews: place.reviews || suggestion.reviews || [],
    geometry: place.geometry || suggestion.geometry,
    mapEmbedUrl: buildMapEmbedUrl({
      name: place.name || getSuggestionTitle(suggestion),
      address: place.formatted_address || place.vicinity || suggestion.description,
      geometry: place.geometry || suggestion.geometry
    })
  };
}

async function getBackendPlaceDetails(suggestion) {
  const requestBody = {
    source: suggestion.source,
    placeId: suggestion.placeId,
    dataId: suggestion.dataId,
    dataCid: suggestion.dataCid,
    latitude: suggestion.geometry?.location?.lat,
    longitude: suggestion.geometry?.location?.lng
  };

  const detail = await fetchWithCache(
    createCacheKey('places', 'backend-detail', requestBody),
    async () => {
      const response = await apiFetch('/api/places/detail', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(payload.error || 'Place detail failed');
        error.status = response.status;
        throw error;
      }
      return payload.detail || null;
    },
    { ttl: 30 * 60 * 1000, staleTtl: 24 * 60 * 60 * 1000 }
  ).catch(() => null);
  const lat = suggestion.geometry?.location?.lat;
  const lng = suggestion.geometry?.location?.lng;

  return {
    place_id: suggestion.place_id,
    name: detail?.name || getSuggestionTitle(suggestion),
    formatted_address: detail?.address || suggestion.description,
    rating: detail?.rating ?? suggestion.rating,
    website: normalizeExternalUrl(detail?.website || suggestion.website || ''),
    googleMapsUrl: normalizeExternalUrl(detail?.googleMapsUrl || suggestion.googleMapsUrl || ''),
    reviews: detail?.reviews || suggestion.reviews || [],
    phone: detail?.phone || suggestion.phone || '',
    source: suggestion.source,
    geometry: suggestion.geometry || (Number.isFinite(lat) && Number.isFinite(lng) ? { location: { lat, lng } } : null),
    mapEmbedUrl: buildMapEmbedUrl({
      name: detail?.name || getSuggestionTitle(suggestion),
      address: detail?.address || suggestion.description,
      geometry: suggestion.geometry || (Number.isFinite(lat) && Number.isFinite(lng) ? { location: { lat, lng } } : null)
    })
  };
}

function getPlaceDetailsById(placeId, fields) {
  return new Promise((resolve, reject) => {
    placesService.getDetails(
      {
        placeId,
        fields,
        sessionToken: autocompleteSessionToken
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
          return;
        }

        reject(new Error(`Google place details failed: ${status}`));
      }
    );
  });
}

function buildFallbackPlace(suggestion) {
  return {
    place_id: suggestion.place_id,
    name: getSuggestionTitle(suggestion),
    formatted_address: suggestion.description,
    rating: suggestion.rating || null,
    website: suggestion.website || '',
    googleMapsUrl: suggestion.googleMapsUrl || '',
    reviews: suggestion.reviews || [],
    geometry: suggestion.geometry || null,
    mapEmbedUrl: buildMapEmbedUrl({
      name: getSuggestionTitle(suggestion),
      address: suggestion.description,
      geometry: suggestion.geometry || null
    })
  };
}

function buildMapEmbedUrl({ name = '', address = '', geometry = null } = {}) {
  const location = geometry?.location;
  const lat = typeof location?.lat === 'function' ? location.lat() : location?.lat;
  const lng = typeof location?.lng === 'function' ? location.lng() : location?.lng;
  const query = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
    ? `${name} ${lat},${lng}`
    : `${name} ${address}`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query.trim())}&z=17&output=embed`;
}

function createLatLngBounds(coordinates, radiusMeters) {
  const bounds = createBoundsLiteral(coordinates, radiusMeters);
  return new window.google.maps.LatLngBounds(
    new window.google.maps.LatLng(bounds.south, bounds.west),
    new window.google.maps.LatLng(bounds.north, bounds.east)
  );
}

function createBoundsLiteral(coordinates, radiusMeters) {
  const latitude = Number(coordinates.latitude);
  const longitude = Number(coordinates.longitude);
  const latDelta = radiusMeters / 111320;
  const lngDelta = radiusMeters / (111320 * Math.cos((latitude * Math.PI) / 180));

  return {
    north: latitude + latDelta,
    south: latitude - latDelta,
    east: longitude + lngDelta,
    west: longitude - lngDelta
  };
}

function getDistanceMetersToLocation(location) {
  if (!userCoordinates.value) return null;

  const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
  const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
  return calculateDistanceMeters(userCoordinates.value.latitude, userCoordinates.value.longitude, lat, lng);
}

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeReviews(reviews = []) {
  return reviews.map((review, index) => ({
    key: `${review.author_name || review.authorName || 'review'}-${index}`,
    author_name: review.author_name || review.authorName || 'Khách hàng',
    rating: review.rating,
    text: typeof review.text === 'object' ? review.text.text || '' : review.text || ''
  }));
}

function getSuggestionTitle(suggestion) {
  return suggestion.structured_formatting?.main_text || suggestion.description?.split(',')[0] || 'Địa điểm';
}

function getSuggestionMeta(suggestion) {
  const parts = [];
  if (suggestion.rating) parts.push(`⭐ ${suggestion.rating}`);
  if (suggestion.website) parts.push(formatWebsite(suggestion.website));
  if (suggestion.distanceMeters) parts.push(`${formatDistance(suggestion.distanceMeters)} từ bạn`);
  return parts.filter(Boolean).join(' · ');
}

function formatWebsite(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function normalizeExternalUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function formatDistance(distanceMeters) {
  const meters = Number(distanceMeters);
  if (!Number.isFinite(meters)) return '';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function getGoogleErrorDetail(error) {
  const message = String(error?.message || error || '');
  const knownStatuses = ['REQUEST_DENIED', 'OVER_QUERY_LIMIT', 'INVALID_REQUEST', 'UNKNOWN_ERROR', 'ZERO_RESULTS'];
  return knownStatuses.find((status) => message.includes(status)) || message;
}

function setLocationValue(value) {
  ignoreNextLocationSearch = true;
  expenseForm.location = value;
}

function clearSelectedPlace() {
  selectedPlace.value = null;
  placeReviews.value = [];
  directionsInfo.value = null;
  clearMapOverlays();
}

function clearMapOverlays() {
  // The mini map is rendered through a lightweight iframe, so there is no JS map instance to clear.
}

function clearLocationSuggestions() {
  locationSuggestions.value = [];
}

function closeLocationSuggestionsSoon() {
  window.clearTimeout(locationBlurTimer);
  locationBlurTimer = window.setTimeout(clearLocationSuggestions, 160);
}

function clearLocationTimers() {
  window.clearTimeout(locationSearchTimer);
  window.clearTimeout(locationBlurTimer);
}

function openLibraryPicker() {
  libraryInput.value?.click();
}

function openCameraPicker() {
  cameraInput.value?.click();
}

function handleImageChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  selectedImage.value = file;
  revokePreviewUrl();
  imagePreview.value = URL.createObjectURL(file);
}

function clearImage() {
  selectedImage.value = null;
  revokePreviewUrl();
  if (libraryInput.value) libraryInput.value.value = '';
  if (cameraInput.value) cameraInput.value.value = '';
}

function revokePreviewUrl() {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value);
    imagePreview.value = '';
  }
}

function resetForm() {
  expenseForm.type = 'expense';
  expenseForm.amount = null;
  expenseForm.category = categories.value[0] || 'Ăn uống';
  expenseForm.date = getCurrentDate();
  expenseForm.time = getCurrentTime();
  expenseForm.note = '';
  expenseForm.location = '';
  expenseForm.friends = '';
  clearLocationSuggestions();
  clearSelectedPlace();
  clearImage();
}

function buildExpenseFormData() {
  const type = normalizeTransactionType(expenseForm.type);
  const title = expenseForm.note || expenseForm.location || `Chi tiêu ${expenseForm.category}`;
  const formData = new FormData();
  formData.append('title', title);
  if (!expenseForm.note && !expenseForm.location && type === 'income') {
    formData.set('title', `Thu vào ${expenseForm.category}`);
  }
  formData.append('type', type);
  formData.append('amount', String(Number(expenseForm.amount || 0)));
  formData.append('category', expenseForm.category);
  formData.append('date', expenseForm.date);
  formData.append('time', expenseForm.time);
  formData.append('note', expenseForm.note);
  formData.append('location', expenseForm.location);
  formData.append('friends', expenseForm.friends);

  if (selectedPlace.value?.place_id) {
    formData.append('placeId', selectedPlace.value.place_id);
  }

  if (userCoordinates.value) {
    formData.append('latitude', String(userCoordinates.value.latitude));
    formData.append('longitude', String(userCoordinates.value.longitude));
  }

  if (selectedImage.value) {
    formData.append('image', selectedImage.value);
  }

  return formData;
}

async function submitExpense() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const errors = validateExpenseData(expenseForm);
    if (errors.length) {
      errorMessage.value = errors[0];
      return;
    }
    await appStore.addExpense(buildExpenseFormData());
    resetForm();
    router.push('/');
  } catch (error) {
    console.error('Add expense failed', error);
    errorMessage.value = error?.message || error?.error || 'Không thể lưu chi tiêu.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.add-expense-screen {
  max-width: 560px;
  margin: 0 auto;
}

.add-header {
  margin-bottom: 18px;
}

.add-header span {
  color: var(--primary-strong);
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
}

.add-header h2 {
  margin: 6px 0 0;
  color: var(--text);
  font-size: 1.55rem;
}

.expense-card {
  display: grid;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: 0 14px 34px rgba(34, 48, 45, 0.08);
}

.amount-field {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f7faf7 0%, #f3f6fb 100%);
  border: 1px solid var(--border);
}

.amount-field span {
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 700;
}

.amount-field input {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  color: var(--text);
  font-size: clamp(1.65rem, 7vw, 2.25rem);
  font-weight: 850;
  line-height: 1.15;
  text-align: right;
}

.amount-field input:focus {
  box-shadow: none;
}

.form-list {
  position: relative;
  overflow: visible;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
}

.form-row {
  display: grid;
  grid-template-columns: 40px 78px minmax(0, 1fr) 16px;
  gap: 8px;
  align-items: center;
  min-height: 60px;
  margin: 0;
  padding: 10px;
  border-bottom: 1px solid var(--border);
}

.form-row:last-child {
  border-bottom: 0;
}

.location-row {
  position: relative;
  z-index: 20;
}

.row-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #f0f7f3;
  border: 1px solid #dce9e1;
  font-size: 1.08rem;
}

.row-label {
  margin: 0;
  color: var(--text);
  font-weight: 800;
}

.row-arrow {
  color: #a3aca8;
  font-size: 1.1rem;
  font-weight: 800;
}

.form-row input,
.form-row select,
.form-row textarea {
  min-width: 0;
  margin: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  color: var(--text);
  text-align: right;
}

.form-row select {
  appearance: none;
}

.form-row textarea {
  min-height: 72px;
  resize: vertical;
}

.form-row input:disabled {
  color: var(--muted);
  opacity: 0.75;
}

.form-row input:focus,
.form-row select:focus,
.form-row textarea:focus {
  box-shadow: none;
}

.form-row-text {
  align-items: start;
}

.form-row-text .row-icon,
.form-row-text .row-label,
.form-row-text .row-arrow {
  margin-top: 8px;
}

.location-input-wrap {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.location-input-wrap input {
  padding-right: 28px;
}

.location-target-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #f7fbf8;
  color: var(--primary-strong);
  font-size: 1.05rem;
  font-weight: 900;
  cursor: pointer;
}

.location-target-btn:disabled {
  cursor: wait;
  opacity: 0.72;
}

.location-inline-spinner {
  position: absolute;
  top: 50%;
  right: 44px;
  width: 14px;
  height: 14px;
  margin-top: -7px;
  border: 2px solid #d7e2dc;
  border-top-color: var(--primary-strong);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #d7e2dc;
  border-top-color: var(--primary-strong);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.location-suggestions {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  left: 0;
  z-index: 50;
  overflow: hidden;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 42px rgba(34, 48, 45, 0.14);
}

.location-suggestion {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 11px 12px;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: #fff;
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.location-suggestion:last-child {
  border-bottom: 0;
}

.location-suggestion:hover {
  background: #f7fbf8;
}

.location-suggestion strong {
  overflow: hidden;
  font-size: 0.92rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-suggestion span,
.location-suggestion small {
  display: -webkit-box;
  overflow: hidden;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.location-suggestion small {
  color: var(--primary-strong);
  font-weight: 800;
}

.place-detail-panel {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid var(--border);
  background: #fbfdfb;
}

.place-detail-loading {
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: center;
  color: var(--muted);
  font-weight: 700;
}

.place-detail-heading {
  display: flex;
  gap: 12px;
  align-items: start;
  justify-content: space-between;
}

.place-detail-heading strong,
.place-detail-heading p {
  display: block;
  margin: 0;
}

.place-detail-heading p {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.35;
}

.place-rating {
  flex: 0 0 auto;
  padding: 6px 8px;
  border-radius: 999px;
  background: #eef7f1;
  color: var(--primary-strong);
  font-size: 0.82rem;
  font-weight: 850;
}

.place-review-list {
  display: grid;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
}

.place-link-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.place-link-row a {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 7px 11px;
  border-radius: 999px;
  background: #eef7f1;
  color: var(--primary-strong);
  font-size: 0.84rem;
  font-weight: 850;
  text-decoration: none;
}

.place-review {
  display: grid;
  gap: 4px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
}

.place-review strong,
.place-review span,
.place-review p {
  margin: 0;
}

.place-review strong {
  color: var(--text);
  font-size: 0.88rem;
}

.place-review span {
  color: var(--primary-strong);
  font-size: 0.82rem;
  font-weight: 800;
}

.place-review p {
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.4;
}

.mini-map {
  width: 100%;
  height: 200px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #eef3ef;
}

.directions-info {
  margin: 0;
  color: var(--primary-strong);
  font-size: 0.9rem;
  font-weight: 850;
}

.attachment-panel {
  display: grid;
  gap: 14px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fbfdfb;
}

.attachment-heading {
  display: flex;
  gap: 12px;
  align-items: center;
}

.attachment-heading strong,
.attachment-heading p {
  display: block;
  margin: 0;
}

.attachment-heading p {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.9rem;
}

.attachment-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.attachment-btn {
  min-height: 46px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
  color: var(--primary-strong);
  font-weight: 800;
  cursor: pointer;
}

.hidden-file-input {
  display: none;
}

.image-preview {
  display: grid;
  gap: 10px;
}

.image-preview img {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.remove-image-btn {
  width: fit-content;
  border: 0;
  background: transparent;
  color: var(--danger);
  font-weight: 800;
  cursor: pointer;
}

.save-expense-btn {
  width: 100%;
  min-height: 52px;
  margin-top: 0;
  font-weight: 850;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 520px) {
  .expense-card {
    padding: 14px;
  }

  .form-row {
    grid-template-columns: 38px 66px minmax(0, 1fr) 14px;
    gap: 8px;
  }

  .place-detail-heading {
    display: grid;
  }

  .place-rating {
    width: fit-content;
  }

  .attachment-actions {
    grid-template-columns: 1fr;
  }
}
</style>
