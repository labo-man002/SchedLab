# Engineering baseline and invariants — alpha 0.4

**Snapshot date:** 23 October 2026. Verify the checked-out commit and executable behavior before changing anything. Code and tests prevail if this description becomes stale.

## 1. Repository anatomy

| Path | Responsibilities |
| --- | --- |
| `site/index.html` | Single-page site, Learn/Lab controls, guided lesson, queue, occupancy, comparison UI, descriptions |
| `site/styles.css` | Responsive visual language, layout, controls and motion |
| `site/engine.js` | Dependency-free deterministic model, queue dispatch, placement, scenarios and comparison traces |
| `site/share.js` | Versioned URL codec for safe, built-in preset sharing |
| `site/app.js` | Browser state/rendering, lesson progression, timer, controlled comparison rendering, share handling |
| `tests/engine.test.js` | Pure engine and invariants: state, placement, dispatch, reset and comparison |
| `tests/share.test.js` | Share URL roundtrip, validation and exclusion of live/custom state |
| `.github/workflows/pages.yml` | CI checks and GitHub Pages deployment of `site/` on `main` |
| `docs/MVP_SPEC.md`, `docs/AUDIT.md`, `docs/ROADMAP.md` | Product constraints, previously detected problems, long-term milestones |

Website: vanilla HTML/CSS/JavaScript, no bundler, no required runtime dependencies, static Pages host. Node.js 20+ for tests. Commands:

```sh
npm run check
python3 -m http.server 8000 --directory site
```

The development URL is `http://localhost:8000/`. The public deployment URL is `https://labo-man002.github.io/SchedLab/`. **Deployment state must be verified separately from a local test pass.**

## 2. Current model contract — not hardware semantics

- Four racks named `A`–`D`; eight abstract slots per rack, 32 slots total.
- One job asks for an integer `size` of 1–8 slots **contiguously in one rack**. No multi-rack job placement.
- Job duration is a positive integer of discrete ticks; work is non-preemptive.
- Queued jobs have stable order and identifiers; running jobs reserve specific slot indices.
- Placement heuristic `first`: choose lowest-index fitting free segment.
- Placement heuristic `tight`: choose shortest fitting free segment; break ties by lowest starting index.
- Scheduling policy `fifo`: if the queue head cannot be placed, dispatch stops.
- Scheduling policy `backfill`: repeatedly select the earliest queued job that currently fits; this is opportunistic and **does not implement EASY reservations, aging, priorities, or starvation protection**.

No physical GPU layout, NVLink, bandwidth, latency, Slurm, Kubernetes, cluster control or benchmark is modeled by those slots.

## 3. Important lifecycle and clock semantics

The engine exports `createState`, `resetState`, `submitJob`, `appendEvent`, `occupancy`, `freeSegments`, `findPlacement`, `dispatchJobs`, `advanceTick`, `metrics`, `runPolicyTrace`, `comparePolicies` and constants.

Jobs contain at least:

```js
{
  id, name, size, duration, remaining,
  submittedAt, startedAt, finishedAt, slots
}
```

Engine state contains at least:

```js
{
  scenario, policy, placement, time,
  running: [], queued: [], completed: [], events: [], nextId
}
```

The UI additionally holds `mode`, `timer` and `lessonStep`. Treat UI state as presentation state, not a second scheduler.

**Precisely one `advanceTick` does:**

1. Increment `time` by one.
2. Decrement `remaining` for jobs already running at the start of that tick.
3. Complete/release any running job whose remaining time reached zero; record `finishedAt` and event.
4. Run the selected scheduling policy using newly available slots; record starts/events.
5. Jobs started in step 4 do **not** consume a unit of runtime until the next tick.

Preset resident jobs have `startedAt = 0` and consume initial capacity. Preset queued jobs have `submittedAt = 0` but are **not dispatched at T+00**. Custom submissions use the current `time` and remain queued until a later tick.

**Reset invariant:** `resetState(state)` sets the clock to zero, clears live/completed/events, reconstructs the selected built-in preset and its initial queued jobs, resets IDs, and **does not dispatch any jobs**. It retains selected policy/heuristic controls. This explicitly fixed an earlier bug in which reset sometimes appeared to fail under backfill.

Changing a policy or placement control in the UI also must not sneak in an immediate dispatch; the new choice applies at the next tick. A controlled replay should always start at T+00, not continue a partially run state.

## 4. Built-in scenarios

| Scenario | Initial allocations | Queue head | Teaching question |
| --- | --- | --- | --- |
| `fragmentation` | Eight resident jobs, 16 occupied and 16 free slots; largest free block is 2 | Four-slot job | Why does total free capacity not imply a valid contiguous allocation? |
| `backfill` | Four resident six-slot jobs, 24 occupied and eight free slots; largest free block is 2 | Six-slot job | How can smaller queued jobs move when the head cannot fit? |
| `empty` | No residents; all 32 slots free; four queued jobs | Five-slot job | How do ordering and placement consume a clean cluster? |

For the default fragmented preset, the initial queue is one four-slot job followed by requests for two, two and one slots. The guided lesson first advances strict FIFO to T+01, then resets/advances with backfill for a fair visual contrast. The backfill run can start three smaller jobs while the head remains blocked.

