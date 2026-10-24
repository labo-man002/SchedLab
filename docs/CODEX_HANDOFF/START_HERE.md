# SchedLab — autonomous coding-agent handoff

**Prepared:** 23 October 2026  
**For:** a Codex Cloud development task with a bounded, reviewable outcome  
**Repository:** https://github.com/labo-man002/SchedLab  
**Live educational prototype:** https://labo-man002.github.io/SchedLab/  
**Reference baseline:** alpha 0.4, commit `f1f869096566f6244be8c29bcbed2703ba2b258f`

> **Important:** This is the reference state at handoff, not a command to overwrite newer work.
> Before editing, inspect the current branch, pending pull requests, and latest tests.

## Start here, in order

1. **`AGENTS.md`** at the repository root — concise operating and safety rules.
2. **[`PRODUCT_CONTEXT.md`](PRODUCT_CONTEXT.md)** — why this product exists, audience, decisions, educational philosophy, longer-term direction, and explicit non-commitments.
3. **[`ENGINEERING_BASELINE.md`](ENGINEERING_BASELINE.md)** — actual code structure, model semantics, capabilities, test status, and gaps. Verify claims against current code.
4. **[`SPRINT_01.md`](SPRINT_01.md)** — the next autonomous development goal, priorities, acceptance criteria, boundaries, and expected handoff artifacts.
5. **[`LAUNCH_PROMPT.md`](LAUNCH_PROMPT.md)** — ready-to-paste instruction for the Codex task entry point.

The existing [`docs/MVP_SPEC.md`](../MVP_SPEC.md), [`docs/ROADMAP.md`](../ROADMAP.md), and [`docs/AUDIT.md`](../AUDIT.md) remain source material. This package consolidates context for an autonomous agent; it does **not** override executable source or tests.

## Product in one sentence

**SchedLab teaches engineers to reason about invisible workload-scheduling and placement decisions by predicting, simulating, inspecting, and reproducing small experiments.**

## What the next agent is expected to deliver

- Improve correctness, accessibility, and explanatory power of **Experiment 001: Why can't my job run?**
- Preserve the pure deterministic engine, reset behavior, controlled comparisons, and versioned share links.
- Add an auditable per-job lifecycle view **if** there is sufficient time after the first quality pass.
- Supply tests, reproducible browser QA evidence, honest docs, and a reviewable pull request.
- Never merge to `main`, change license/visibility, or expand into a backend without owner approval.

**The requested “4–5 hours” is a development budget, not a mandate to consume wall-clock time.** Stop at coherent, verified milestones. If the platform has a shorter execution limit, complete the highest-priority milestone and leave a clear next-action checklist.

## Terminology / evidence policy

- **Implemented:** directly present in source and covered by at least manual or automated checks.
- **Verified:** accompanied by the stated automated/browser/environment check.
- **Planned:** approved direction without working code.
- **Proposed / research:** potentially valuable, but not a requirement or truthful current capability.

Do not conflate the SchedLab educational model with the owner's separate, richer [`job-scheduler`](https://github.com/labo-man002/job-scheduler) project. Existing features in one repository do not imply features in the other.
