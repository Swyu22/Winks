import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_BOARDS, DEFAULT_CLASSIFICATIONS, DEFAULT_TAGS, LINK_META_PREFIX } from './constants.js';
import {
  buildBoardOptionsFromLinks,
  decodeLinkMeta,
  encodeLinkMeta,
  formatTag,
  getFaviconUrl,
  hydrateLink,
  normalizeName,
  parseTags,
  uniqueTags,
} from './linkMeta.js';

test('normalizes names, tags, and display labels', () => {
  assert.equal(normalizeName('  ##设计  '), '设计');
  assert.deepEqual(parseTags('设计, #开发，工具'), ['设计', '开发', '工具']);
  assert.deepEqual(uniqueTags(['设计', '#设计', ' 开发 ']), ['设计', '开发']);
  assert.equal(formatTag('设计'), '#设计');
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
  assert.equal(getFaviconUrl('not a url'), null);
  assert.equal(getFaviconUrl('https://example.com/path'), 'https://www.google.com/s2/favicons?domain=example.com&sz=64');
});
