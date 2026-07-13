import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_BOARDS, DEFAULT_CLASSIFICATIONS, DEFAULT_TAGS, LINK_META_PREFIX } from './constants.js';
import {
  buildBoardOptionsFromLinks,
  decodeLinkMeta,
  encodeLinkMeta,
  formatTag,
  getFaviconCandidates,
  hydrateLink,
  normalizeDescription,
  normalizeName,
  parseTags,
  sortClassificationsUncategorizedLast,
  toSafeHref,
  uniqueTags,
} from './linkMeta.js';

test('normalizes names, tags, and display labels', () => {
  assert.equal(normalizeName('  ##设计  '), '设计');
  assert.deepEqual(parseTags('设计, #开发，工具'), ['设计', '开发', '工具']);
  assert.deepEqual(uniqueTags(['设计', '#设计', ' 开发 ']), ['设计', '开发']);
  assert.equal(formatTag('设计'), '#设计');
});

test('normalizes descriptions to a trimmed 15-character display value', () => {
  assert.equal(normalizeDescription('  AI图像工具  '), 'AI图像工具');
  assert.equal(normalizeDescription(null), '');
  assert.equal(normalizeDescription('1234567890123456'), '123456789012345');
  assert.equal(Array.from(normalizeDescription('😀'.repeat(16))).length, 15);
});

test('encodes metadata into the category transport field', () => {
  const encoded = encodeLinkMeta('  #分类 ', ['#设计', '设计', '工具'], '未知看板');

  assert.equal(encoded.startsWith(LINK_META_PREFIX), true);
  assert.deepEqual(decodeLinkMeta(encoded), {
    classification: '分类',
    tags: ['设计', '工具'],
    board: DEFAULT_BOARDS[0],
  });
});

test('hydrates metadata payloads into the frontend link shape', () => {
  const link = hydrateLink({
    id: '1',
    title: 'Example',
    url: 'https://example.com',
    category: encodeLinkMeta('页面分类', ['阅读'], '页面'),
  });

  assert.equal(link.category, '页面分类');
  assert.deepEqual(link.tags, ['阅读']);
  assert.equal(link.board, '页面');
  assert.equal(link.description, '');
});

test('hydrates nullable descriptions into the normalized frontend shape', () => {
  assert.equal(hydrateLink({ id: '1', category: '开发', description: null }).description, '');
  assert.equal(hydrateLink({ id: '2', category: '开发', description: '  一句话简介  ' }).description, '一句话简介');
});

test('keeps legacy category values compatible', () => {
  const categoryOnly = hydrateLink({ id: '1', category: '开发' });
  const commaTags = hydrateLink({ id: '2', category: '设计, 工具' });

  assert.equal(categoryOnly.category, '开发');
  assert.deepEqual(categoryOnly.tags, ['开发']);
  assert.equal(categoryOnly.board, DEFAULT_BOARDS[0]);

  assert.equal(commaTags.category, DEFAULT_CLASSIFICATIONS[0]);
  assert.deepEqual(commaTags.tags, ['设计', '工具']);
});

test('builds board-local tag and classification options', () => {
  const options = buildBoardOptionsFromLinks([
    { board: '网站', tags: ['开发'], category: '工具' },
    { board: '页面', tags: ['阅读'], category: '文章' },
  ]);

  assert.deepEqual(options['网站'].tags, ['开发']);
  assert.deepEqual(options['网站'].classifications, ['未分类', '工具']);
  assert.deepEqual(options['页面'].tags, ['阅读']);
  assert.deepEqual(options['页面'].classifications, ['未分类', '文章']);
});

test('falls back to defaults for empty derived options and invalid favicons', () => {
  assert.deepEqual(buildBoardOptionsFromLinks([])['网站'].tags, DEFAULT_TAGS);
  assert.deepEqual(getFaviconCandidates('not a url'), []);
  assert.deepEqual(
    getFaviconCandidates('https://example.com/path').map((c) => c.url),
    [
      'https://example.com/icon.svg',
      'https://example.com/favicon.ico',
      'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url=https%3A%2F%2Fexample.com',
    ],
  );
});

test('hydrateLink carries a numeric clicks counter (defaulting to 0)', () => {
  assert.equal(hydrateLink({ id: '1', category: '开发' }).clicks, 0);
  assert.equal(hydrateLink({ id: '2', category: '开发', clicks: 7 }).clicks, 7);
  assert.equal(hydrateLink({ id: '3', category: '开发', clicks: '12' }).clicks, 12);
  assert.equal(hydrateLink({ id: '4', category: '开发', clicks: null }).clicks, 0);
  assert.equal(hydrateLink({ id: '5', category: '开发', clicks: -3 }).clicks, 0);
  assert.equal(hydrateLink({ id: '6', category: '开发', clicks: Number.POSITIVE_INFINITY }).clicks, 0);
  assert.equal(hydrateLink({ id: '7', category: '开发', clicks: '4.9' }).clicks, 4);
});

test('sortClassificationsUncategorizedLast moves 未分类 to the end', () => {
  assert.deepEqual(
    sortClassificationsUncategorizedLast([DEFAULT_CLASSIFICATIONS[0], '工具', '设计']),
    ['工具', '设计', DEFAULT_CLASSIFICATIONS[0]],
  );
  assert.deepEqual(sortClassificationsUncategorizedLast(['工具', '设计']), ['工具', '设计']);
  assert.deepEqual(sortClassificationsUncategorizedLast([]), []);
});

test('toSafeHref allows only http(s) URLs and neutralizes other schemes', () => {
  assert.equal(toSafeHref('https://example.com'), 'https://example.com');
  assert.equal(toSafeHref('http://example.com'), 'http://example.com');
  assert.equal(toSafeHref('javascript:alert(1)'), '#');
  assert.equal(toSafeHref('data:text/html,<script>alert(1)</script>'), '#');
  assert.equal(toSafeHref('not a url'), '#');
});
