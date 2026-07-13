import assert from 'node:assert/strict';
import test from 'node:test';

import { LINKS_CACHE_KEY } from './constants.js';
import { readLinksCache, writeLinksCache } from './linksCache.js';

const createStorage = (initialValue = null) => {
  let value = initialValue;
  return {
    getItem: () => value,
    setItem: (_key, nextValue) => {
      value = nextValue;
    },
  };
};

test('distinguishes a cached empty list from a missing cache entry', () => {
  const missingStorage = createStorage();
  const emptyStorage = createStorage('[]');

  assert.equal(readLinksCache(missingStorage), null);
  assert.deepEqual(readLinksCache(emptyStorage), []);
});

test('uses the v2 cache namespace for the description-aware Link shape', () => {
  assert.equal(LINKS_CACHE_KEY, 'winks:links:v2');
});

test('writes an empty list so stale links cannot reappear', () => {
  const storage = createStorage('[{"id":"stale","category":"开发"}]');

  assert.equal(writeLinksCache(storage, []), true);
  assert.deepEqual(readLinksCache(storage), []);
});

test('hydrates cached links and treats invalid payloads as a cache miss', () => {
  const storage = createStorage('[{"id":"1","category":"开发","clicks":-1,"description":"  简介  "}]');
  const invalidStorage = createStorage('{invalid');

  assert.equal(readLinksCache(storage)[0].clicks, 0);
  assert.equal(readLinksCache(storage)[0].description, '简介');
  assert.equal(readLinksCache(invalidStorage), null);
});
