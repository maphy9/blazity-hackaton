# Project AI Instructions

## What this repo is

`blazity-hackaton` — a Blazity hackathon project building an **AI content
marketing aggregator**: "One Idea, Every Format." A user writes a single content
brief once and selects target platforms (e.g. LinkedIn, Instagram, X/Twitter,
newsletter); the app uses AI to adapt tone, length, and format for each platform,
with optional direct publishing via user-supplied platform API credentials.
Future direction includes AI image and video generation from the same brief.

Stack is Next.js + TypeScript with Anthropic Claude as the AI provider. As of the
last setup the application code is not yet scaffolded. See `.ai/memory/` for
stable context.

## Structure

- `.ai/` — Atlas AI workspace. `.ai/config.json` is the source of truth for
  artifact locations (memory, vocabulary, plans, research, decisions, results).
- `AGENTS.md` / `CLAUDE.md` — agent instructions; `CLAUDE.md` imports this file.
- `.agents/`, `.claude/`, `.cursor/` — generated agent surfaces.

## Working rules

- Stack is Next.js + TypeScript with Anthropic Claude (`@anthropic-ai/sdk`).
  Default to the latest Claude models (Opus 4.8 / Sonnet 4.6) for generation.
  The app is not yet scaffolded — confirm exact run/test/build commands once a
  `package.json` exists, and keep `.ai/memory/stack.md` current.
- Never commit secrets. Platform API credentials and the Anthropic API key are
  user-supplied at runtime via env / app input — keep them out of the repo.
- Atlas tooling is safe: `npx --yes @blazity-atlas/core@latest doctor` checks
  workspace health.
- Do not edit the `<!-- BEGIN/END ATLAS -->` managed block below by hand.
- Keep durable docs depersonalized (see Atlas Documentation Rules below).

<!-- BEGIN ATLAS: artifact-paths -->
## Atlas Artifact Paths

`.ai/config.json` is the source of truth for AI artifact locations in this repository.
Before writing plans, research, decisions, ADRs, results, memory, vocabulary, or skill outputs, resolve the destination through `artifactRoot`, `paths`, and `pathAliases`.
If an imported skill, template, or instruction mentions a different path, map it through `.ai/config.json` before reading or writing files.
Do not create new documentation roots unless `.ai/config.json` explicitly allows them.

## Atlas Documentation Rules

Durable documentation records needs, decisions, and reasons — never individuals or internal process.
Write "memory was needed to persist context across runs", not "<name> wanted memory".
Keep personal names, private schedules, internal-only references, and absolute local paths out of workspace artifacts.
<!-- END ATLAS: artifact-paths -->
