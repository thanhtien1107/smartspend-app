const CACHE_PREFIX = 'smartspend-cache:v1:';
const DEFAULT_TTL = 5 * 60 * 1000;
const DEFAULT_STALE_TTL = 60 * 60 * 1000;
const inFlightRequests = new Map();

function now() {
  return Date.now();
}

function canUseStorage() {
  return typeof localStorage !== 'undefined';
}

function toStorageKey(key) {
  return `${CACHE_PREFIX}${String(key)}`;
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

export function createCacheKey(...parts) {
  return parts
    .map((part) => {
      if (part === null || part === undefined) return '';
      return typeof part === 'object' ? stableStringify(part) : String(part);
    })
    .join(':')
    .replace(/\s+/g, ' ')
    .trim();
}

function readEntry(key) {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(toStorageKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    localStorage.removeItem(toStorageKey(key));
    return null;
  }
}

export function getCachedData(key, options = {}) {
  const entry = readEntry(key);
  if (!entry) return null;

  const timestamp = now();
  const isFresh = Number(entry.expiresAt || 0) > timestamp;
  const allowExpired = Boolean(options.allowExpired);
  const isUsableStale = Number(entry.staleUntil || 0) > timestamp;

  if (isFresh || (allowExpired && isUsableStale)) {
    return entry.data;
  }

  return null;
}

export function setCachedData(key, data, options = {}) {
  if (!canUseStorage()) return data;

  const ttl = Number(options.ttl ?? DEFAULT_TTL);
  const staleTtl = Number(options.staleTtl ?? DEFAULT_STALE_TTL);
  const entry = {
    data,
    createdAt: now(),
    expiresAt: now() + ttl,
    staleUntil: now() + Math.max(ttl, staleTtl)
  };

  try {
    localStorage.setItem(toStorageKey(key), JSON.stringify(entry));
  } catch (error) {
    // Storage quota should not break the app. Drop older SmartSpend entries once.
    clearCacheByPrefix('');
    try {
      localStorage.setItem(toStorageKey(key), JSON.stringify(entry));
    } catch (_) {
      // Ignore cache write failures.
    }
  }

  return data;
}

export function clearCacheByPrefix(prefix) {
  if (!canUseStorage()) return;

  const storagePrefix = toStorageKey(prefix);
  const keys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(storagePrefix)) {
      keys.push(key);
    }
  }

  keys.forEach((key) => localStorage.removeItem(key));
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getErrorStatus(error) {
  return Number(error?.status || error?.response?.status || error?.statusCode || 0);
}

export async function fetchWithCache(key, fetcher, options = {}) {
  const {
    ttl = DEFAULT_TTL,
    staleTtl = DEFAULT_STALE_TTL,
    forceRefresh = false,
    retryOn429 = true,
    retryDelay = 2500
  } = options;

  if (!forceRefresh) {
    const cached = getCachedData(key);
    if (cached !== null) return cached;
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const stale = getCachedData(key, { allowExpired: true });
  const request = (async () => {
    try {
      const data = await fetcher();
      setCachedData(key, data, { ttl, staleTtl });
      return data;
    } catch (error) {
      if (retryOn429 && getErrorStatus(error) === 429) {
        await wait(retryDelay);
        try {
          const data = await fetcher();
          setCachedData(key, data, { ttl, staleTtl });
          return data;
        } catch (retryError) {
          if (stale !== null) return stale;
          throw retryError;
        }
      }

      if (stale !== null) return stale;
      throw error;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, request);
  return request;
}
