# Product context, decisions, and future direction

**Status:** strategic background and explicit decisions through 23 October 2026. The owner, Khalil Ben Maaoui, should review major changes to this vision. Statements labeled *future* are not features to ship automatically.

## 1. How SchedLab emerged

The owner has hands-on experience with C++/Python systems, HPC workload management, Slurm integration, resource allocation, and topology-constrained placement. He also develops a separate, richer job-scheduling simulator. Those experiences exposed a recurring problem: people see a queue, a utilization percentage, or a cluster diagram, but not the constraints and decisions that produce the outcome.

We discussed turning that engineering knowledge into an **independent interactive educational platform**, potentially consisting of:

- A public website with memorable interactive lessons and experiments.
- An open, inspectable simulation engine and eventually reusable experiment definitions.
- A technically credible Lab layer for engineers to compare policies and explain surprising outcomes.
- Educational articles, a possible LinkedIn Page, and eventually a contributor/community loop.

The product is not merely a personal landing page, a static infographic, a clone of a scheduler dashboard, or a wrapper around the owner's existing simulator.

The owner accepted a **Learn-first** information architecture with both audiences served: approachable teaching first, substantial exploratory depth one click away. The website was scaffolded, audited and deployed to GitHub Pages on 23 October 2026. A reproducible reset bug was found and fixed during that process.

## 2. The unifying product thesis

> Scheduling and resource-placement behavior is easier to learn when learners can see the initial conditions, predict a decision, run a deterministic experiment, and interrogate the resulting trace.

The key asset is **a trustworthy explanatory loop**, not the complexity of the visualization.

Suggested learning cycle:

1. **Question:** “My cluster is 50% free. Why can't the job start?”
2. **Prediction:** Ask the visitor to commit to an explanation before revealing the outcome.
3. **Experiment:** Advance a well-defined model and see the queue/occupancy change.
4. **Comparison:** Hold initial conditions fixed and vary exactly one meaningful policy.
5. **Explanation:** Show the causal constraint, metrics, and important caveats.
6. **Understanding check:** A question tests whether the visitor grasps the mechanism.
7. **Exploration:** Lab exposes parameters and traces without switching to another model.

Not every future lesson needs identical steps, but it should have a falsifiable takeaway and explicit assumptions. Avoid claims like “X is faster” or “Y is optimal” without a specified workload, horizon, metric, and model.

## 3. Audiences and the shared engine

| Audience | Entry point | Value delivered | Implementation consequence |
| --- | --- | --- | --- |
| Student / curious developer | Guided Learn lesson | Understand FIFO blocking, fragmentation, placement and counterintuitive behavior | Clear language, progressive reveal, answer checks, accessible controls |
| HPC / distributed / AI infrastructure engineer | Lab and replay | Examine policies, trace lifecycles, reproduce assumptions, compare outcomes | Transparent state, constrained inputs, precise metrics and exportable experiments |
| Educator / technical communicator | Short demonstration | Teach a mechanism without setting up a cluster | Stable shareable setup, clear definitions, fast reset |

**One engine, two presentation modes.** Do not fork simulation logic or create disconnected data fixtures to make the educational story come out a particular way.

## 4. What makes a good SchedLab lesson

- The initial state and rules are visible enough to predict an outcome.
- The controls do what the label promises. Especially: **reset means the original T+00 state**, with no invisible dispatch.
- The explanatory claim is supported by the model's actual event sequence.
- A learner can repeat it without relying on a backend, secret, or specific machine.
- Differences are attributed to explicitly changed inputs, not accidental starting-state drift.
- Successful learning is more important than an elaborate animation or an impressive metric.
- The lesson clearly says which simplifications would be invalid for a real cluster.
- Lab's extra depth adds auditability; it does not bury a novice in knobs on the first screen.

## 5. Firm decisions made so far

| Topic | Decision | Consequence |
| --- | --- | --- |
| Audience priority | **Learn-first**, with **Lab** retained | Guided entry, advanced controls on same core model |
| Experiment 001 | Head-of-line blocking vs opportunistic backfill under fragmentation | Build understanding of total vs usable capacity |
| Deployment | Public repo + **GitHub Pages** | Static site; no required backend or paid infrastructure |
| Model design | Pure deterministic teaching engine | Replays, regression tests and no hidden scheduler state in the UI |
| Reset semantics | Reset restores T+00; dispatch only on a later tick | Preserve as a regression invariant |
| Comparison | Controlled FIFO/backfill replay from identical preset, heuristic and horizon | Avoid changing live state and report selection effects |
| Sharing | `v=1` preset URL, not free-form job state | Privacy and stable, limited semantics |
| Scope control | Small educational release first | Do not jump directly to GPU/cluster digital-twin implementation |
| Related simulator | Separate `job-scheduler` remains independent | Integrate only after an explicit adapter/schema contract |

