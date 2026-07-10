# AGENTS.md

Guidance for AI coding agents (Cursor, Copilot, Codex, etc.).

**The canonical context lives in [CLAUDE.md](CLAUDE.md) and `docs/` — read those
first.** This file is a short, tool-agnostic pointer so nothing is lost if your
tool only reads `AGENTS.md`. Project status lives ONLY in CLAUDE.md ("Current
status & next step") and `docs/ROADMAP.md` — do not trust status claims
anywhere else, including here.

## What this is

**Equity Lab** — a client-side No-Limit Texas Hold'em training web app (React +
Vite + TypeScript). Personal, single-user, no backend. Two modes: **Lab** (free
equity exploration) and **Quiz** (pot-odds decision drills).

## Commands

```bash
npm install      # install dependencies
npm run dev      # dev server
npm test         # Vitest engine tests
npm run build    # type-check + production build
```

## Layout

- `src/engine/` — UI-free core (cards, evaluator, equity, explain, quiz, the
  two workers) + tests.
- `src/ui/` — React components (Lab: App/ResultsPanel/useEquity; Quiz:
  QuizMode/useQuiz).
- `docs/` — ROADMAP (status + what's next), ARCHITECTURE (how it fits),
  DECISIONS (why).

## Conventions

- TypeScript strict; keep the build clean.
- `engine/` must not import from `ui/`.
- Any engine change needs a Vitest test (see `src/engine/*.test.ts`).
- When you finish work, follow "Keeping this current" in CLAUDE.md — update
  the status locations and **commit + push** so other sessions see it.
