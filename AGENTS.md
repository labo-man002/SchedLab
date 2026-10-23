# SchedLab — coding agent guidance

## Mission

Build a credible, **Learn-first** interactive education site for workload scheduling,
resource placement, and eventually topology-aware infrastructure experiments. `Learn`
guides a visitor through a falsifiable question; `Lab` offers reproducible controls over
the **same** simulation engine. Favor a clear, correct lesson over feature count.

Read `docs/MVP_SPEC.md` before changing product scope, `docs/ROADMAP.md` before starting
a new milestone, and `docs/AUDIT.md` when fixing a previously identified issue.

## Project map and checks

- `site/engine.js`: pure deterministic simulation and policy comparison.
- `site/app.js`: browser controls, rendering, explanations, and lesson progression.
- `site/share.js`: versioned, validated preset URL codec.
- `site/index.html`, `site/styles.css`: accessible, responsive interface.
- `tests/`: Node.js unit and regression tests.
- `.github/workflows/pages.yml`: tests and static GitHub Pages deployment from `main`.
- `npm run check`: required before proposing a change.
- `python3 -m http.server 8000 --directory site`: local preview.

## Non-negotiable behavior

1. One pure engine owns simulation state; the UI must not independently implement scheduling.
2. Preserve deterministic runs. Reset returns to T+00 without a hidden scheduling tick.
3. Controlled comparisons hold the starting state, placement heuristic, and horizon fixed;
   disclose observation bias (for example, mean wait only among jobs that started).
4. Current capacity is **four racks of eight abstract slots**, each job requiring a
   contiguous block in one rack. Backfill has **no reservations or starvation guarantee**.
5. Do not claim to simulate real GPU links, Slurm, Kubernetes, NCCL, network contention,
   or measured cluster performance. Those are future research directions.
6. Preserve `v=1` share-link semantics: initial built-in preset and selected controls only,
   never a live state snapshot or arbitrary user-entered job data.
7. Maintain keyboard accessibility, usable mobile layouts, and respectful reduced-motion
   behavior. Avoid credentials, tracking, cloud services, and new dependencies by default.
8. Do not select a public software license or change repository visibility without the
   maintainer's explicit decision.

## How to work

- Choose one bounded, reviewable improvement at a time; state the learner question it answers.
- Add regression tests for engine changes; run `npm run check` and use a browser smoke test
  for interactive UI changes when possible.
- Keep documentation truthful: label implemented, prototype, and planned capabilities.
- Do not overwrite unrelated work or rewrite history. Work on a branch and propose a PR
  when an agent is running autonomously; do not merge or deploy without review.
- Stop if a decision materially affects license, brand, infrastructure cost, access rights,
  user data, or the model's scientific assumptions. Record the choice and ask the maintainer.

## Suggested next work, in priority order

1. Verify/fix mobile, keyboard and screen-reader usability; create a repeatable smoke checklist.
2. Make experiments auditable with per-job life-cycle timelines and correct censored-wait labels.
3. Specify and implement a validated, versioned custom scenario JSON import/export format,
   separately from the compact `v=1` preset links.
4. Propose experiment 002 (placement choices or fairness) only after its assumptions,
   contrasting outcomes, and tests are explicit.

The separate `labo-man002/job-scheduler` repository is a potential future engine integration,
not a dependency. Do not change that repository as part of SchedLab work.
