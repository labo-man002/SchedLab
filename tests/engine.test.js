const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../site/engine.js');

function jobIds(jobs) { return jobs.map((job) => job.id); }

test('fragmentation: total free capacity does not imply a valid allocation', () => {
  const s = Engine.createState('fragmentation');
  assert.equal(Engine.metrics(s).free, 16);
  assert.equal(Engine.metrics(s).largest, 2);
  assert.equal(s.queued[0].size, 4);
  assert.equal(Engine.findPlacement(s, 4), null);
  assert.equal(Engine.dispatchJobs(s), 0);
  assert.equal(s.queued.length, 4);
});

test('opportunistic backfill dispatches eligible tail jobs while keeping a blocked head', () => {
  const s = Engine.createState('fragmentation', 'backfill');
  assert.equal(Engine.dispatchJobs(s), 3);
  assert.deepEqual(jobIds(s.queued), ['J09']);
  assert.deepEqual(jobIds(s.running.slice(8)), ['J10', 'J11', 'J12']);
  assert.equal(Engine.metrics(s).free, 11);
});

test('reset always reconstructs identical initial allocations and queue', () => {
  const s = Engine.createState('fragmentation', 'backfill', 'tight');
  const baseline = structuredClone(s);
  Engine.dispatchJobs(s);
  for (let i = 0; i < 5; i += 1) Engine.advanceTick(s);
  Engine.submitJob(s, 'My workload', 3, 4);
  Engine.resetState(s);
  assert.deepEqual(s, baseline);
  assert.equal(s.policy, 'backfill');
  assert.equal(s.placement, 'tight');
  assert.equal(s.time, 0);
});

test('reset preserves the clean-slate scenario without eagerly dispatching', () => {
  const s = Engine.createState('empty', 'backfill');
  assert.equal(s.running.length, 0);
  assert.equal(s.queued.length, 4);
  Engine.dispatchJobs(s);
  assert.ok(s.running.length > 0);
  Engine.resetState(s);
  assert.equal(s.running.length, 0);
  assert.equal(s.queued.length, 4);
  assert.equal(Engine.metrics(s).free, 32);
});

test('first-fit and tightest-fit choose different eligible segments when appropriate', () => {
  const s = Engine.createState('empty');
  s.running = [
    { id: 'A', size: 3, slots: [5, 6, 7], remaining: 5 },
    { id: 'B', size: 5, slots: [11, 12, 13, 14, 15], remaining: 5 }
  ];
  s.queued = [];
  s.placement = 'first';
  assert.deepEqual(Engine.findPlacement(s, 2), [0, 1]);
  s.placement = 'tight';
  assert.deepEqual(Engine.findPlacement(s, 2), [8, 9]);
});

test('jobs do not overlap, escape rack boundaries or exceed capacity over time', () => {
  for (const policy of ['fifo', 'backfill']) {
    const s = Engine.createState('fragmentation', policy);
    Engine.dispatchJobs(s);
    for (let t = 0; t < 20; t += 1) {
      const occupied = s.running.flatMap((job) => job.slots);
      assert.equal(new Set(occupied).size, occupied.length);
      assert.ok(occupied.every((slot) => slot >= 0 && slot < Engine.CAPACITY));
      for (const job of s.running.slice(8)) {
        assert.equal(job.slots.length, job.size);
        assert.equal(Math.floor(job.slots[0] / 8), Math.floor(job.slots.at(-1) / 8));
        assert.ok(job.slots.every((slot, index) => slot === job.slots[0] + index));
      }
      assert.ok(Engine.metrics(s).used <= Engine.CAPACITY);
      Engine.advanceTick(s);
    }
  }
});

test('invalid job requests are rejected', () => {
  const s = Engine.createState('empty');
  assert.throws(() => Engine.submitJob(s, 'Too large', 9, 2), RangeError);
  assert.throws(() => Engine.submitJob(s, 'No time', 2, 0), RangeError);
});

test('policy comparison starts with exactly the same initial workload', () => {
  const live = Engine.createState('fragmentation');
  const baseline = structuredClone(live);
  const a = Engine.comparePolicies('fragmentation', 'first', 1);
  const b = Engine.comparePolicies('fragmentation', 'first', 1);

  assert.deepEqual(a, b, 'two independent comparisons are deterministic');
  assert.deepEqual(live, baseline, 'comparing policies must never change a live run');
  assert.equal(a.fifo.summary.startedFromQueue, 0);
  assert.equal(a.backfill.summary.startedFromQueue, 3);
  assert.equal(a.fifo.summary.queuedAtEnd, 4);
  assert.equal(a.backfill.summary.queuedAtEnd, 1);
  assert.equal(a.fifo.timeline[0].time, 1);
  assert.equal(a.backfill.timeline[0].time, 1);
});

test('comparison metrics use only initially queued jobs and document the horizon', () => {
  const results = Engine.comparePolicies('fragmentation', 'first', 8);
  for (const trace of Object.values(results)) {
    assert.equal(trace.ticks, 8);
    assert.equal(trace.timeline.length, 8);
    assert.ok(trace.summary.averageUtilization >= 0 && trace.summary.averageUtilization <= 100);
    assert.ok(trace.summary.startedFromQueue <= 4);
    assert.ok(trace.summary.completedFromQueue <= trace.summary.startedFromQueue);
    assert.equal(trace.summary.startedFromQueue + trace.summary.queuedAtEnd, 4);
    if (trace.summary.averageWaitOfStarted !== null) assert.ok(trace.summary.averageWaitOfStarted >= 0);
  }
  assert.throws(() => Engine.runPolicyTrace('fragmentation', 'fifo', 'first', 0), RangeError);
  assert.throws(() => Engine.runPolicyTrace('fragmentation', 'fifo', 'first', 101), RangeError);
});
