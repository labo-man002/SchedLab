# SchedLab — learning and systems roadmap

**Updated:** 23 October 2026  
**Owner:** Khalil Ben Maaoui  
**Current release:** alpha 0.3 — one fully client-side teaching model

## Purpose

SchedLab makes hidden workload-management decisions visible, testable and discussable. The product has two connected experiences:

1. **Learn:** a question, a prediction, an experiment, an explanation and a check of understanding. Optimized for people who are unfamiliar with scheduling or topology.
2. **Lab:** a controlled model, explicit assumptions, reproducible input, traces and measurable outcomes. Optimized for engineering curiosity.

Neither experience should promise to reproduce real HPC, Kubernetes or GPU cluster behavior. The educational site and the separately maintained [`job-scheduler`](https://github.com/labo-man002/job-scheduler) simulator have different scopes and should only be integrated behind a versioned contract.

## What exists today

| Capability | State | Boundary |
| --- | --- | --- |
| Fragmentation puzzle, queue and rack occupancy | Implemented | 4 racks × 8 abstract slots |
| Strict FIFO and opportunistic backfill | Implemented | No priority, reservations or aging |
| First-fit and tightest-fit allocation | Implemented | One rack-local contiguous segment |
| Manual/automatic ticks, reset, custom jobs | Implemented | Non-preemptive, integer-tick jobs |
| Guided FIFO/backfill lesson | Implemented | Preset conditions, three steps |
| Side-by-side policy replay and metrics | Implemented | Initial queue and fixed 4/8/12 tick horizon |
| Versioned share links for built-in presets | Implemented | Encodes scenario, policy, heuristic and horizon only |
| Custom scenario JSON import/export | Planned | Requires a validated schema and versioned engine contract |
| Graph topology, GPU network penalties, and contention | Research direction | Not implemented in SchedLab |
| Live cluster telemetry and production integration | Out of scope | No cluster credentials or backend |

## Development order

### Milestone A — earn trust in one lesson

- Browser/mobile accessibility checks: keyboard operation, contrast, control labels and small-screen layouts.
- Make reset, tick and policy transitions easy to understand; no hidden state changes.
- Add a one-question comprehension check: why a four-slot job waits when sixteen slots are free.
- Publish a concise technical note explaining exactly what the slot model assumes.

**Evidence of success:** a new visitor can predict the blocked FIFO outcome and explain why smaller work starts under backfilling, without being told that the toy model is a real scheduler.

### Milestone B — portable, auditable experiments

- Introduce a small versioned JSON scenario format for racks, running jobs and queued jobs.
- Validate sizes, slot uniqueness, same-rack constraints, remaining time, policy and heuristic.
- Preserve `v=1` preset links; introduce a separate validated import/export workflow for larger custom payloads.
- Show per-job timeline: submitted → started → completed, including still-unstarted jobs as censored observations.
- Add seed/version metadata if and only if nondeterministic generators are introduced.

**Evidence of success:** a colleague opening a link sees the exact starting workload and reproduces the same decision trace.

### Milestone C — lesson catalog without model confusion

Candidate follow-up lessons, prioritized by conceptual value rather than flashy dashboards:

1. **Placement choices and fragmentation:** same queue; compare first-fit/tightest-fit over several arrivals.
2. **Fairness versus utilization:** demonstrate why opportunistic backfill can starve an expensive head job; introduce reservation-aware backfill as a separate, clearly specified policy.
3. **Locality domains:** racks, hosts and accelerators with distinct constraints. Distinguish capacity, adjacency, and communication topology.
4. **Network-aware GPU placement:** a graph with edge types, bandwidth and latency; later surface bottlenecks/contention rather than pretending adjacency implies GPU affinity.
5. **Scheduling versus allocation boundaries:** demonstrate which decisions belong to a queueing policy and which belong to a deterministic resource placer. This reflects the architectural split in Khalil's separate simulator work.

## Future integration with the job-scheduler project

Proposed boundary (not an implemented API):

```text
Versioned scenario JSON
        |
        v
Experiment adapter  ----->  External simulation engine (optional)
        |
        v
Normalized events + per-job lifecycle + resource utilization
        |
        v
Learn explanation / Lab visualization / downloadable trace
```

- Keep lesson content and rendering decoupled from policy execution.
- Treat topology as an explicit graph with typed nodes/links, not a decorative rack picture.
- Provide units and assumptions for bandwidth, latency, contention and the meaning of "optimal".
- Compare only models with the same workload, topology, horizon and resource accounting rules.
- Never imply that a simulator experiment measures real NVIDIA DGX, InfiniBand/RoCE, Slurm or Kubernetes performance.

## Editorial and distribution loop

The proposed LinkedIn Page is a learning and discovery channel, not the entire product. Each post should point to a falsifiable observation inside SchedLab.

| Post | Interactive takeaway | Caution |
| --- | --- | --- |
| "My cluster is 50% free. Why is my job blocked?" | Free capacity differs from allocatable capacity | The slot topology is abstract |
| "Can backfilling make things worse?" | Immediate progress can conflict with fairness | Current backfill has no reservation guarantee |
| "Does a smarter placement heuristic always win?" | Sequence and workload change results | One scenario is not a general benchmark |
| "Why placement and scheduling are different" | Queue order and location selection are separate choices | No production Slurm/K8s integration |

Start with one useful article and a screenshot/GIF, then collect comments from systems engineers and learners. Do not optimize for follower count ahead of evidence that visitors understand the model.

## Engineering guardrails

- Pure deterministic engine first; user interface should not duplicate scheduling logic.
- Every bug fixed by a regression test when it concerns simulation semantics.
- Never claim performance, fairness or optimality without an explicit metric and stated inputs.
- No default storage of user jobs or telemetry; GitHub Pages remains static and credential-free.
- Keep the repository source-visible while the license remains an explicit owner decision.
- Prioritize small, testable improvements that fit alongside Khalil's job search and professional development.

## Open choices for the owner

1. Confirm SchedLab naming and eventual license.
2. Choose the second learning experiment after visitor feedback.
3. Decide when the larger Python/C++ simulator has a stable, public scenario/output contract suitable for integration.
4. Decide whether to keep all experimentation in-browser or eventually provide hosted replay for larger traces.
