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

## Structure

```text
site/
  index.html       UI and educational content
  styles.css       Responsive styles
  engine.js        Pure deterministic simulation engine
  app.js           Browser rendering and interactions
tests/
  engine.test.js   Engine and reset regression tests
docs/
  MVP_SPEC.md      Product definition, scope and acceptance criteria
  AUDIT.md         Initial audit and outstanding concerns
.github/workflows/
  pages.yml        Test and deploy to GitHub Pages
```

## GitHub Pages

The workflow runs tests, uploads the static `site/` directory and deploys on pushes to `main`. In the GitHub repository, set **Settings → Pages → Build and deployment → Source: GitHub Actions**. The expected URL for this project repository is `https://labo-man002.github.io/SchedLab/` once Pages reports a successful deployment.

See [GitHub's documentation on publishing with a custom Actions workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow).

## Product direction

The next step is not to pile on dashboards: it is to test whether one precise interactive experiment teaches a useful concept. Then expand into workload traces, topology-aware placement, fair policy comparisons and integration with the more capable simulator. See [MVP specification](docs/MVP_SPEC.md).

**Project status:** exploratory alpha. Branding and software license remain decisions for the maintainer; no third-party contributions are solicited yet.
