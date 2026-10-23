# SchedLab — MVP product specification (draft v0.1)

**Status:** working draft for Khalil's review — 23 October 2026  
**Working name:** SchedLab (not yet cleared for trademark/domain conflicts)  
**Product type:** Learn-first interactive engineering education with a deeper reproducible simulation Lab

## 1. Thesis

Workload scheduling and placement are difficult to understand because the most important state—resource constraints, topology, queue decisions and fragmentation—is often invisible. SchedLab makes those decisions inspectable through small, rigorous, interactive experiments.

The website is the learning and exploration interface. A separate, more capable [job scheduling simulator](https://github.com/labo-man002/job-scheduler) may eventually provide experiments through a stable adapter. A LinkedIn Page and technical articles should explain and distribute experiments, not substitute for the product.

## 2. Audiences and jobs-to-be-done

| Audience | Need | First useful outcome |
| --- | --- | --- |
| Student or early-career systems engineer | Understand why scheduling and allocation decisions behave unexpectedly | Explain head-of-line blocking and fragmentation after an interactive exercise |
| HPC / cluster / infrastructure engineer | Compare choices under repeatable workloads and constraints | Replay the same workload under two scheduling policies and understand metrics |
| Engineering educator | Demonstrate one concept live | Use a self-contained experiment with clear model assumptions |

**Product decision (23 October 2026):** lead with **Learn**—a clear question, a guided initial state, an explanation and a next action. **Lab** remains one click away for policy controls and independent investigations. Both are progressive layers on **one** model; do not build disconnected simulators for separate audiences.

## 3. MVP scope

### Must have — release 0.1

- Responsive site with recognizable project identity.
- One interactive experiment: **Why can't my job run?**
- Deterministic cluster state, visible job queue, occupied/free slots, and discrete simulation time.
- Strict FIFO and opportunistic backfill scheduling; first-fit and tightest-fit placement.
- Submit jobs, advance/pause/reset, inspect slot details and relevant metrics.
- Learn explanation and Lab explanation on the same state.
- Explicit assumptions, limitations and reproducible reset.
- Public GitHub repository, GitHub Pages deployment and regression tests.

### Should have — next iteration

- Scenario links or JSON import/export containing seed, topology, workload, policy and engine version.
- Side-by-side policy comparison from identical initial state.
- Job timeline/Gantt and summary metrics: waiting time, makespan, completion rate and utilization history.
- Better guided onboarding and mobile/accessibility verification.
- A second focused experiment about placement constraints across topology domains.

### Later, only after validation

- Network-aware placement with graph topology, weighted links, bandwidth constraints and contention.
- Additional scheduler policies, workload traces, pluggable engine integration and benchmark exports.
- Contributor lesson authoring, persistent scenarios, and accounts if real user needs justify them.

## 4. Non-goals for release 0.1

- A production scheduler, operational cluster-management tool or live telemetry dashboard.
- Claims of matching Slurm, Kubernetes, NCCL or GPU hardware semantics.
- Authentication, backend databases, paid plans, collaboration or user-generated public content.
- An unbounded visualization framework.

## 5. Engineering principles

1. **Model honesty:** define the invariants and abstraction boundary in the UI.
2. **Determinism:** same initial state and selected policy must yield the same event sequence.
3. **One source of truth:** a pure engine owns jobs and resource state; the UI only renders it.
4. **Fair comparisons:** reset between runs and report which inputs were held fixed.
5. **No invented benchmarks:** numbers are outputs of declared models, not measured real-cluster performance.
6. **Sustainable scope:** fit development around job-search priorities.

## 6. Current model contract

- Four racks × eight abstract slots; one slot is a teaching unit.
- A job requests 1–8 slots within one rack as a contiguous run.
- Jobs are non-preemptive and complete after integer ticks.
- FIFO: if queue head cannot fit, later work waits.
- Opportunistic backfill: scan queued jobs for the first that fits, without reservations or starvation guarantees.
- First-fit selects earliest qualifying free segment; tightest-fit selects the smallest qualifying segment.
- `reset` restores initial jobs and allocations at T+00 **without dispatching**, preserving the chosen policy/heuristic for a fair replay.

## 7. Release acceptance criteria

- [x] Fragmented preset has 16 free slots, largest contiguous block 2, and blocked four-slot head job.
- [x] Backfill can dispatch eligible tail jobs without violating occupancy constraints.
- [x] Job completion releases slots; a previously blocked job can eventually launch.
- [x] Reset reconstructs the exact scenario state, regardless of selected policy.
- [x] The pure engine has automated tests and the website has no build-time dependencies.
- [ ] Browser smoke test for the GitHub Pages version on desktop and mobile.
- [ ] GitHub Actions Pages deployment succeeds and publicly serves the site.
- [ ] Owner reviews the wording, brand name and intended license.

## 8. First distribution experiment

Publish one short LinkedIn demonstration: *"My cluster is 50% free. Why can't my job run?"* Include an animated or recorded before/after, a link to the interactive demo, and one takeaway about fragmentation. Link a longer article only if it adds engineering substance. Measure qualitative feedback, demo use and requests—not vanity follower counts alone.

## 9. Decisions for discussion

1. **Audience priority:** decided—Learn-first landing page, Lab still accessible on the same model. Revisit based on actual usage feedback.
2. **Brand:** keep SchedLab, choose another name, or extend the existing job-scheduler project identity?
3. **Simulator integration:** direct JS port, WebAssembly module, or remote experiment runner? Decide after a stable scenario schema exists.
4. **License:** MIT/Apache-2.0, source-available, or proprietary? Do not choose implicitly.
5. **Metrics:** which two or three quantitative outcomes matter most for experiment 002?

## 10. Suggested next milestone

One shareable, versioned scenario format plus a side-by-side FIFO/backfill replay that shows a waiting-time timeline and makes the comparison auditable. This would improve both Learn and Lab without broadening into unrelated infrastructure features.
