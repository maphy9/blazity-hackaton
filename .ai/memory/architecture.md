# Architecture

Intended architecture for the "One Idea, Every Format" content aggregator. The
application code is not yet scaffolded; this records the planned shape.

## Planned shape

- **Web app**: Next.js + TypeScript (React UI + server-side routes/actions).
- **AI provider**: Anthropic Claude via `@anthropic-ai/sdk` for per-platform
  generation. Default to the latest Claude models.
- **Core flow**:
  1. Brief input — user writes one idea/brief.
  2. Platform selection — user picks target channels (LinkedIn, Instagram,
     X/Twitter, newsletter, ...).
  3. Per-platform generation — one Claude call (or one per platform) produces
     content adapted to each platform's tone, length, and format.
  4. Preview/edit — user reviews and tweaks output before it goes anywhere.
  5. Optional publish — direct publishing to a platform via its API using
     user-supplied credentials.

## Constraints / invariants

- Anthropic API key and platform credentials are user-supplied and secret —
  never persisted in the repo; handle server-side, never expose in client code.
- AI output is always reviewable/editable before publish (judging values
  checking the AI, not blindly shipping it).

## Unknowns (fill once code lands)

- Persistence: database vs. in-memory/session-only for briefs and outputs.
- Auth / multi-user model.
- Hosting/deployment target.
- Which platform connectors are actually implemented for the demo.
- Per-platform prompt strategy (single multi-output call vs. fan-out per platform).
