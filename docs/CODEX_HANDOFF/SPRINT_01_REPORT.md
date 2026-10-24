# Sprint 01 — lesson usability and auditable lifecycles

Date: 24 October 2026. Review branch: `codex/sprint-01`, based on current
`main` at `45b05da`. This report describes local implementation and validation,
not a production deployment. Nothing was merged into `main`.

## Learner question and completed scope

“Why did this job wait, when did it actually start, and can I inspect the answer
without a mouse?” Phases 0–2 are implemented; the optional scenario portability
phase is deferred. The full product/engineering/sprint handoff and MVP, roadmap
and audit were read before editing. The baseline passed 12 tests.

- **Keyboard/inspection:** kept rack buttons stable across ticks rather than
  replacing them (baseline reproduced focus moving to BODY). Enter/Space/touch
  exposes current slot details as visible text. Slot descriptions refresh from
  canonical occupancy. The guided lesson's final action moves focus to Lab's
  mode button instead of leaving it inside a hidden lesson.
- **Announcements:** replaced queue/event/diagnosis live-region overlap with a
  short explicit-action status. Automatic ticks do not announce every render;
  pause/reset/automatic stop report a summary. Share and quiz retain specific
  feedback. Auto-run exposes its pressed state.
- **Mobile/clarity:** fixed the floated quiz legend, which squeezed its first
  answer and caused page overflow when the quiz was open. Added native input
  focus styling, visible setting descriptions, taller controls and slots,
  higher-contrast free-slot numbers and supplementary metric labels, and dashed
  candidate borders. These are targeted changes, not a WCAG compliance claim.
  Replay charts offer expandable tick values for keyboard and non-hover use.
- **Lifecycle:** added pure `Engine.jobLifecycles(state)` with detached snapshots
  and an explicit initial-resident marker. An optional table below the lesson
  shows queued/running/completed jobs, actual timestamps, allocation and runtime.
  Initial residents show unknown prior queue waits; queued ages are “at least”
  lower bounds as of the current tick. Completed rows remain inspectable, and
  reset reconstructs the initial view. A labeled, focusable horizontal scroll
  region contains the table on narrow screens. No secondary event history exists.

## Verification

Runtime: Node 24.19.0, Python 3.12.14, Chromium 154.0.8037.57 on Linux.
No application dependencies were installed or added.

Commands:

```sh
npm run check
python3 -m http.server 8000 --bind 127.0.0.1 --directory site
# In another terminal; Playwright and /usr/bin/chromium were already available:
node tests/browser-smoke.cjs
git diff --check
```

`npm run check`: **15 passed, 0 failed, 0 skipped** (12 engine, 3 share),
plus syntax checks of engine/share/app. Three new regression tests cover resident
vs queue semantics, immutable derived snapshots, censored FIFO waits, real
backfill dispatch/completion ticks, retained allocations, custom submission time,
comparison independence and exact lifecycle reset.

The optional browser runner is not part of the dependency-free unit command.
It exits nonzero on an assertion or uncaught browser error; requires an existing
server, Playwright and Chromium. Override `BASE_URL` / `CHROMIUM_PATH` as needed.
Its current final run completed all groups successfully:

| Check | Local Chromium result |
| --- | --- |
| Initial fragmentation: 16 free, largest block 2, four-slot head | Passed |
| FIFO at T+01 / backfill after reset | Passed; FIFO queue 4, backfill queue 1 |
| Lifecycle queue/start/finish/resident labels and reset | Passed |
| Replay does not mutate live state; live ticks do not change replay | Passed |
| Auto-run silence / reset cancels timer and preserves policy | Passed; waited beyond timer interval |
| Slot Enter/Space inspection and focus across ticks | Passed |
| Guided lesson / quiz / hidden-lesson focus transition | Passed |
| Job submission and preset-share fallback / fresh-page restore | Passed; custom submission absent from shared preset |
| Tab traversal and visible focus on sampled controls | Passed; essential controls reached without trap |
| 1280×900 desktop, 375×900 and 320×900 mobile viewport | Passed; open quiz/table/replay, no page overflow |
| Keyboard scrolling of lifecycle table | Passed at 375 and 320 px |
| Touch slot inspection | Passed in 320 px Chromium mobile emulation |
| Reduced motion | Passed: smooth scroll and slot transitions disabled |
| Uncaught application browser errors | None in the tested main-page flow |

Screenshots are reproducible outputs in `/tmp/schedlab-sprint01-{1280,375,320}.png`;
these are local artifacts, not published images. The 320 px quiz was also
visually inspected after the float correction. Real devices, other browser
engines, actual screen-reader announcements and comprehensive contrast testing
are **not tested**. Clipboard-success permission behavior is not asserted; the
manual-copy fallback and resulting URL are tested.

## Compatibility and decisions

The four-rack/eight-slot model, non-preemptive tick order, no-reservation
backfill, T+00 reset, controlled replay cohort/mean wait and `v=1` URL contract
are unchanged. The selector reads engine timestamps; only preset residents gain
an explicit provenance flag. New user/job text uses `textContent`.

The lifecycle table is collapsed by default to keep Learn first; users can open
it in either mode. Completed jobs show historical allocation, not current slot
ownership. No schema, account, telemetry, backend, licensing, branding or cost
decision was made. Existing optional remote fonts remain unchanged.

## Review and external limitations

Git reads succeeded and remote `main` was rechecked at the same base SHA.
Both open-PR inspection (GraphQL and read-only REST) and `gh pr create` were
blocked by **Forbidden** responses from the GitHub API route. PR creation is
therefore unconfirmed/unavailable here; no pull request is claimed. The PR
creation attempt used the intended title/body and targeted `main` from the
review branch. This is an API access limitation, not an application/test failure.
A ready PR description and review patch are supplied outside the checkout as
fallback artifacts; branch publication status is reported in the task response.

The public Pages URL also returned proxy HTTP 403. Public behavior and Actions
deployment were not verified. No deployment was attempted.

## Not done and next increment

- Optional phase 3 JSON schema/import/export is deferred; a separate schema-first
  review should define bounds and validation without broadening preset URLs.
- No Gantt framework, second lesson or external simulator integration.
- Owner review and PR creation (if API access stays blocked), followed by an
  explicit merge decision, remain outstanding.

**Best next increment:** run a screen-reader lesson walkthrough (for example,
NVDA/Firefox or VoiceOver/Safari) and verify status cadence, lifecycle table
navigation and focus transitions; report concrete issues before extending scope.
