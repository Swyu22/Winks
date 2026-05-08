import { uniqueClassifications, uniqueTags, normalizeName, parseTags, encodeLinkMeta } from './linkMeta.js';
import { DEFAULT_CLASSIFICATIONS, DEFAULT_TAGS } from './constants.js';

export const getBoardOption = (options, board) =>
  options[board] || { tags: DEFAULT_TAGS, classifications: DEFAULT_CLASSIFICATIONS };

export const withBoardValues = (options, board, { tags = [], classifications = [] }) => {
  const current = getBoardOption(options, board);
  const nextTags = tags.length > 0 ? uniqueTags([...current.tags, ...tags]) : current.tags;
  const nextClassifications =
    classifications.length > 0
      ? uniqueClassifications([...current.classifications, ...classifications])
      : current.classifications;
  if (nextTags === current.tags && nextClassifications === current.classifications) {
    return options;
  }
  return {
    ...options,
    [board]: { ...current, tags: nextTags, classifications: nextClassifications },
  };
};

const replaceLinkTag = (link, tag, fallback) => {
  const nextTags = link.tags.filter((t) => t !== tag);
  return { ...link, tags: nextTags.length > 0 ? nextTags : [fallback] };
};

export const applyTagDeleteLocally = (links, boardOptions, activeBoard, tag, fallback, editingLink) => {
  const nextLinks = links.map((link) =>
    link.board === activeBoard && link.tags.includes(tag) ? replaceLinkTag(link, tag, fallback) : link,
  );
  const current = getBoardOption(boardOptions, activeBoard);
  const nextBoardOptions = {
    ...boardOptions,
    [activeBoard]: { ...current, tags: current.tags.filter((t) => t !== tag) },
  };
  const nextEditingLink =
    editingLink?.board === activeBoard && editingLink.tags.includes(tag)
      ? replaceLinkTag(editingLink, tag, fallback)
      : editingLink;
  return { nextLinks, nextBoardOptions, nextEditingLink };
};

export const applyClassificationDeleteLocally = (
  links,
  boardOptions,
  activeBoard,
  classification,
  fallback,
  editingLink,
) => {
  const nextLinks = links.map((link) =>
    link.board === activeBoard && link.category === classification
      ? { ...link, category: fallback }
      : link,
  );
  const current = getBoardOption(boardOptions, activeBoard);
  const nextBoardOptions = {
    ...boardOptions,
    [activeBoard]: {
      ...current,
      classifications: current.classifications.filter((c) => c !== classification),
    },
  };
  const nextEditingLink =
    editingLink?.board === activeBoard && editingLink.category === classification
      ? { ...editingLink, category: fallback }
      : editingLink;
  return { nextLinks, nextBoardOptions, nextEditingLink };
};

export const normalizeSaveLinkData = (linkData, editingLink, activeBoard, activeTags, activeClassifications) => {
  const normalizedTags = uniqueTags(parseTags(linkData.tags));
  const safeTags = normalizedTags.length > 0 ? normalizedTags : [activeTags[0] || DEFAULT_TAGS[0]];
  const safeClassification =
    normalizeName(linkData.category) || activeClassifications[0] || DEFAULT_CLASSIFICATIONS[0];
  const safeBoard = editingLink?.board || activeBoard;
  const normalizedLinkData = { ...linkData, tags: safeTags, category: safeClassification, board: safeBoard };
  const dbPayload = {
    title: normalizedLinkData.title,
    url: normalizedLinkData.url,
    category: encodeLinkMeta(safeClassification, safeTags, safeBoard),
  };
  return { normalizedLinkData, dbPayload };
};
