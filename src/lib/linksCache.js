import { LINKS_CACHE_KEY } from './constants.js';
import { hydrateLink } from './linkMeta.js';

export const readLinksCache = (storage) => {
  if (!storage) return null;

  try {
    const rawValue = storage.getItem(LINKS_CACHE_KEY);
    if (rawValue === null) return null;

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return null;
    return parsed.map(hydrateLink);
  } catch {
    return null;
  }
};

export const writeLinksCache = (storage, links) => {
  if (!storage || !Array.isArray(links)) return false;

  try {
    storage.setItem(LINKS_CACHE_KEY, JSON.stringify(links));
    return true;
  } catch {
    return false;
  }
};
