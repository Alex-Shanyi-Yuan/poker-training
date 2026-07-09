# AGENTS.md

Guidance for AI coding agents (Cursor, Copilot, Codex, etc.).

**The canonical context lives in [CLAUDE.md](CLAUDE.md) and `docs/` — read those
first.** This file is a short, tool-agnostic pointer so nothing is lost if your
tool only reads `AGENTS.md`.

## What this is

**Equity Lab** — a client-side No-Limit Texas Hold'em training web app (React +
Vite + TypeScript). Personal, single-user, no backend. Sub-Project 1 (equity
engine + UI) is done; next is the Pot Odds & EV Trainer.

## Commands

```bash
npm install      # install dependencies
npm run dev      # dev server
npm test         # Vitest engine tests
npm run build    # type-check + production build
```

## Layout

- `src/engine/` — UI-free core (cards, evaluator, equity, explain, worker) + tests.
- `src/ui/` — React components.
- `docs/` — ROADMAP (what's next), ARCHITECTURE (how it fits), DECISIONS (why).

## Conventions

- TypeScript strict; keep the build clean.
- `engine/` must not import from `ui/`.
- Any engine change needs a Vitest test (see `src/engine/equity.test.ts`).
- When you finish work, update the status in `CLAUDE.md` and `docs/ROADMAP.md`
  (see "Keeping this current" in CLAUDE.md).
