# Blazity Hackathon: AI for Content

**Ship an AI tool that solves a content problem people actually have.**

📅 Tuesday, 30th June · 🧭 Organised by Blazity

---

## One Idea, Every Format — MVP

Write a single content brief, pick your platforms (X, LinkedIn, Instagram,
Newsletter), and the app uses Anthropic Claude to adapt it into a
platform-tailored post for each — shown side by side in an editable review
dashboard. **Nothing is published automatically**; you review and edit every
post before it goes anywhere.

**Stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Anthropic
Claude (`@anthropic-ai/sdk`).

### Run locally

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

`ANTHROPIC_API_KEY` is read server-side only (in `app/api/generate/route.ts`)
and must never be committed — `.env.local` is git-ignored.

### Where things live

- `app/page.tsx` — Review Dashboard UI (compose + side-by-side cards)
- `app/api/generate/route.ts` — Claude call (structured JSON output)
- `lib/platforms.ts` — platform definitions + per-platform prompt rules (the
  one place to add a future image/video channel)
- `components/` — `brief-form`, `platform-selector`, `review-card`, `review-dashboard`

---

## The Challenge

People who work with words, images, or video drown in busywork: reformatting, off brand checking, asset hunting, keeping tone consistent. Exactly the work AI is now good at.

**Build a web app that uses AI to solve a real content management pain.**

"Content" is broad: posts, copy, docs, social, newsletters, subtitles, asset libraries. Pick a pain you understand and make it faster, clearer, or less error prone.

**What we're judging:** how you think, not how much you ship. A small tool that does one thing well and that you can explain and demo beats a sprawl nobody understands. Show that you aimed the AI at the right problem, checked its output, and chose what to build and what to skip.

---

## Getting Started

1. **Fork** this repository to your own GitHub account.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/blazity-hackaton.git
   cd blazity-hackaton
   ```
3. This repo is **already initialised with Atlas**. The `.ai/` workspace, `AGENTS.md`, and `CLAUDE.md` are in place. You don't need to set anything up to start.
4. **Your first task:** point your AI coding agent at the workspace so it adapts to _your_ idea. In Claude Code, run:
   ```
   /atlas:atlas-review
   ```
   Or tell any agent: _"Read `.ai/skills/atlas-setup/SKILL.md` and adapt this workspace to our project."_
5. **Build** with the stack of your choice: any language, any framework. Pick what lets you move fastest.

---

## Using Atlas

Atlas keeps the AI's work understandable and yours: the rules, decisions, and project context live in the repo (in `.ai/`), not buried in a chat history. As you work, your plans, decisions, and lessons accumulate where your agent can find them.

If anything looks off with the workspace, run:

```bash
npx --yes @blazity-atlas/core@latest doctor        # check workspace health
npx --yes @blazity-atlas/core@latest doctor --fix  # apply safe repairs
```

---

_Good luck, and build something real._
