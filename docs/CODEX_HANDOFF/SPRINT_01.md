# Autonomous development sprint 01 — strengthen the first lesson

**Target:** a bounded, approximately 4–5-hour coding-agent run, ending in a reviewable PR.  
**Status:** requested work, **not implemented** at the time this brief was prepared.  
**Priority:** reliability and explanatory clarity before ambitious topology features.

## Goal and user-visible outcome

An unfamiliar visitor should be able to open SchedLab on a laptop or phone, use the Learn lesson without inaccessible or confusing controls, understand why the large job is blocked, compare FIFO with backfill, and inspect each job's lifecycle without confusing waiting observations with completed waits.

**Definition of done for a strong sprint:** the public site remains static and responsive; one coherent Learn/Lab experience has visibly improved accessibility and auditability; all automated checks pass; and the owner receives a clear PR and verification report. Do not substitute the number of changed files for learning quality.

## Work plan (priorities, not a rigid timer)

| Phase | Rough effort | Work | Proof |
| --- | --- | --- | --- |
| 0. Baseline audit | 20–30 min | Read the handoff, inspect current branch/PRs, run tests, reproduce key flows | Concise findings and selected scope |
| 1. UX / accessibility | 75–100 min | Fix highest-impact keyboard, focus, live announcement, touch/mobile and reduced-motion issues | Before/after findings, keyboard and viewport checks |
| 2. Job lifecycle | 90–120 min | Implement a small, precise per-job timeline or lifecycle inspector without duplicating the engine | Pure tests and browser demonstration of queued/running/completed states |
| 3. Portable experiments | Remaining time if available | Specify JSON scenario schema and validation boundaries; implement import/export only if safe and complete | Schema example, negative tests, backwards compatibility |
| 4. QA / handoff | 25–40 min | Regression tests, responsive/browser smoke tests, docs, PR and report | Exact commands/results, limits and remaining work |

If time is short, finish phases 0–1 and leave phase 2 as a well-specified next PR. If one phase reveals a major model ambiguity, record it and prioritize other safe work. **Never ship a half-validated import feature simply because phase 3 was listed.**

## Phase 0 — establish the truth

- Read root `AGENTS.md`, `START_HERE.md`, `PRODUCT_CONTEXT.md`, `ENGINEERING_BASELINE.md`, `SPRINT_01.md` and the MVP/roadmap/audit docs.
- Check actual source files and `npm run check` against the documented baseline.
- Check whether another agent or user has pushed commits/opened a related PR since the handoff. Avoid overlapping branches or clobbering changes.
- Inspect the deployed Pages URL if browser/network access is available; distinguish local vs deployed version.
- Choose the smallest concrete accessibility fixes based on observed problems, **not** speculative WCAG compliance claims.

## Phase 1 — mobile, keyboard and semantic UX

### Required investigations

1. Keyboard-only path through mode switch, scenario/policy/placement selects, tick, auto-run, reset, queue form, lesson progression, quiz, share, comparison and slot inspection.
2. Visible focus indicator on actionable items; no keyboard trap or hover-only essential information.
3. Status and announcement clarity for ticking, resetting, changing mode, and checking an answer. Prevent excessive live-region chatter.
4. At minimum test one desktop viewport and narrow/mobile viewports around 375 px and 320 px if supported; check page overflow, control size and trace/table legibility.
5. Reduced-motion preference, contrast, accessible labels and heading structure; make measured fixes rather than adding decorative ARIA everywhere.
6. Reset semantics: after auto-run and policy changes, reset must stop the timer, preserve chosen policy, and return to T+00 with exact initial occupancy/queue.

### Acceptance criteria

- Every essential learning interaction is operable without a mouse.
- The user can obtain slot details by keyboard or visible text, not only `title` on hover.
- No meaningful information depends solely on color.
- The mobile page remains usable without horizontal page-level overflow; wide tables/graphs may have a clearly labeled contained scroll if needed.
- Any new announcements are understandable and non-repetitive.
- A browser QA matrix records **tested / failed / not available**, not guessed success.

## Phase 2 — auditable per-job lifecycle

### Minimal valuable slice

Create a clear view for the live experiment that distinguishes the current state of each job:

- **Initially running resident:** already occupies slots at T+00; do not imply it was dispatched by the experiment.
- **Queued / not started:** show submission time and “waiting at least N ticks as of T+M.”
- **Running:** show submission and actual start time, occupied rack/slots (if useful), and duration/remaining time.
- **Completed:** show submission, start and finish ticks, and observed wait `startedAt − submittedAt`.

