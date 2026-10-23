/*
 * SchedLab Experiment 001 — deterministic, dependency-free teaching engine.
 * Four racks, eight abstract slots each. A job requires one contiguous segment
 * inside a rack. This is not a model of physical GPU adjacency or network cost.
 */
(function (root, factory) {
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) root.SchedLabEngine = engine;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const RACKS = ['A', 'B', 'C', 'D'];
  const SLOTS_PER_RACK = 8;
  const CAPACITY = RACKS.length * SLOTS_PER_RACK;
  const MAX_HISTORY = 24;

  function makeJob(id, name, size, duration, submittedAt = 0) {
    return { id, name, size, duration, remaining: duration, submittedAt, startedAt: null, finishedAt: null, slots: [] };
  }

  function appendEvent(state, message, kind = 'info') {
    state.events.unshift({ time: state.time, message, kind });
    state.events = state.events.slice(0, MAX_HISTORY);
  }

  function addRunning(state, name, size, duration, slots) {
    const id = `J${String(state.nextId++).padStart(2, '0')}`;
    const job = makeJob(id, name, size, duration);
    job.slots = slots;
    job.startedAt = 0;
    state.running.push(job);
    return job;
  }

  function submitJob(state, name, size, duration) {
    if (!Number.isInteger(size) || size < 1 || size > SLOTS_PER_RACK) throw new RangeError('Job size must be an integer between 1 and 8.');
    if (!Number.isInteger(duration) || duration < 1) throw new RangeError('Duration must be a positive integer.');
    const id = `J${String(state.nextId++).padStart(2, '0')}`;
    const job = makeJob(id, name, size, duration, state.time);
    state.queued.push(job);
    return job;
  }

  function resetState(state) {
    state.time = 0;
    state.running = [];
    state.queued = [];
    state.completed = [];
    state.events = [];
    state.nextId = 1;

    if (state.scenario === 'fragmentation') {
      RACKS.forEach((rack, rackIndex) => {
        const base = rackIndex * SLOTS_PER_RACK;
        addRunning(state, `Resident ${rack}-1`, 2, rackIndex % 2 ? 6 : 4, [base + 2, base + 3]);
        addRunning(state, `Resident ${rack}-2`, 2, rackIndex % 2 ? 7 : 6, [base + 6, base + 7]);
      });
      submitJob(state, 'Large training job', 4, 6);
      submitJob(state, 'Quick analysis', 2, 2);
      submitJob(state, 'Data preprocessing', 2, 3);
      submitJob(state, 'Calibration', 1, 2);
      appendEvent(state, 'Initial cluster: 16 of 32 slots free, scattered in two-slot segments.');
      appendEvent(state, 'Large training job is queued with a four-slot rack-local requirement.', 'warn');
    } else if (state.scenario === 'backfill') {
      RACKS.forEach((rack, rackIndex) => {
        const base = rackIndex * SLOTS_PER_RACK;
        addRunning(state, `Occupied rack ${rack}`, 6, rackIndex % 2 ? 5 : 3, Array.from({ length: 6 }, (_, n) => base + n));
      });
      submitJob(state, 'Large model training', 6, 5);
      submitJob(state, 'Small inference', 2, 2);
      submitJob(state, 'Metrics exporter', 1, 2);
      submitJob(state, 'Short batch', 2, 3);
      appendEvent(state, 'Most capacity is reserved by running jobs; eight slots remain free.');
      appendEvent(state, 'A large head-of-line job is waiting while smaller work may fit.', 'warn');
    } else if (state.scenario === 'empty') {
      submitJob(state, 'Model training', 5, 6);
      submitJob(state, 'Feature extraction', 3, 4);
      submitJob(state, 'Parameter sweep', 4, 5);
      submitJob(state, 'Validation run', 2, 3);
      appendEvent(state, 'Clean cluster created. Ready to place incoming jobs.');
    } else {
      throw new RangeError(`Unknown scenario: ${state.scenario}`);
    }
    // Deliberately do not dispatch here. Reset must restore the *same* visible
    // initial workload, regardless of the selected scheduling policy.
    return state;
  }

  function createState(scenario = 'fragmentation', policy = 'fifo', placement = 'first') {
    const state = { scenario, policy, placement, time: 0, running: [], queued: [], completed: [], events: [], nextId: 1 };
    return resetState(state);
  }

  function occupancy(state) {
    const slots = Array(CAPACITY).fill(null);
    for (const job of state.running) {
      for (const index of job.slots) slots[index] = job;
    }
    return slots;
  }

  function freeSegments(state) {
    const slots = occupancy(state);
    const segments = [];
    RACKS.forEach((_, rackIndex) => {
      const base = rackIndex * SLOTS_PER_RACK;
      let i = 0;
      while (i < SLOTS_PER_RACK) {
        if (slots[base + i]) { i += 1; continue; }
        const start = i;
        while (i < SLOTS_PER_RACK && !slots[base + i]) i += 1;
        segments.push({ rack: rackIndex, start: base + start, length: i - start });
      }
    });
    return segments;
  }

  function findPlacement(state, size) {
    const candidates = freeSegments(state).filter((segment) => segment.length >= size);
    if (!candidates.length) return null;
    if (state.placement === 'tight') {
      candidates.sort((a, b) => a.length - b.length || a.start - b.start);
    } else {
      candidates.sort((a, b) => a.start - b.start);
    }
    return Array.from({ length: size }, (_, i) => candidates[0].start + i);
  }

  function dispatchJobs(state, recordBlocked = true) {
    let dispatched = 0;
    let passes = 0;
    while (state.queued.length && passes < 100) {
      passes += 1;
      let index = -1;
      let slots = null;
      if (state.policy === 'fifo') {
        slots = findPlacement(state, state.queued[0].size);
        if (slots) index = 0;
      } else if (state.policy === 'backfill') {
        for (let i = 0; i < state.queued.length; i += 1) {
          slots = findPlacement(state, state.queued[i].size);
          if (slots) { index = i; break; }
        }
      } else {
        throw new RangeError(`Unknown scheduling policy: ${state.policy}`);
      }
      if (index < 0) break;

      const [job] = state.queued.splice(index, 1);
      job.slots = slots;
      job.startedAt = state.time;
      job.remaining = job.duration;
      state.running.push(job);
      dispatched += 1;
      const backfilled = index > 0;
      appendEvent(state, `${job.id} started: ${job.size} ${job.size === 1 ? 'slot' : 'slots'} on rack ${RACKS[Math.floor(slots[0] / SLOTS_PER_RACK)]}${backfilled ? ' (backfilled)' : ''}.`, 'start');
    }
    if (recordBlocked && state.queued.length) {
      const head = state.queued[0];
      const largest = Math.max(0, ...freeSegments(state).map((segment) => segment.length));
      appendEvent(state, `${head.id} waiting: needs ${head.size} contiguous slots; largest free block is ${largest}.`, 'warn');
    }
    return dispatched;
  }

  function advanceTick(state) {
    state.time += 1;
    const finished = [];
    state.running.forEach((job) => {
      job.remaining -= 1;
      if (job.remaining <= 0) finished.push(job);
    });
    finished.forEach((job) => {
      state.running = state.running.filter((item) => item.id !== job.id);
      job.finishedAt = state.time;
      state.completed.push(job);
      appendEvent(state, `${job.id} completed; ${job.size} ${job.size === 1 ? 'slot' : 'slots'} released.`, 'finish');
    });
    dispatchJobs(state);
    if (!finished.length && !state.queued.length && !state.running.length) appendEvent(state, 'All work completed.', 'finish');
    return { finished, time: state.time };
  }

  function metrics(state) {
    const used = state.running.reduce((sum, job) => sum + job.size, 0);
    const free = CAPACITY - used;
    return { used, free, utilization: used / CAPACITY * 100, largest: Math.max(0, ...freeSegments(state).map((segment) => segment.length)) };
  }

  // Replays a preset from T+00 without touching the UI's live simulation.
  // Only jobs initially queued are counted in queue-level outcome metrics;
  // residents are counted in utilization because they consume real capacity.
  function runPolicyTrace(scenario, policy, placement = 'first', ticks = 8) {
    if (!Number.isInteger(ticks) || ticks < 1 || ticks > 100) {
      throw new RangeError('Comparison horizon must be an integer between 1 and 100 ticks.');
    }
    const simulation = createState(scenario, policy, placement);
    const originalQueueIds = new Set(simulation.queued.map((job) => job.id));
    const timeline = [];
    let occupiedSlotTicks = 0;

    for (let time = 1; time <= ticks; time += 1) {
      advanceTick(simulation);
      const snapshot = metrics(simulation);
      occupiedSlotTicks += snapshot.used;
      timeline.push({
        time: simulation.time,
        usedSlots: snapshot.used,
        queuedJobs: simulation.queued.length,
        completedJobs: simulation.completed.filter((job) => originalQueueIds.has(job.id)).length,
      });
    }

    const originalJobs = [...simulation.running, ...simulation.completed, ...simulation.queued]
      .filter((job) => originalQueueIds.has(job.id));
    const started = originalJobs.filter((job) => job.startedAt !== null);
    const completed = originalJobs.filter((job) => job.finishedAt !== null);
    const totalWait = started.reduce((sum, job) => sum + job.startedAt - job.submittedAt, 0);

    return {
      scenario, policy, placement, ticks, timeline,
      summary: {
        startedFromQueue: started.length,
        completedFromQueue: completed.length,
        queuedAtEnd: simulation.queued.length,
        averageUtilization: occupiedSlotTicks / (CAPACITY * ticks) * 100,
        averageWaitOfStarted: started.length ? totalWait / started.length : null,
      },
    };
  }

  function comparePolicies(scenario = 'fragmentation', placement = 'first', ticks = 8) {
    return {
      fifo: runPolicyTrace(scenario, 'fifo', placement, ticks),
      backfill: runPolicyTrace(scenario, 'backfill', placement, ticks),
    };
  }

  return { RACKS, SLOTS_PER_RACK, CAPACITY, createState, resetState, submitJob, appendEvent, occupancy, freeSegments, findPlacement, dispatchJobs, advanceTick, metrics, runPolicyTrace, comparePolicies };
});
