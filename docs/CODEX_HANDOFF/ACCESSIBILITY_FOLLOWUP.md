# Accessibility follow-up — review report and speech checklist

Date: 24 October 2026. Branch: `codex/accessibility-followup`.
Base: merged Sprint 01, `67ef7c4` (PR #1).

## Learner problem and changes

A learner replaying a lesson should answer a fresh question rather than see a
previous attempt marked correct. Keyboard users should reach the simulator
without having to inspect 32 individual slots every time.

- Reproduced stale selected quiz answers and “Exactly” feedback after choosing
  FIFO, resetting the run, and replaying both guided steps. Reset/scenario changes
  now clear the answer and feedback, sharing the same helper as Restart lesson.
- Changing a quiz answer clears feedback for the previous selection, so a new
  wrong selection cannot remain visibly labeled correct before rechecking.
- Added a focus-visible **Skip to experiment** link and a visible **Skip slot
  inspection to simulation controls** link. Native anchors focus named targets;
  the next Tab reaches the relevant controls. Slots remain individually usable.
- Rack rows expose named groups with eight buttons each in Chromium's
  accessibility tree. These are groups of native buttons, not a custom ARIA grid.

Engine scheduling, lifecycle accounting, share URLs, replay and backend-free
operation are unchanged. No dependencies were added. No merge or deployment
is authorized by this work.

## Executed validation

```sh
npm run check
# Existing documented local server, serving this checkout:
python3 -m http.server 8000 --bind 127.0.0.1 --directory site
node tests/browser-smoke.cjs
git diff --check
```

- Unit/syntax gate: **15 tests passed, zero failed/skipped**; three JavaScript
  syntax checks passed. UI regressions are tested in the browser suite.
- Expanded Chromium suite: skip-link focus destinations and subsequent Tab;
  four named eight-button rack groups; described policy control; two initially
  exposed polite/atomic status regions; initially hidden quiz; labeled lifecycle
  region/table/column headers and waiting lower bounds in the accessibility tree.
- Quiz regressions: changed selection removes old feedback; reset/replay exposes
  no checked answer or stale feedback, and checking requires a fresh selection.
- Existing browser groups rerun: FIFO/backfill and lifecycle, independent replay,
  quiet automatic ticks and exact reset, keyboard inspection/focus, quiz/mode/job
  form, share fallback/roundtrip, tab traversal, 1280/375/320 px layouts, contained
  keyboard table scrolling, touch emulation and reduced-motion behavior.

Tooling: Node 24.19.0, Python 3.12.14, Chromium 154.0.8037.57, preinstalled
Playwright. Chromium accessibility-tree checks verify exposed semantics; they
**do not verify screen-reader speech**. Orca, NVDA/Firefox and VoiceOver/Safari
are unavailable in this Linux environment. No claim of full accessibility,
WCAG compliance, real-device behavior or public deployment is made.

## Screen-reader walkthrough — pending human/device execution

Use a fresh local page with either NVDA/Firefox on Windows or VoiceOver/Safari
on macOS. Record the exact OS/browser/screen-reader versions, date, actual
speech/focus result and pass/fail per row. Use ordinary screen-reader reading
commands for text, and its forms/interaction mode where needed. Expected results
below are a checklist, **not results already obtained**.

| Step | Expected behavior | Speech result |
| --- | --- | --- |
| First Tab; activate Skip to experiment | Arrive at named experiment; next Tab reaches Learn | Not tested |
| Activate Skip slot inspection | Arrive at Simulation controls; next Tab reaches Advance 1 tick | Not tested |
| Navigate one rack and activate a slot | Rack group and button identify rack/slot/current occupant; inspection detail is readable | Not tested |
| Advance strict FIFO one tick | One concise action summary; diagnosis explains blocked four-slot job and two-slot maximum when read | Not tested |
| Start automatic run, read nearby content, pause | No repeated tick announcements interrupt reading; pause reports current time/counts | Not tested |
| Reset and run both guided steps | Original state restored; FIFO/backfill explanation corresponds to actual run | Not tested |
| Answer quiz, change answer, recheck | Feedback refers to current selection; clearing old feedback does not leave an old correct answer announced as current | Not tested |
| Select FIFO, reset, repeat lesson | No selected answer/old feedback; checking asks for a selection | Not tested |
| Explore freely in Lab | Focus reaches Lab mode button; hidden lesson/quiz is absent from navigation | Not tested |
| Expand lifecycle and navigate table | Caption/current tick, row and column headers, unknown resident waits and lower-bounded queue waits make sense | Not tested |
| Compare policies; expand Read tick values | Controlled preset result is distinguished from live run; textual tick values readable | Not tested |
| Share setup with clipboard unavailable | Copy field gets focus; preset-only scope and fallback feedback understandable | Not tested |

Observe both speech and focus. Distinguish browser-dependent wording from missing
meaning. Document concrete failures before changing status cadence or adding ARIA.

## Handoff

Screen-reader speech remains the next validation step. Optional custom scenario
import/export and a second experiment remain deferred. The owner merged Sprint
01; historical baseline/report documents are retained as dated records.
