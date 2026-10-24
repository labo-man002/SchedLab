# Codex Cloud launch prompt — copy the text below

Use with the Codex Cloud environment connected to `labo-man002/SchedLab`.
Select the current `main` branch as the starting point. **The source below is the whole task prompt; the agent's deeper context is versioned in the repository.**

---

You are the autonomous implementation agent for **SchedLab**, `https://github.com/labo-man002/SchedLab`, a Learn-first educational platform for workload scheduling and resource placement.

**Mission:** Perform one bounded, approximately 4–5-hour engineering sprint to improve Experiment 001, prioritizing educational clarity, mobile/keyboard usability, deterministic behavior and auditable job lifecycles. Work iteratively, verify each meaningful increment, and produce a reviewable pull request. The goal is quality and completed milestones, not spending the full time regardless of results.

**Restore context before touching files:**

1. Read root `AGENTS.md`.
2. Read `docs/CODEX_HANDOFF/START_HERE.md` and the linked `PRODUCT_CONTEXT.md`, `ENGINEERING_BASELINE.md`, and `SPRINT_01.md` in full.
3. Consult `docs/MVP_SPEC.md`, `docs/ROADMAP.md`, and `docs/AUDIT.md` for prior decisions and known risks.
4. Inspect current code, tests, Git history and open PRs. The handoff was prepared against alpha 0.4; a newer branch may supersede it. Do not overwrite other work.

**Execution:**

- Follow the phase priorities and acceptance criteria in `docs/CODEX_HANDOFF/SPRINT_01.md`.
- First improve concrete accessibility and mobile issues found by inspection/testing.
- If feasible, add a compact per-job lifecycle view with truthful queued/running/completed timestamps and censored-wait labeling.
- Treat a custom scenario import/export schema as a stretch goal requiring validation and backwards compatibility, not as an excuse to rewrite the engine.
- Keep Learn and Lab as two views of one pure deterministic teaching engine. Preserve the 4×8 abstract-slot constraint, no-reservation backfill semantics, reset-to-T+00 behavior, fair comparison, and `v=1` preset links.
- Do not claim real GPU topology, network performance, Slurm/Kubernetes integration, or any production benchmark.
- Prefer vanilla HTML/CSS/JS, stable static GitHub Pages and no new dependencies, accounts, API credentials, analytics or paid services.
- Do not modify `labo-man002/job-scheduler` or import confidential source material.
- Do not choose a license or change branding, visibility, infrastructure or external services. Escalate material owner decisions and continue independent safe work.

**Quality gates and output:**

- Work on a separate branch. Make coherent commits. **Do not merge into `main` or publish live changes automatically.**
- Run `npm run check`, add regression tests for any engine changes, and perform desktop/mobile/keyboard browser smoke tests if tooling allows.
- Record precisely what was tested vs not tested. Avoid invented metrics and blanket accessibility claims.
- Produce `docs/CODEX_HANDOFF/SPRINT_01_REPORT.md` with outcomes, test evidence, limitations, decisions and next step.
- Open a pull request for owner review (or give a patch/link if PR creation is unavailable). Summarize implemented vs planned work and explain how to reproduce the demonstration.

**Working style:** Audit → select highest-impact issue → implement narrowly → test → document → proceed to the next milestone. Do not repeatedly restart from scratch or add speculative features to fill time. Stop at a coherent, verified endpoint or when a material permission/owner decision blocks further work.

---

## After the run

The owner should review the agent's PR, its test evidence and the learner-facing behavior. Only then merge to `main` and let GitHub Actions update Pages. The next task should start from the resulting branch/commit, not rerun an old prompt against the wrong state.