A compact table or readable timeline is acceptable. Do not implement an enormous Gantt framework; favor a simple representation that makes one causal claim easier to inspect. For small screens, it must remain usable. Use the **canonical engine state** (or a pure derived selector on that state). Avoid a second event-history source that may disagree after reset.

### Acceptance criteria

- At T+00, preset queued jobs show `not started` with lower-bounded observed waiting, not a fictitious start/finish.
- After strict FIFO tick, head remains queued; later jobs do not claim a start.
- After resetting and advancing backfill, eligible tail jobs have correct `startedAt`, while head remains queued.
- When a job finishes, its `finishedAt` and observed wait stay visible; residents are explicitly distinguished.
- A reset reconstructs the original lifecycle view without stale rows or timestamps.
- Add pure tests for edge cases (no started jobs, finished jobs, queued jobs, unchanged state between comparison runs). No new unbounded arrays or hidden auto-dispatch.

### Guard against metric abuse

Do **not** replace the existing “mean wait of started jobs” with a naïve average that includes still-waiting jobs as zero or their current lower bounds. If exposing a second metric, label it as *current waiting age* for censored observations; explain the distinction. Do not claim that one finite-horizon trace establishes fairness guarantees or starvation.

## Phase 3 — optional scenario portability design

This is a **stretch goal**, not a prerequisite for a successful PR.

Before building an import UI, define and review a small schema:

- Schema/engine version identifiers independent of existing `v=1` preset URLs.
- Rack counts and slot boundaries that the current engine can actually support; avoid implying arbitrary topology if the engine is fixed at 4×8.
- Resident allocations, queued jobs, IDs/names/durations, and explicit initial clock semantics.
- Validation of integers, positive durations, slot duplication, contiguity, rack boundaries, unique identifiers and maximum input size.
- Refusal/feedback for invalid JSON; no script execution or unsafe HTML insertion.
- Deterministic canonical serialization and import/export roundtrip tests.

If an arbitrary topology requires changing engine constants/invariants, **pause implementation and submit an architecture proposal** rather than silently pretending the current engine supports it. A schema-first proposal with examples and tests is acceptable scope for this sprint.

## Test and QA contract

Run, at minimum:

```sh
npm run check
python3 -m http.server 8000 --directory site
```

Exercise in an actual browser, when available:

| Check | Expected |
| --- | --- |
| Initial fragmentation | 16 free of 32, largest contiguous block 2, queue head size 4 |
| Strict FIFO at T+01 | Head remains waiting; no smaller job jumps it |
| Backfill after reset | Smaller eligible requests start, head still waits |
| Reset from running | T+00 and original allocations/queue; no eager dispatch |
| Auto-run, then reset | Timer stopped; no subsequent surprise ticks |
| Share built-in preset | URL opens at T+00 with same configuration, no custom jobs |
| Comparison, then live tick | Replay results do not mutate live state |
| Keyboard and mobile | Essential controls and insights remain available |
| Job lifecycle (if built) | Correct queued/running/completed labels and censored waits |

If browser automation is unavailable, report which checks were manual, which were covered by tests, and which remain unverified. Do not silently mark unknown checks as passed.

## Required deliverables

1. **Review branch + pull request** targeting `main` (or a reviewable patch if the environment cannot open PRs). Do not merge.
2. Tested source changes in small coherent commits; include regression tests for model changes.
3. A succinct PR description: learner problem, solution, screenshots or behavior walkthrough, test commands/results, compatibility notes, known limitations.
4. An agent-written `docs/CODEX_HANDOFF/SPRINT_01_REPORT.md` in the branch: completed/partial/not done, exact check results, unresolved decisions, and the single best next milestone.
5. Updated product/technical docs wherever assertions changed; maintain a truthful implementation table.

## Stop / ask rules

Stop and request owner review for: brand or software license, new public services/costs, repository visibility, new credentials or data access, claims of real GPU/production semantics, importing third-party proprietary content, or integration that modifies the other repository.

For ordinary uncertain UI choices, select a conservative implementation, record assumptions in the PR, and proceed. If a permission or test-environment blocker prevents completion, report it explicitly and preserve completed work.

## A good final summary looks like

```text
PR: <link or explain unavailable>
Summary: <one-paragraph outcome>
Implemented: <bullet list with paths>
Validation: npm run check (N/N), browser checks (desktop / mobile / keyboard), failures or not tested
Assumptions and limits: <model and accessibility caveats>
Not done: <explicitly deferred work>
Owner decisions: <only material decisions>
Best next increment: <one scoped, testable action>
```
