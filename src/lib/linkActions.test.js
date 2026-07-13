import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyClassificationDeleteLocally,
  applyTagDeleteLocally,
  normalizeSaveLinkData,
} from './linkActions.js';
import { DEFAULT_BOARDS, DEFAULT_CLASSIFICATIONS, DEFAULT_TAGS } from './constants.js';

const BOARD = DEFAULT_BOARDS[0];
const OTHER_BOARD = DEFAULT_BOARDS[1];

const makeLink = (overrides) => ({
  id: 1,
  title: 'Test',
  url: 'https://test.com',
  board: BOARD,
  tags: ['tag-a'],
  category: 'class-a',
  ...overrides,
});

const makeBoardOptions = (tags = DEFAULT_TAGS, classifications = DEFAULT_CLASSIFICATIONS) => ({
  [BOARD]: { tags, classifications },
  [OTHER_BOARD]: { tags: DEFAULT_TAGS, classifications: DEFAULT_CLASSIFICATIONS },
});

describe('applyTagDeleteLocally', () => {
  it('removes tag from affected links and board options', () => {
    const links = [
      makeLink({ id: 1, tags: ['tag-a', 'tag-b'] }),
      makeLink({ id: 2, tags: ['tag-a'] }),
      makeLink({ id: 3, board: OTHER_BOARD, tags: ['tag-a'] }),
    ];
    const { nextLinks, nextBoardOptions } = applyTagDeleteLocally(
      links,
      makeBoardOptions(['tag-a', 'tag-b']),
      BOARD,
      'tag-a',
      'tag-b',
      null,
    );
    assert.deepEqual(nextLinks[0].tags, ['tag-b']);
    assert.deepEqual(nextLinks[1].tags, ['tag-b']); // fallback applied when only tag
    assert.deepEqual(nextLinks[2].tags, ['tag-a']); // other board untouched
    assert.deepEqual(nextBoardOptions[BOARD].tags, ['tag-b']);
  });

  it('updates editingLink when it contains the deleted tag', () => {
    const editing = makeLink({ tags: ['tag-a', 'tag-b'] });
    const { nextEditingLink } = applyTagDeleteLocally(
      [],
      makeBoardOptions(['tag-a', 'tag-b']),
      BOARD,
      'tag-a',
      'tag-b',
      editing,
    );
    assert.deepEqual(nextEditingLink.tags, ['tag-b']);
  });

  it('leaves editingLink unchanged when on a different board', () => {
    const editing = makeLink({ board: OTHER_BOARD, tags: ['tag-a'] });
    const { nextEditingLink } = applyTagDeleteLocally(
      [],
      makeBoardOptions(['tag-a', 'tag-b']),
      BOARD,
      'tag-a',
      'tag-b',
      editing,
    );
    assert.equal(nextEditingLink, editing);
  });
});

describe('applyClassificationDeleteLocally', () => {
  it('replaces classification in affected links and board options', () => {
    const links = [
      makeLink({ id: 1, category: 'class-a' }),
      makeLink({ id: 2, category: 'class-b' }),
      makeLink({ id: 3, board: OTHER_BOARD, category: 'class-a' }),
    ];
    const { nextLinks, nextBoardOptions } = applyClassificationDeleteLocally(
      links,
      makeBoardOptions(DEFAULT_TAGS, ['class-a', 'class-b']),
      BOARD,
      'class-a',
      'class-b',
      null,
    );
    assert.equal(nextLinks[0].category, 'class-b');
    assert.equal(nextLinks[1].category, 'class-b');
    assert.equal(nextLinks[2].category, 'class-a'); // other board untouched
    assert.deepEqual(nextBoardOptions[BOARD].classifications, ['class-b']);
  });

  it('updates editingLink when it has the deleted classification', () => {
    const editing = makeLink({ category: 'class-a' });
    const { nextEditingLink } = applyClassificationDeleteLocally(
      [],
      makeBoardOptions(DEFAULT_TAGS, ['class-a', 'class-b']),
      BOARD,
      'class-a',
      'class-b',
      editing,
    );
    assert.equal(nextEditingLink.category, 'class-b');
  });

  it('leaves editingLink unchanged when on a different board', () => {
    const editing = makeLink({ board: OTHER_BOARD, category: 'class-a' });
    const { nextEditingLink } = applyClassificationDeleteLocally(
      [],
      makeBoardOptions(DEFAULT_TAGS, ['class-a', 'class-b']),
      BOARD,
      'class-a',
      'class-b',
      editing,
    );
    assert.equal(nextEditingLink, editing);
  });
});

describe('normalizeSaveLinkData', () => {
  it('deduplicates tags and returns encoded dbPayload', () => {
    const linkData = {
      title: 'T',
      url: 'https://t.com',
      description: '  一句话简介  ',
      tags: ['开发', '开发'],
      category: '设计',
    };
    const { normalizedLinkData, dbPayload } = normalizeSaveLinkData(
      linkData,
      null,
      BOARD,
      ['开发'],
      ['设计'],
    );
    assert.deepEqual(normalizedLinkData.tags, ['开发']);
    assert.equal(normalizedLinkData.board, BOARD);
    assert.equal(normalizedLinkData.category, '设计');
    assert.equal(normalizedLinkData.description, '一句话简介');
    assert.equal(dbPayload.description, '一句话简介');
    assert.ok(typeof dbPayload.category === 'string');
  });

  it('stores an omitted or blank description as null', () => {
    const linkData = { title: 'T', url: 'https://t.com', description: '   ', tags: ['开发'], category: '设计' };
    const { normalizedLinkData, dbPayload } = normalizeSaveLinkData(
      linkData,
      null,
      BOARD,
      ['开发'],
      ['设计'],
    );

    assert.equal(normalizedLinkData.description, '');
    assert.equal(dbPayload.description, null);
  });

  it('falls back to activeTags[0] when no valid tags provided', () => {
    const linkData = { title: 'T', url: 'https://t.com', tags: [], category: '设计' };
    const { normalizedLinkData } = normalizeSaveLinkData(linkData, null, BOARD, ['fallback'], ['设计']);
    assert.deepEqual(normalizedLinkData.tags, ['fallback']);
  });

  it('uses editingLink.board over activeBoard', () => {
    const linkData = { title: 'T', url: 'https://t.com', tags: ['开发'], category: '设计' };
    const editing = makeLink({ board: OTHER_BOARD });
    const { normalizedLinkData } = normalizeSaveLinkData(
      linkData,
      editing,
      BOARD,
      ['开发'],
      ['设计'],
    );
    assert.equal(normalizedLinkData.board, OTHER_BOARD);
  });
});
