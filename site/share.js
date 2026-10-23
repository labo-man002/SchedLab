/*
 * SchedLab share links: versioned configurations for the built-in presets.
 * The URL never includes a live queue snapshot or user-entered job data.
 */
(function (root, factory) {
  const codec = factory();
  if (typeof module === 'object' && module.exports) module.exports = codec;
  if (root) root.SchedLabShare = codec;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const OPTIONS = Object.freeze({
    scenario: ['fragmentation', 'backfill', 'empty'],
    policy: ['fifo', 'backfill'],
    placement: ['first', 'tight'],
    ticks: ['4', '8', '12'],
  });

  function normalize(config) {
    if (!config || typeof config !== 'object') throw new TypeError('A shareable selection is required.');
    const result = {};
    for (const [key, choices] of Object.entries(OPTIONS)) {
      const value = String(config[key]);
      if (!choices.includes(value)) throw new RangeError(`Invalid ${key} in scenario link.`);
      result[key] = key === 'ticks' ? Number(value) : value;
    }
    return result;
  }

  function encode(config) {
    const selected = normalize(config);
    const query = new URLSearchParams();
    query.set('v', '1');
    Object.keys(OPTIONS).forEach((key) => query.set(key, String(selected[key])));
    return query.toString();
  }

  function decode(search) {
    if (typeof search !== 'string' || search.length > 1000) return { error: 'Scenario URL is too long or invalid.' };
    const query = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    if (!['v', ...Object.keys(OPTIONS)].some((key) => query.has(key))) return null;
    for (const key of ['v', ...Object.keys(OPTIONS)]) {
      if (query.getAll(key).length !== 1) return { error: 'Scenario link is incomplete or contains repeated settings.' };
    }
    if (query.get('v') !== '1') return { error: 'This scenario link uses an unsupported version.' };
    try {
      return { config: normalize(Object.fromEntries(Object.keys(OPTIONS).map((key) => [key, query.get(key)]))) };
    } catch (_) {
      return { error: 'Scenario link contains an unrecognized setting.' };
    }
  }

  function makeURL(base, config) {
    const url = new URL(base);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new RangeError('Web URL required.');
    url.search = encode(config);
    url.hash = 'playground';
    return url.toString();
  }

  return { OPTIONS, normalize, encode, decode, makeURL };
});
