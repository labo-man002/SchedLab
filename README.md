# SchedLab

**Understand. Simulate. Experiment.**

SchedLab is an early, interactive educational laboratory about workload scheduling, resource placement and compute infrastructure. The **Learn-first** experience guides new visitors through a concrete scheduling puzzle; its Lab mode exposes the same model for independent experimentation:

- **Learn:** visual, guided explanations for students and engineers entering HPC and distributed infrastructure.
- **Lab:** transparent, reproducible experiments for experienced engineers who want to inspect policies and constraints.

## Experiment 001: Why can't my job run?

The current browser-based model has four racks of eight abstract slots. Every job requests a contiguous block within one rack. A fragmented cluster can therefore have ample free capacity without a valid placement for the first waiting job.

Try the same scenario with:

- **Strict FIFO** and **opportunistic backfilling** (without reservations).
- **First-fit** and **tightest-fit** placement.
- Different jobs, durations and predefined starting states.

Controls include manual time advancement, auto-run, job submission, reset and real-time metrics.

The guided lesson leads through three concrete steps: predict the FIFO outcome, observe head-of-line blocking, then replay the identical starting conditions with backfilling. Below it, the **fair replay** compares both policies over a selectable four-, eight-, or twelve-tick horizon. It reports how many queued jobs started or completed, their observed wait times, jobs still queued, and average occupied capacity. The replay runs independently of your live experiment.

At the end of the guided walkthrough, a one-question knowledge check tests the underlying reason for head-of-line blocking and gives immediate feedback. The lesson can be restarted without changing the comparison result.

The **Share this setup** control makes a portable, versioned URL for the selected built-in scenario, scheduling policy, placement heuristic and replay horizon. Opening the URL starts at T+00 with exactly those settings. The link does **not** include custom jobs you submitted or the current simulation tick. If the browser blocks clipboard access, the URL appears in a field for manual copying.

**How to interpret the numbers:** Average wait includes only jobs that started; waiting jobs are separately reported rather than assigned invented wait times. Occupancy includes initial resident jobs. Backfilling can help short jobs earlier while leaving a large job blocked, and any observed result applies to the chosen toy scenario and horizon only.

**Important:** this is a small client-side *teaching model*. A contiguous slot is an abstract constraint, not a physical claim about GPU connectivity. This app is not a performance benchmark or an integration with Slurm, Kubernetes, or the [separate job-scheduling simulator](https://github.com/labo-man002/job-scheduler).

## Run locally

No build step or dependencies are required for the website:

```bash
python3 -m http.server 8000 --directory site
```

Open `http://localhost:8000`.

Run deterministic engine tests (Node.js 20+):

```bash
npm test
```

## Inspect job lifecycles

Expand **Inspect job lifecycles · live experiment** below the lesson to see each
job's submission, start and finish ticks. Initial residents were already running
at T+00; their prior queue waits are unknown. An unstarted job shows a waiting
lower bound at the current observation tick, not its eventual wait. This live
view is independent of the controlled FIFO/backfill replay and resets with the run.
On narrow screens the table scrolls within a labeled, keyboard-focusable region.
Replay charts also offer **Read tick values** without relying on hover.

An optional browser regression check is available when Playwright and Chromium
are already installed (neither is a required application dependency):

```bash
# Keep the documented Python server running in another terminal.
node tests/browser-smoke.cjs
# Override BASE_URL or CHROMIUM_PATH when needed.
```

See `docs/CODEX_HANDOFF/SPRINT_01_REPORT.md` for scope, QA evidence and limitations.

## Structure

```text
site/
  index.html       UI and educational content
  styles.css       Responsive styles
  engine.js        Pure deterministic simulation engine
  share.js         Versioned, validated preset-link codec
  app.js           Browser rendering and interactions
tests/
  engine.test.js   Engine and reset regression tests
  share.test.js    Share-link validation and round-trip tests
docs/
  MVP_SPEC.md      Product definition, scope and acceptance criteria
  AUDIT.md         Initial audit and outstanding concerns
  ROADMAP.md       Decision boundaries, learning roadmap and next milestones
.github/workflows/
  pages.yml        Test and deploy to GitHub Pages
```

## GitHub Pages

The workflow runs tests, uploads the static `site/` directory and deploys on pushes to `main`. In the GitHub repository, set **Settings → Pages → Build and deployment → Source: GitHub Actions**. The expected URL for this project repository is `https://labo-man002.github.io/SchedLab/` once Pages reports a successful deployment.

See [GitHub's documentation on publishing with a custom Actions workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow).

## Working with coding agents

The [Codex development handoff](docs/CODEX_HANDOFF/START_HERE.md) gathers the project's background, settled decisions, technical baseline, next bounded sprint, and a [ready-to-paste launch prompt](docs/CODEX_HANDOFF/LAUNCH_PROMPT.md). Agents should also follow the short repository-wide rules in [AGENTS.md](AGENTS.md).

Autonomous agents should develop on review branches and propose pull requests, not merge directly into the `main` branch that deploys this website. The handoff deliberately distinguishes what the website currently implements from future ideas such as GPU network modeling or integration with the separate scheduler simulator.

## Product direction

The next step is to test whether one precise interactive experiment teaches a useful concept, then make the experiment shareable and inspectable. Later work can explore workload traces, topology-aware placement and integration with the more capable simulator. See [MVP specification](docs/MVP_SPEC.md) and [roadmap](docs/ROADMAP.md).

**Project status:** exploratory alpha. Branding and software license remain decisions for the maintainer; no third-party contributions are solicited yet.
