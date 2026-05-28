const externalApiCache = new Map();

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function createServerCacheKey(...parts) {
  return parts.map((part) => (part && typeof part === 'object' ? stableStringify(part) : String(part ?? ''))).join(':');
}

function getMemoryCacheEntry(key, { allowExpired = false } = {}) {
  const entry = externalApiCache.get(key);
  if (!entry) return null;

  const timestamp = Date.now();
  if (entry.expiresAt > timestamp || (allowExpired && entry.staleUntil > timestamp)) {
    return entry.data;
  }

  if (entry.staleUntil <= timestamp) {
    externalApiCache.delete(key);
  }
  return null;
}

function setMemoryCacheEntry(key, data, { ttl = 10 * 60 * 1000, staleTtl = 24 * 60 * 60 * 1000 } = {}) {
  externalApiCache.set(key, {
    data,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttl,
    staleUntil: Date.now() + Math.max(ttl, staleTtl)
  });
  return data;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithServerCache(key, fetcher, options = {}) {
  const cached = getMemoryCacheEntry(key);
  if (cached !== null) return cached;

  const stale = getMemoryCacheEntry(key, { allowExpired: true });
  const retryDelay = Number(options.retryDelay || 2500);

  try {
    const data = await fetcher();
    return setMemoryCacheEntry(key, data, options);
  } catch (error) {
    if (Number(error.status || error.statusCode || 0) === 429) {
      await wait(retryDelay);
      try {
        const data = await fetcher();
        return setMemoryCacheEntry(key, data, options);
      } catch (retryError) {
        if (stale !== null) return stale;
        throw retryError;
      }
    }

    if (stale !== null) return stale;
    throw error;
  }
}

module.exports = {
  createServerCacheKey,
  fetchWithServerCache,
  getMemoryCacheEntry,
  setMemoryCacheEntry
};