## 6. Things **not** decided by the owner

- Final brand/name and trademark clearance; **SchedLab** is a working name.
- Open-source license; the repository is publicly readable, but **no license has been selected**. Do not assume “public” means a particular license or add one without explicit owner instruction.
- Long-term revenue model, accounts, paid hosting, analytics, or a commercial roadmap.
- Which second lesson to ship; candidates exist, but visitor/owner feedback should determine order.
- Whether richer simulation eventually runs in-browser, through WebAssembly, or in an optional service.
- Real cluster telemetry, Kubernetes operations, or production scheduler integration.

When these are relevant, document the options, trade-offs, and a recommendation. Don't silently make the choice.

## 7. Future intellectual directions — **not current capabilities**

These topics connect to the owner's wider work and could make the educational platform distinctive over time:

### Scheduling and placement as separate decisions

- Scheduler: when and in what order workloads are considered, and policy fairness/priority.
- Placer/allocator: where resources can be acquired given topology and constraints.
- Demonstrate cases in which a policy improves queue progress but cannot fix topology fragmentation, and vice versa.

### GPU / AI infrastructure topology

- Multiple resource types and locality domains (rack, node, accelerator, interconnect).
- Explicit topology graphs with typed links, rather than conflating rack proximity with connectivity.
- Future modeling of leaf–spine networks, bandwidth bottlenecks, latency, contention, NVLink/NVSwitch, InfiniBand/RoCE and GPU placement.
- Costs and communication penalties need units, measurable baselines, and careful validation.
- Show a specific scheduling tradeoff in distributed training or inference **only after** the model is specified.

### Simulation, observation, and feedback

- A longer-term research possibility is a loop between observed traces, simulator predictions, placement choices, and evaluation (what-if / digital-twin style).
- Do not imply live telemetry, feedback control, or predictive accuracy currently exists; those would require data sources, calibration, error bounds and separate operational decisions.

### Relation to `labo-man002/job-scheduler`

The owner's separate project contains richer scheduling/placement architecture and has explored GPU leaf–spine topology. It is **not imported by SchedLab today**, and its features must not be claimed as SchedLab's.

If an integration becomes appropriate, start with an explicitly versioned **scenario → normalized event trace** contract. Preserve determinism, unit definitions and a strict boundary between educational presentation and external policy execution. Do not modify, deploy or depend on the other repository during this sprint.

## 8. Distribution, learning feedback, and community

The proposed distribution loop is **experiment → explanation → feedback → improved lesson**:

1. Publish a small claim based on a repeatable SchedLab scenario (e.g., “Half the cluster is free; the head job still can't fit”).
2. Link directly to a shareable experiment instead of merely publishing a screenshot.
3. Explain one surprising observation and its limits in a concise technical article or LinkedIn post.
4. Ask readers where the explanation was unclear, and revise the lesson.
5. Consider reusable contributions only once format, moderation and quality gates are defined.

The LinkedIn Page, community, editorial calendar and product monetization are **proposals**, not launched infrastructure. Avoid adding tracking or newsletter systems to infer growth prematurely. Prefer meaningful comprehension feedback over vanity traffic metrics.

## 9. Presentation and engineering taste

The owner prefers direct, technically honest communication over buzzwords. Maintain an elegant visual identity but favor accessible interaction, legible diagrams, precise comparisons, readable code, and restrained scope. Do not fill empty space with speculative statistics, “AI powered” labels, or claimed real-world benchmarks.

Development should be sustainable alongside other priorities. Small, trustworthy increments with reproducible tests are preferable to a rushed full-stack build. Product decisions belong to the owner; ordinary implementation choices can be made autonomously and explained in the PR.

## 10. Confidentiality and provenance

This document summarizes earlier discussions and the public project direction; it is not a license to publish private employment material or proprietary system designs. The owner’s prior employer experience motivates the educational problem, but **do not copy private work code, internal protocol specifications, diagrams or credentials into this public repository**. Prefer generic examples, sources that are already public, and explicitly original teaching models.
