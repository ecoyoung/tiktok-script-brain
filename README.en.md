**English** | [简体中文](README.md)

# TikTok Script Brain

A TikTok content production system for internal team collaboration, targeting the US TikTok market by default and standardizing on `DeepSeek v4`.

For detailed operating instructions, see [OPERATION_GUIDE.md](/Volumes/Ethank/TikTok%20Script%20Brain/OPERATION_GUIDE.md).

## Directory Structure

- `core/`: Prompts for generation, review, revision, and competitor preprocessing
- `knowledge/`: Long-term maintained style library
- `inputs/`: Template files
- `products/`: Knowledge assets per product
- `tasks/`: Single-task / batch-task configs
- `outputs/`: Output of each run
- `archives/`: Historical high-performing scripts and retrospectives
- `app/` + `components/` + `lib/`: Next.js web console

## Project Architecture

The system currently follows a "knowledge assets + CLI pipeline + Next.js console" structure:

1. `products/` + `knowledge/`
   Holds long-term knowledge, including product profiles, audience insights, competitor analysis, and style constraints.
2. `inputs/` + `tasks/`
   Holds per-run inputs, including script parameters, task JSON, and batch task JSON.
3. `run.js`
   The core executor, responsible for:
   - Reading product and task inputs
   - Calling DeepSeek
   - Running `generate -> review -> revise`
   - Writing outputs
   - Updating indexes
   - Optionally archiving high-performing scripts
4. `report.js`
   Generates retrospective reports based on `outputs/index.json` and `archives/high_performers/index.json`.
5. `app/` + `components/` + `lib/`
   The Next.js workbench, handling product profile editing, task launching, result review, performance backfill, and report preview.
6. `outputs/` + `archives/high_performers/` + `reports/`
   Respectively handle day-to-day output, high-performer asset retention, and retrospective rollups.

The web version does not change the core pipeline; it still reuses `run.js` / `report.js` directly.

## Quick Start

1. Copy `.env.example` to `.env` and fill in `DEEPSEEK_API_KEY`
2. Prepare product materials in `products/example_product/`
3. Review `inputs/script_parameters_template.md`
4. Run:

```bash
node run.js --product example_product --params inputs/script_parameters_template.md
```

## Optional Parameters

```bash
node run.js \
  --product example_product \
  --params inputs/script_parameters_template.md \
  --competitor products/example_product/competitor_processed.md \
  --output outputs/custom_output.md \
  --archive
```

Task config files are also supported:

```bash
node run.js --task tasks/example_task.json
```

Batch tasks are also supported:

```bash
node run.js --batch tasks/example_batch.json
```

Post-archive performance backfill:

```bash
node run.js --updateMetrics tasks/example_metrics.json
```

Competitor raw-script preprocessing:

```bash
node run.js --preprocessCompetitor inputs/competitor_raw_template.md --output products/example_product/competitor_processed_from_raw.md
```

Generate a retrospective report:

```bash
node report.js
```

## Web Console

Install dependencies:

```bash
npm install
```

Start:

```bash
npm run dev -- --port 3005
```

The web console covers these common operations:

- Creating product directories
- Maintaining `product_brief` / `audience_insight` via forms
- Manually maintaining processed competitor analyses
- Launching single tasks
- Running batch tasks
- Pasting competitor raw scripts directly and preprocessing them
- Backfilling performance data for archives
- Generating retrospective reports
- Review decisions at the task / script level
- Final-draft comparison and primary-version selection

## Task Config

Example single-task config:

```json
{
  "label": "Closet organizer - 30s test",
  "product": "example_product",
  "params": "inputs/script_parameters_template.md",
  "competitor": "products/example_product/competitor_processed.md",
  "output": "outputs/example_task_output.md",
  "archive": true,
  "archiveNotes": "Selected by creative lead for strong native hook quality.",
  "archiveTags": ["hook_test", "us_native", "home_org"]
}
```

Example batch config:

```json
{
  "tasks": [
    {
      "label": "Task A",
      "product": "example_product",
      "params": "inputs/script_parameters_template.md"
    },
    {
      "label": "Task B",
      "product": "example_product",
      "params": "inputs/script_parameters_template.md",
      "output": "outputs/task_b.md"
    }
  ]
}
```

## Outputs

Each run produces one Markdown file containing:

- Task metadata
- The raw generated script (Markdown-table storyboard format)
- The review report
- The revised final draft (Markdown-table storyboard format)

It additionally maintains:

- `outputs/index.json`: a structured index of all historical tasks
- `outputs/index.md`: a task ledger the team can browse directly

If archiving is enabled for a task:

- `archives/high_performers/index.json`
- `archives/high_performers/index.md`
- `archives/high_performers/packages/*.md`
- `archives/high_performers/metadata/*.json`

## High Performers Archive

When a task's output is worth keeping long term, you can:

- Add `--archive` in single-command mode
- Set `"archive": true` in a `task` or `batch` config

Archive packages retain:

- The final script
- A review snapshot
- Archive notes
- Delivery performance fields backfilled manually later

## Performance Update

After archiving, delivery results can be backfilled via a JSON file, and the system updates in sync:

- Archive metadata
- The archive package Markdown
- The high performers index
- Performance status in the output index

Example:

```json
{
  "archiveSlug": "2026_05_11_example_product_example_product_30s_native_hooks",
  "status": "validated_winner",
  "views": "128000",
  "holdRate3s": "41%",
  "completionRate": "23%",
  "ctr": "2.8%",
  "cvr": "4.1%",
  "commentSignals": "People kept mentioning the first-line hook felt real.",
  "creativeTakeaway": "Pain-first hook with casual closet language beat aesthetic-first versions."
}
```

## Competitor Raw Preprocess

If what you have is the raw voice-over script of a competitor video rather than an already-prepared analysis card, run the preprocessing command first.

Input:

- Competitor brand / account
- Category
- Link / source
- Raw English or Spanish script

Output:

- An LLM-structured competitor analysis

Command:

```bash
node run.js --preprocessCompetitor inputs/competitor_raw_template.md --output products/example_product/competitor_processed_from_raw.md
```

Then, in the actual task, simply point `competitor` at this processed file.

`inputs/competitor_processed_template.md` is not the everyday entry point by default; it mainly serves as a structural reference and a manual fallback template.

## Reporting

The system can generate retrospective reports directly from the indexes, suitable for weekly team meetings, daily stand-ups, and single-product reviews.

Common usage:

```bash
node report.js
node report.js --product example_product
node report.js --dateFrom 2026-05-01 --dateTo 2026-05-31
```

Reports aggregate:

- Total number of tasks
- Number of archives
- Distribution of performance statuses
- Task volume per product
- Number of high-performer assets
- Recent high-performer creative takeaways

## Design Principles

- Layered separation of knowledge assets and task execution
- Clear team collaboration roles
- A closed `generate -> review -> revise -> finalize` loop
- Decoupled model configuration and business logic

For detailed design, see [tiktok_script_brain.md](/Volumes/Ethank/TikTok%20Script%20Brain/tiktok_script_brain.md).
