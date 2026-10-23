# SchedLab prototype audit — 23 October 2026

## Findings and actions

| Priority | Finding | Action |
| --- | --- | --- |
| High | **Reset seemed intermittent.** The old `initializeScenario()` immediately invoked the selected scheduling policy after rebuilding the initial state. Backfill could immediately fill slots at T+00, making the supposedly reset cluster look changed. | **Fixed.** Reset now reconstructs exactly the predefined cluster and queue without dispatch. Policies remain selected; the next advance dispatches work. Added regression tests. |
| High | The simulator and the DOM were intertwined in one large browser script. | **Fixed.** Extracted a deterministic engine with no DOM dependency; the UI is an adapter. |
| High | There was no automated regression coverage. | **Fixed.** Added Node built-in tests for fragmentation, dispatch, reset, placement and capacity invariants. |
| Medium | Changing a policy during a running simulation immediately dispatches eligible work, which is not a controlled comparison. | **Fixed in alpha 0.2.** Policy/placement changes now take effect on the next tick. A separate deterministic replay compares policies without mutating the live state. |
| Medium | The current algorithm uses opportunistic, no-reservation backfilling and a simplified rack-local contiguity constraint. | **Explicitly documented.** Do not call this EASY backfilling or real GPU-topology modeling. |
| Medium | Metrics initially covered instantaneous cluster state only. | **Partly addressed in alpha 0.2.** Controlled replays report initial-queue starts/completions, average wait of started jobs, average occupied capacity and queued jobs remaining. Distribution plots, makespan, fairness and network cost remain deferred. |
| Medium | The demo is not integrated with the separate scheduling-simulator repository. | **Deferred.** Keep adapters and reproducibility criteria in the MVP spec. |
| Low | A network request for Google Fonts is made, though local fallbacks exist. | **Accepted for alpha.** Consider self-hosted fonts or system fonts for offline/privacy goals. |
| Low | No accessibility automation, mobile device QA or performance testing has been added. | **Partly checked.** The guided lesson and comparison were tested by UI interactions in a desktop browser; mobile viewport and keyboard/screen-reader QA remain outstanding. |
| Low | Sharing a browser experiment could inadvertently leak submitted job descriptions if live state were serialized into the URL. | **Guarded in alpha 0.3.** Share links have a strict `v=1` allowlist for preset, scheduler, placement and replay horizon. Free-form job names, credentials and runtime state are never encoded. |

## Security/privacy notes

No authentication, cookies, personal-data collection, API keys or backend are present in this version. Job names from user actions are rendered using `textContent`; fixed informative HTML snippets are authored in source. External links open with `noopener noreferrer`.

## Acceptance checks performed

- Static syntax validation and automated engine and preset-link regression tests.
- Previously deployed prototype visually inspected at desktop width; job backfilling and releases exercised interactively.
- New repository version smoke-tested in a local browser preview: backfilling advanced the model, then reset restored the original eight running jobs, four queued jobs, 16 free slots and T+00 while retaining the selected policy.
- GitHub Pages version still requires desktop and mobile smoke tests after deployment.

This is a focused audit, not a claim of exhaustive security, accessibility or mathematical verification.
