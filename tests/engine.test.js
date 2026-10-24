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

test('lifecycle distinguishes initial residents from unstarted queue observations', () => {
  const s = Engine.createState();
  const before = structuredClone(s);
  const rows = Engine.jobLifecycles(s);
  assert.equal(rows.length, 12);
  const residents = rows.filter((job) => job.resident);
  assert.equal(residents.length, 8);
  for (const job of residents) {
    assert.equal(job.status, 'running');
    assert.equal(job.submittedAt, null);
    assert.equal(job.startedAt, 0);
    assert.equal(job.wait, null, 'resident queue wait is unknown, not zero');
  }
  for (const job of rows.filter((job) => !job.resident)) {
    assert.equal(job.status, 'queued');
    assert.equal(job.startedAt, null);
    assert.equal(job.finishedAt, null);
    assert.equal(job.wait, null);
    assert.equal(job.waitingAtLeast, 0);
  }
  rows[0].slots.push(99);
  rows[0].name = 'Changed snapshot';
  assert.deepEqual(s, before, 'derived rows must not alias or mutate live jobs');
});

test('lifecycle preserves censored FIFO waits and real backfill start/finish ticks', () => {
  const s = Engine.createState();
  Engine.advanceTick(s);
  assert.ok(Engine.jobLifecycles(s).filter((job) => !job.resident).every((job) =>
    job.status === 'queued' && job.wait === null && job.waitingAtLeast === 1));
  s.policy = 'backfill';
  Engine.resetState(s);
  Engine.advanceTick(s);
  let rows = Engine.jobLifecycles(s);
  const head = rows.find((job) => job.id === 'J09');
  assert.equal(head.status, 'queued');
  assert.equal(head.waitingAtLeast, 1);
  for (const id of ['J10', 'J11', 'J12']) {
    const job = rows.find((row) => row.id === id);
    assert.equal(job.status, 'running');
    assert.equal(job.startedAt, 1);
    assert.equal(job.wait, 1);
    assert.equal(job.waitingAtLeast, null);
    assert.equal(job.remaining, job.duration, 'new starts do not consume runtime on their dispatch tick');
  }
  Engine.advanceTick(s);
  Engine.advanceTick(s);
  rows = Engine.jobLifecycles(s);
  const completed = rows.find((job) => job.id === 'J10');
  assert.equal(completed.status, 'completed');
  assert.equal(completed.startedAt, 1);
  assert.equal(completed.finishedAt, 3);
  assert.equal(completed.wait, 1);
  assert.deepEqual(completed.slots, [0, 1], 'historical allocation remains inspectable');
  Engine.advanceTick(s);
  const resident = Engine.jobLifecycles(s).find((job) => job.id === 'J01');
  assert.equal(resident.status, 'completed');
  assert.equal(resident.resident, true);
  assert.equal(resident.finishedAt, 4);
  assert.equal(resident.wait, null);
});

test('custom arrivals use submission time and lifecycle reset removes stale observations', () => {
  const s = Engine.createState('empty', 'backfill', 'tight');
  const initial = Engine.jobLifecycles(s);
  Engine.advanceTick(s);
  const custom = Engine.submitJob(s, '<custom workload>', 1, 1);
  let row = Engine.jobLifecycles(s).find((job) => job.id === custom.id);
  assert.equal(row.submittedAt, 1);
  assert.equal(row.waitingAtLeast, 0);
  assert.equal(row.resident, false);
  Engine.advanceTick(s);
  Engine.advanceTick(s);
  row = Engine.jobLifecycles(s).find((job) => job.id === custom.id);
  assert.equal(row.startedAt, 2);
  assert.equal(row.finishedAt, 3);
  assert.equal(row.wait, 1);
  const before = structuredClone(s);
  const snapshot = Engine.jobLifecycles(s);
  Engine.comparePolicies('empty', 'tight', 8);
  assert.deepEqual(s, before);
  assert.deepEqual(Engine.jobLifecycles(s), snapshot);
  Engine.resetState(s);
  assert.deepEqual(Engine.jobLifecycles(s), initial);
  assert.equal(s.policy, 'backfill');
  assert.equal(s.placement, 'tight');
});
