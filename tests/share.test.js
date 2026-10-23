const { test } = require('node:test');
const assert = require('node:assert/strict');
const Share = require('../site/share.js');

test('scenario URL codec round-trips all supported setup fields', () => {
  const selection = { scenario: 'backfill', policy: 'fifo', placement: 'tight', ticks: 12 };
  const query = Share.encode(selection);
  assert.equal(query, 'v=1&scenario=backfill&policy=fifo&placement=tight&ticks=12');
  assert.deepEqual(Share.decode(`?${query}`), { config: selection });
  assert.equal(Share.makeURL('https://example.com/SchedLab/?old=1#top', selection),
    `https://example.com/SchedLab/?${query}#playground`);
});

test('decode ignores unrelated query strings and rejects invalid or repeated inputs', () => {
  assert.equal(Share.decode(''), null);
  assert.equal(Share.decode('?ref=linked-in'), null);
  const valid = Share.encode({ scenario: 'empty', policy: 'backfill', placement: 'first', ticks: 8 });
  assert.match(Share.decode(`?${valid}&policy=fifo`).error, /repeated/);
  assert.match(Share.decode(`?${valid.replace('v=1', 'v=2')}`).error, /version/);
  assert.match(Share.decode(`?${valid.replace('ticks=8', 'ticks=100000')}`).error, /unrecognized/);
  assert.match(Share.decode(`?${valid.replace('scenario=empty', 'scenario=<script>')}`).error, /unrecognized/);
  assert.match(Share.decode(`?${valid.replace('&policy=backfill', '')}`).error, /incomplete/);
  assert.match(Share.decode(`?${'x'.repeat(1001)}`).error, /too long/);
});

test('share links do not serialize the live simulation or arbitrary job data', () => {
  const selection = { scenario: 'fragmentation', policy: 'backfill', placement: 'first', ticks: 4,
    running: [{ name: 'a private workload' }], time: 53, token: 'secret' };
  const query = Share.encode(selection);
  assert.equal(query.includes('private'), false);
  assert.equal(query.includes('secret'), false);
  assert.equal(query.includes('time'), false);
  assert.deepEqual(Object.keys(Share.decode(query).config), ['scenario', 'policy', 'placement', 'ticks']);
  assert.throws(() => Share.encode({ ...selection, ticks: 99 }), RangeError);
});
