import {
  DEFAULT_BOARDS,
  DEFAULT_CLASSIFICATIONS,
  DEFAULT_TAGS,
  LINK_META_PREFIX,
} from './constants.js';

// Keep this transport contract in sync with docs/10-spec/data-model.md.
export const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
};

// Defense-in-depth at the anchor render sink: only http(s) hrefs are allowed, so a non-http(s)
// value that ever reaches the frontend (the Supabase url CHECK lives in a separately-managed
// project) cannot execute as a javascript:/data: URL. Legitimate http(s) links pass through.
export const toSafeHref = (url) => {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:' ? url : '#';
  } catch {
    return '#';
  }
};

export const normalizeName = (value) => String(value || '').trim().replace(/^#+\s*/, '').trim();

export const normalizeTag = (value) => normalizeName(value);

export const parseTags = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((tag) => {
      const normalizedTag = normalizeTag(String(tag));
      return normalizedTag ? [normalizedTag] : [];
    });
  }

  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(/[,\uFF0C]+/)
    .flatMap((tag) => {
      const normalizedTag = normalizeTag(tag);
      return normalizedTag ? [normalizedTag] : [];
    });
};

export const uniqueTags = (tags = []) =>
  Array.from(new Set(tags.flatMap((tag) => {
    const normalizedTag = normalizeTag(tag);
    return normalizedTag ? [normalizedTag] : [];
  })));

export const uniqueClassifications = (items = []) =>
  Array.from(new Set(items.flatMap((item) => {
    const normalizedName = normalizeName(item);
    return normalizedName ? [normalizedName] : [];
  })));

export const formatTag = (tag) => `#${tag}`;

export const isKnownBoard = (value) => DEFAULT_BOARDS.includes(value);

export const createDefaultBoardOptions = () =>
  Object.fromEntries(
    DEFAULT_BOARDS.map((board) => [
      board,
      {
        tags: [...DEFAULT_TAGS],
        classifications: [...DEFAULT_CLASSIFICATIONS],
      },
    ]),
  );

export const encodeLinkMeta = (classification, tags, board = DEFAULT_BOARDS[0]) => {
  const normalizedBoard = normalizeName(board);

  return `${LINK_META_PREFIX}${JSON.stringify({
    classification: normalizeName(classification) || DEFAULT_CLASSIFICATIONS[0],
    tags: uniqueTags(tags),
    board: isKnownBoard(normalizedBoard) ? normalizedBoard : DEFAULT_BOARDS[0],
  })}`;
};

export const decodeLinkMeta = (rawValue) => {
  if (typeof rawValue !== 'string' || !rawValue.startsWith(LINK_META_PREFIX)) {
    return null;
  }

  try {
    return JSON.parse(rawValue.slice(LINK_META_PREFIX.length));
  } catch {
    return null;
  }
};

export const hydrateLink = (link) => {
  const metadata = decodeLinkMeta(link.category);
  const rawCategory = normalizeName(link.category);
  const looksLikeTagList = typeof link.category === 'string' && /[,\uFF0C]/.test(link.category);
  const rawBoard = normalizeName(metadata?.board);
  const legacyTags = uniqueTags(parseTags(link.tags ?? link.category));
  const metadataTags = uniqueTags(metadata?.tags || legacyTags);
  const tags = metadataTags.length > 0 ? metadataTags : [DEFAULT_TAGS[0]];
  const categoryFromLegacy = !metadata && rawCategory && !looksLikeTagList;
  const classification =
    normalizeName(metadata?.classification) ||
    (categoryFromLegacy ? rawCategory : DEFAULT_CLASSIFICATIONS[0]);
  const board = isKnownBoard(rawBoard) ? rawBoard : DEFAULT_BOARDS[0];

  return {
    ...link,
    tags,
    category: classification,
    board,
  };
};

const collectTagsFromLinks = (items) => {
  const allTags = items.flatMap((item) => item.tags || []);
  const normalizedTags = uniqueTags(allTags);
  return normalizedTags.length > 0 ? normalizedTags : DEFAULT_TAGS;
};

const collectClassificationsFromLinks = (items) => {
  const normalizedClassifications = uniqueClassifications(items.map((item) => item.category));
  if (normalizedClassifications.length === 0) {
    return DEFAULT_CLASSIFICATIONS;
  }

  return uniqueClassifications([DEFAULT_CLASSIFICATIONS[0], ...normalizedClassifications]);
};

export const buildBoardOptionsFromLinks = (items) => {
  const next = createDefaultBoardOptions();

  for (const board of DEFAULT_BOARDS) {
    const boardLinks = items.filter((item) => item.board === board);
    next[board] = {
      tags: collectTagsFromLinks(boardLinks),
      classifications: collectClassificationsFromLinks(boardLinks),
    };
  }

  return next;
};