## 5. Existing product surface

**Implemented:**

- Responsive one-page Learn-first landing and a Lab mode using the same engine.
- Cluster occupancy grid, queue, controls for scenario/policy/placement, submit custom job, tick, auto-run, reset.
- Diagnosis of head-of-line placement and current metrics (utilization, free slots, largest block, queue count).
- Event stream with time-stamped explanatory messages.
- Three-step guided walkthrough and a one-question optional comprehension check.
- Controlled FIFO/backfill policy comparison over 4, 8 or 12 ticks with table and occupancy traces.
- Share URL for built-in preset, selected policy, placement and comparison horizon; loads T+00.

**Not implemented:**

- A per-job lifecycle/Gantt timeline visible to users.
- Import/export for arbitrary custom scenarios and topologies.
- Reservation-aware backfill, fairness/priority policies, network-aware GPU placement.
- GPU/cluster telemetry, predictive feedback, persistent storage, accounts, backend or API integration.
- Proven WCAG-level accessibility audit or comprehensive mobile/browser test matrix.

## 6. Comparison semantics and measurement honesty

`runPolicyTrace(scenario, policy, placement, ticks)` builds a **new** state from a built-in scenario. For each tick it records occupied slots, queue count and completed initially queued jobs. `comparePolicies` executes separate FIFO and backfill runs from the same initial conditions.

The visible comparison reports:

- **Queued jobs started:** only the IDs originally in that preset queue, excluding initial running residents and later custom UI submissions.
- **Queued jobs completed:** same cohort.
- **Mean wait of started jobs:** mean of `startedAt − submittedAt`, **only** for originally queued jobs that actually started. If none started, result is null/`—`; do not substitute zero.
- **Mean occupied capacity:** sum of occupied slots after each tick, divided by `32 × number of ticks`; initial running residents count toward occupancy.
- **Jobs still queued:** count at the fixed horizon.

Existing summaries do not capture the full wait-time distribution or fairness. **Unstarted jobs have censored waiting observations**, not a known eventual wait time. When implementing the lifecycle view, label those as *still waiting at least N ticks*, where N is observation time minus submission time; never silently include them as completed wait observations or claim starvation from one bounded run.

Comparison and live simulation are intentionally independent. Preserve that distinction in UI labels and tests.

## 7. Sharing and privacy contract

`site/share.js` validates a strict `v=1` setup. The allowlisted payload covers **only** scenario, scheduling policy, placement heuristic and chosen replay horizon. It is **not** a live-state serialization mechanism. It must not add custom job names, arbitrary submitted workloads, credentials or current simulation time to a URL.

If arbitrary scenario import/export is added, give it a **separate, explicitly versioned, validated JSON contract** and deliberate user action. Do not quietly broaden `v=1` semantics or place unbounded payloads in query parameters. Provide size and value limits, readable validation errors, roundtrip tests, and backwards compatibility.

No existing backend or cookie-based tracking is required. CSS currently references remote Google Fonts, an acknowledged optional privacy/offline improvement in `docs/AUDIT.md`.

## 8. Verification baseline and blind spots

- `npm run check` performs JavaScript syntax validation and Node's built-in tests.
- On the alpha 0.4 reference commit, **12 tests passed: nine engine tests and three share-codec tests**.
- The default reset bug has regression tests; controlled comparison and link validation also have tests.
- Previous work included local desktop browser interactions for step, backfill, reset, lesson and share.
- **Not yet fully verified:** public GitHub Pages desktop/mobile smoke tests after every deployment, keyboard-only and screen-reader flows, reduced-motion behaviors, small screens, comprehensive browser automation.

Do not claim that unit tests prove the UI is accessible or that the published site was checked if it wasn't. A browser test pass and an Actions deployment check are distinct forms of evidence.

## 9. Risks and likely agent pitfalls

1. **Eager dispatch:** calling `dispatchJobs` from reset or selection handlers breaks reproducibility; keep scheduling at explicit ticks.
2. **Duplicating the model:** calculating new timeline semantics independently in `app.js` can diverge from the engine. Extract pure selectors if needed.
3. **Misleading averages:** unstarted jobs cannot be given observed completed waits or used in a naïve average.
4. **Unfair A/B tests:** custom live state must never silently contaminate preset replay.
5. **Breaking shared URLs:** existing `v=1` links must continue to open the same setup.
6. **Using `innerHTML` with new user data:** favor DOM nodes and `textContent`; current fixed explanatory snippets are authored locally.
7. **Overstating model fidelity:** even visually compelling rack diagrams remain abstract slots, not actual GPU topology.
8. **Overengineering the alpha:** adding a framework/backend/telemetry service for one teaching lesson raises maintenance cost without establishing learning value.

## 10. Current definition of a safe change

- Exact scope and expected behavior are explained in the PR.
- Engine and codec regression suite passes; changed semantics gain appropriate tests.
- Any new user-facing interactive state has a keyboard path and an understandable announcement/label.
- No regression in reset, fixed-horizon comparison, or preset links.
- Relevant documentation and release notes distinguish existing from proposed features.
- Work stays on a review branch; no automatic merge to `main` and no claim of live deployment until verified.
