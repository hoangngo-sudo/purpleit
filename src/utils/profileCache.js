const cache = new Map();
const MAX_SIZE = 20;

export function getProfileTab(userId, tab) {
  return cache.get(`${userId}:${tab}`);
}

export function setProfileTab(userId, tab, data) {
  if (cache.size >= MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(`${userId}:${tab}`, { ...data, cachedAt: Date.now() });
}

export function clearAllProfileCache() {
  cache.clear();
}
