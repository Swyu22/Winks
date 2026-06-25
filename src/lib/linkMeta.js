import {
  DEFAULT_BOARDS,
  DEFAULT_CLASSIFICATIONS,
  DEFAULT_TAGS,
  LINK_META_PREFIX,
} from './constants.js';

// Keep this transport contract in sync with docs/10-spec/data-model.md.
// Favicon sources LinkCard tries before the branded letter-avatar fallback:
//   [0] Google faviconV2 — resolves the site's DECLARED icon (<link rel=icon>, incl. SVG and
//       cache-busted query paths) and falls back to /favicon.ico. Far better coverage than the
//       old s2 endpoint, and a CDN that responds fast instead of hanging like some origins'
//       own /favicon.ico. A miss returns a tiny (16px) placeholder — LinkCard's onLoad
//       heuristic detects that and drops straight to the letter avatar.
//   [1] Direct /favicon.ico — a resilience fallback reached only if faviconV2 fails to LOAD
//       (e.g. gstatic unreachable), not on a placeholder miss, so a hanging origin can't stall
//       the common path.
export const getFaviconCandidates = (url) => {
  try {
    const { origin } = new URL(url);
    return [
      `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url=${encodeURIComponent(origin)}`,
      `${origin}/favicon.ico`,
    ];
  } catch {
    return [];
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
    clicks: Number(link.clicks) || 0,
  };
};

// 未分类 always sorts to the end of the classification list (sidebar + modal); other
// classifications keep their existing order. Centralizes the "未分类 置底" rule so it
// holds for both fetch-built options and in-session additions.
export const sortClassificationsUncategorizedLast = (classifications = []) => {
  const uncategorized = DEFAULT_CLASSIFICATIONS[0];
  const others = classifications.filter((c) => c !== uncategorized);
  return classifications.includes(uncategorized) ? [...others, uncategorized] : others;
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
