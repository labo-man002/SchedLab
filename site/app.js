/*
 * SchedLab experiment 001: a deliberately small teaching model.
 * Each of four racks has eight abstract slots. Every job requests a single
 * contiguous segment within one rack. No real GPU or network topology is
 * inferred from the diagram. Simulation time advances in discrete ticks.
 */
(function () {
  'use strict';

  const Engine = window.SchedLabEngine;
  const RACKS = Engine.RACKS;
  const SLOTS_PER_RACK = Engine.SLOTS_PER_RACK;
  const $ = (id) => document.getElementById(id);
  const slotsLabel = (n) => `${n} ${n === 1 ? 'slot' : 'slots'}`;
  const state = Engine.createState();
  state.mode = 'learn';
  state.timer = null;
  state.lessonStep = 0;

  function appendEvent(message, kind = 'info') {
    return Engine.appendEvent(state, message, kind);
  }

  function initializeScenario(userReset = false) {
    stopAutoRun();
    state.lessonStep = state.scenario === 'fragmentation' && state.policy === 'fifo' && state.placement === 'first' ? 0 : -1;
    Engine.resetState(state);
    if (userReset) appendEvent('Run reset to T+00. Selected policies were kept for fair replay.', 'info');
    render();
  }

  function addQueued(name, size, duration) {
    return Engine.submitJob(state, name, size, duration);
  }

  function occupancy() {
    return Engine.occupancy(state);
  }

  function findPlacement(size) {
    return Engine.findPlacement(state, size);
  }

  function metrics() {
    return Engine.metrics(state);
  }

  function step() {
    state.lessonStep = -1;
    Engine.advanceTick(state);
    render();
    if (state.timer && (state.time >= 30 || (!state.running.length && !state.queued.length))) stopAutoRun();
  }

  function advanceTicks(count) {
    for (let i = 0; i < count; i += 1) step();
  }

  function stopAutoRun() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
    if ($('play-label')) $('play-label').textContent = 'Auto run';
    if ($('play-icon')) $('play-icon').textContent = '▶';
  }

  function toggleAutoRun() {
    if (state.timer) { stopAutoRun(); return; }
    $('play-label').textContent = 'Pause';
    $('play-icon').textContent = 'Ⅱ';
    state.timer = setInterval(step, 820);
    step();
  }

  function renderRackGrid() {
    const occupied = occupancy();
    const preview = state.queued.length ? findPlacement(state.queued[0].size) : null;
    const previewSet = new Set(preview || []);
    const container = $('rack-grid');
    container.replaceChildren();
    RACKS.forEach((rackName, rackIndex) => {
      const row = document.createElement('div');
      row.className = 'rack-row';
      const label = document.createElement('div');
      label.className = 'rack-label';
      label.innerHTML = `RACK ${rackName}<span>8 slots</span>`;
      const slotRow = document.createElement('div');
      slotRow.className = 'slot-row';
      for (let n = 0; n < SLOTS_PER_RACK; n += 1) {
        const globalIndex = rackIndex * SLOTS_PER_RACK + n;
        const job = occupied[globalIndex];
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = `slot${job ? ' occupied' : ''}${previewSet.has(globalIndex) && !job ? ' candidate' : ''}`;
        const slotNumber = String(n + 1).padStart(2, '0');
        slot.textContent = slotNumber;
        const detail = job ? `${job.id}: ${job.name}, ${job.remaining} ticks left` : previewSet.has(globalIndex) ? 'Available: candidate for next job' : 'Available';
        slot.title = `Rack ${rackName} / slot ${slotNumber} — ${detail}`;
        slot.setAttribute('aria-label', slot.title);
        slot.addEventListener('click', () => {
          appendEvent(`Inspected rack ${rackName}, slot ${slotNumber}: ${detail}.`, 'info');
          renderEvents();
        });
        slotRow.appendChild(slot);
      }
      row.append(label, slotRow);
      container.appendChild(row);
    });
  }

  function renderDiagnosis() {
    const m = metrics();
    const box = $('diagnosis');
    let symbol = '!';
    let kind = '';
    let message = '';
    if (state.queued.length) {
      const head = state.queued[0];
      const placement = findPlacement(head.size);
      if (placement) {
        kind = 'neutral'; symbol = '↗';
        message = `<strong>${head.id} has a valid placement.</strong> Run the scheduler to dispatch it.`;
      } else {
        message = `<strong>${head.id} is blocked.</strong> It requests ${head.size} adjacent rack-local slots, but the largest free block is ${m.largest}. ${m.free} total slots are free.`;
      }
    } else if (state.running.length) {
      kind = 'success'; symbol = '✓';
      message = '<strong>No queued work.</strong> All submitted jobs are running or complete. Submit another job to test the scheduler.';
    } else {
      kind = 'success'; symbol = '✓';
      message = '<strong>Cluster idle.</strong> All work is complete. Reset or submit a new job to continue.';
    }
    box.className = `diagnosis ${kind}`.trim();
    box.innerHTML = `<span class="diagnosis-symbol" aria-hidden="true">${symbol}</span><span>${message}</span>`;
  }

  function renderQueue() {
    const container = $('queue-list');
    container.replaceChildren();
    $('queue-chip').textContent = `${state.queued.length} waiting`;
    if (!state.queued.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-queue';
      empty.textContent = 'Queue empty. Submit a job to continue.';
      container.appendChild(empty);
      return;
    }
    state.queued.forEach((job, index) => {
      const canFit = Boolean(findPlacement(job.size));
      const blocked = index === 0 && !canFit;
      const item = document.createElement('div');
      item.className = `queue-item ${blocked ? 'blocked' : ''}`;
      const icon = document.createElement('div');
      icon.className = 'queue-item-icon';
      icon.textContent = blocked ? '!' : '↳';
      const info = document.createElement('div');
      info.className = 'queue-item-main';
      const name = document.createElement('div');
      name.className = 'queue-item-name';
      name.textContent = job.name;
      const meta = document.createElement('div');
      meta.className = 'queue-item-info';
      meta.textContent = `${job.id}  ·  ${slotsLabel(job.size)}  ·  ${job.duration} ticks`;
      info.append(name, meta);
      const status = document.createElement('span');
      status.className = 'queue-item-status';
      status.textContent = blocked ? 'BLOCKED' : canFit ? 'FITS' : 'WAITING';
      item.append(icon, info, status);
      container.appendChild(item);
    });
  }

  function renderEvents() {
    const container = $('event-list');
    container.replaceChildren();
    state.events.slice(0, 6).forEach((event) => {
      const item = document.createElement('li');
      const time = document.createElement('span');
      time.className = 'event-time';
      time.textContent = `T+${String(event.time).padStart(2, '0')}`;
      const message = document.createElement('span');
      message.className = event.kind === 'start' || event.kind === 'finish' ? 'event-kind' : '';
      message.textContent = event.message;
      item.append(time, message);
      container.appendChild(item);
    });
  }

  function renderMode() {
    const learn = state.mode === 'learn';
    $('learn-mode').classList.toggle('selected', learn);
    $('lab-mode').classList.toggle('selected', !learn);
    $('learn-mode').setAttribute('aria-pressed', String(learn));
    $('lab-mode').setAttribute('aria-pressed', String(!learn));
    $('note-mode').textContent = learn ? 'LEARN MODE' : 'LAB MODE';
    $('explain-heading').textContent = learn ? 'The difference between free and usable.' : 'Interpret the allocation constraints.';
    $('explain-text').textContent = learn
      ? 'A job does not simply need enough free slots. In this toy cluster, every job needs an adjacent block within one rack. Free capacity scattered across racks or split into small segments may be unusable for a larger request. Backfilling can use smaller gaps while the head-of-line job waits.'
      : 'Compare placement and dispatch outcomes under identical initial conditions. Allocation is non-preemptive. Completion occurs after integer ticks. First-fit selects the earliest qualifying rack segment; tightest-fit selects the smallest qualifying segment. Opportunistic backfill has no reservations or starvation protections in this model.';
    $('experiment-tip').innerHTML = learn
      ? 'Try switching to <strong>Opportunistic backfill</strong>, then reset and compare what runs.'
      : 'For a fair A/B observation, <strong>reset between policies</strong> and inspect utilization, queue progress, and the event stream.';
    renderLesson();
  }

  const LESSON_STAGES = [
    {
      title: 'Predict the scheduler\'s next move.',
      body: 'There are 16 free slots, but the largest contiguous rack-local block contains only two. What happens to a four-slot job at the head of a strict FIFO queue?',
      action: 'Run strict FIFO for one tick →',
    },
    {
      title: 'One blocked job holds the queue.',
      body: 'At T+01, strict FIFO has not started any queued job. Smaller requests behind the four-slot job could fit, but this policy does not skip the head. Replay the exact same initial cluster with a different policy.',
      action: 'Replay with backfilling →',
    },
    {
      title: 'Progress is not a guarantee.',
      body: 'At T+01, opportunistic backfill has started three smaller queued jobs while the large request still waits. This policy improves immediate progress here, but it does not reserve capacity or guarantee that the large job will start promptly.',
      action: 'Explore freely in Lab →',
    },
  ];

  function renderLesson() {
    const guide = $('lesson-guide');
    guide.hidden = state.mode !== 'learn';
    if (state.lessonStep < 0) {
      $('lesson-progress').textContent = 'FREE PLAY';
      $('lesson-title').textContent = 'You are exploring your own experiment.';
      $('lesson-body').textContent = 'Use the scheduler and placement controls above. Restart the guided lesson to compare both policies from the same fragmented starting point.';
      $('lesson-action').textContent = 'Restart guided lesson →';
      return;
    }
    const stage = LESSON_STAGES[state.lessonStep];
    $('lesson-progress').textContent = `${state.lessonStep + 1} / 3`;
    $('lesson-title').textContent = stage.title;
    $('lesson-body').textContent = stage.body;
    $('lesson-action').textContent = stage.action;
  }

  function restartLesson() {
    stopAutoRun();
    state.mode = 'learn';
    state.scenario = 'fragmentation';
    state.policy = 'fifo';
    state.placement = 'first';
    state.lessonStep = 0;
    $('scenario').value = state.scenario;
    $('policy').value = state.policy;
    $('placement').value = state.placement;
    Engine.resetState(state);
    render();
  }

  function runGuidedStep() {
    if (state.lessonStep < 0) { restartLesson(); return; }
    if (state.lessonStep === 2) {
      state.mode = 'lab';
      renderMode();
      return;
    }
    stopAutoRun();
    state.scenario = 'fragmentation';
    state.policy = state.lessonStep === 0 ? 'fifo' : 'backfill';
    state.placement = 'first';
    $('scenario').value = state.scenario;
    $('policy').value = state.policy;
    $('placement').value = state.placement;
    Engine.resetState(state);
    Engine.advanceTick(state);
    state.lessonStep += 1;
    render();
  }

  function clearComparison() {
    const paragraph = document.createElement('p');
    paragraph.className = 'comparison-placeholder';
    paragraph.textContent = 'Run a controlled replay to compare queue progress, waiting time and occupied capacity.';
    $('comparison-results').replaceChildren(paragraph);
  }

  function renderComparison() {
    const ticks = Number($('comparison-horizon').value);
    const result = Engine.comparePolicies(state.scenario, state.placement, ticks);
    const container = $('comparison-results');
    container.replaceChildren();

    const table = document.createElement('table');
    table.className = 'comparison-table';
    const caption = document.createElement('caption');
    caption.textContent = `Controlled ${ticks}-tick comparison for ${$('scenario').selectedOptions[0].textContent}, ${$('placement').selectedOptions[0].textContent}`;
    table.appendChild(caption);
    const header = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['MEASURE', 'STRICT FIFO', 'BACKFILL'].forEach((label) => {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = label;
      headerRow.appendChild(cell);
    });
    header.appendChild(headerRow);
    table.appendChild(header);
    const body = document.createElement('tbody');
    const a = result.fifo.summary;
    const b = result.backfill.summary;
    const percentage = (value) => `${value.toFixed(1)}%`;
    const wait = (value) => value === null ? '—' : `${value.toFixed(2)} ticks`;
    [
      ['Queued jobs started', a.startedFromQueue, b.startedFromQueue],
      ['Queued jobs completed', a.completedFromQueue, b.completedFromQueue],
      ['Mean wait of started jobs', wait(a.averageWaitOfStarted), wait(b.averageWaitOfStarted)],
      ['Mean occupied capacity', percentage(a.averageUtilization), percentage(b.averageUtilization)],
      ['Jobs still queued', a.queuedAtEnd, b.queuedAtEnd],
    ].forEach((values) => {
      const row = document.createElement('tr');
      values.forEach((value, i) => {
        const cell = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) cell.scope = 'row';
        cell.textContent = value;
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
    table.appendChild(body);
    container.appendChild(table);

    const traces = document.createElement('div');
    traces.className = 'comparison-traces';
    [['Strict FIFO', result.fifo], ['Opportunistic backfill', result.backfill]].forEach(([name, run]) => {
      const card = document.createElement('div');
      card.className = 'trace-card';
      const title = document.createElement('h4');
      title.textContent = `${name} · occupied slots after each tick`;
      const bars = document.createElement('div');
      bars.className = 'trace-bars';
      bars.setAttribute('role', 'img');
      bars.setAttribute('aria-label', `${name}: ${run.timeline.map((point) => `tick ${point.time}, ${point.usedSlots} of 32 slots`).join('; ')}`);
      run.timeline.forEach((point) => {
        const column = document.createElement('div');
        column.className = 'trace-column';
        const bar = document.createElement('div');
        bar.className = 'trace-bar';
        bar.style.height = `${point.usedSlots / Engine.CAPACITY * 100}%`;
        bar.title = `T+${point.time}: ${point.usedSlots} / 32 slots occupied; ${point.queuedJobs} queued`;
        const tick = document.createElement('span');
        tick.textContent = point.time;
        column.append(bar, tick);
        bars.appendChild(column);
      });
      card.append(title, bars);
      traces.appendChild(card);
    });
    container.appendChild(traces);
    const footnote = document.createElement('p');
    footnote.className = 'comparison-footnote';
    footnote.textContent = 'Same preset, same placement heuristic, same integer-tick horizon. Mean occupancy includes preset resident jobs. Wait is averaged only over originally queued jobs that actually started; an unstarted job is not assigned an invented wait time. This is a toy model, not a benchmark.';
    container.appendChild(footnote);
  }

  function render() {
    const m = metrics();
    $('clock').textContent = `T+${String(state.time).padStart(2, '0')}`;
    $('utilization').innerHTML = `${Math.round(m.utilization)}<span>%</span>`;
    $('utilization-bar').style.width = `${m.utilization}%`;
    $('free-slots').innerHTML = `${m.free}<span> / 32</span>`;
    $('largest-block').innerHTML = `${m.largest}<span> slots</span>`;
    $('queued-count').textContent = String(state.queued.length);
    $('completed-count').textContent = `${state.completed.length} completed`;
    $('scenario-note').textContent = state.scenario === 'fragmentation' ? 'INITIAL: 16 free, largest block 2' : state.scenario === 'backfill' ? 'INITIAL: eight free, largest block 2' : 'INITIAL: all 32 slots free';
    $('policy-description').textContent = state.policy === 'fifo'
      ? 'FIFO waits if the job at the front of the queue cannot be placed.'
      : 'Backfill runs later jobs that fit, even if the head-of-line job is blocked. No reservations are modeled.';
    renderRackGrid();
    renderDiagnosis();
    renderQueue();
    renderEvents();
    renderMode();
  }

  function wireControls() {
    $('step-btn').addEventListener('click', () => { stopAutoRun(); step(); });
    $('play-btn').addEventListener('click', toggleAutoRun);
    $('reset-btn').addEventListener('click', () => initializeScenario(true));
    $('scenario').addEventListener('change', (event) => { state.scenario = event.target.value; initializeScenario(); clearComparison(); });
    $('policy').addEventListener('change', (event) => {
      stopAutoRun();
      state.policy = event.target.value;
      state.lessonStep = -1;
      appendEvent(`Scheduling policy changed to ${state.policy === 'fifo' ? 'strict FIFO' : 'opportunistic backfill'}. Advance a tick to schedule, or reset for a fair replay.`);
      render();
    });
    $('placement').addEventListener('change', (event) => {
      stopAutoRun();
      state.placement = event.target.value;
      state.lessonStep = -1;
      appendEvent(`Placement changed to ${state.placement === 'first' ? 'first-fit' : 'tightest-fit'}. Advance a tick to apply it.`);
      clearComparison();
      render();
    });
    $('learn-mode').addEventListener('click', () => { state.mode = 'learn'; renderMode(); });
    $('lab-mode').addEventListener('click', () => { state.mode = 'lab'; renderMode(); });
    $('lesson-action').addEventListener('click', runGuidedStep);
    $('lesson-restart').addEventListener('click', restartLesson);
    $('compare-btn').addEventListener('click', renderComparison);
    $('comparison-horizon').addEventListener('change', clearComparison);
    $('job-form').addEventListener('submit', (event) => {
      event.preventDefault();
      stopAutoRun();
      const size = Number($('job-size').value);
      const duration = Number($('job-duration').value);
      const job = addQueued(`Custom workload ${state.nextId}`, size, duration);
      state.lessonStep = -1;
      appendEvent(`${job.id} queued: ${slotsLabel(size)} for ${duration} ticks. Advance a tick to schedule it.`);
      render();
    });
  }

  wireControls();
  initializeScenario();
  window.SchedLabDemo = { getState: () => JSON.parse(JSON.stringify({ time: state.time, scenario: state.scenario, policy: state.policy, placement: state.placement, running: state.running, queued: state.queued, completed: state.completed, metrics: metrics() })), advanceTicks };
})();
