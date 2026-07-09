# CLAUDE.md

Context for AI agents working in this repo. Start here, then follow the links
into `docs/`. (Human contributors: see [README.md](README.md).)

## Snapshot

**Equity Lab** — a browser-based No-Limit Texas Hold'em training app. Pick your
hole cards and the board; it shows your live chance to win, the hand you hold,
and the **outs** that improve it — teaching the *why*, not just the number.

It's a personal, single-user tool: pure client-side, no backend, no accounts.
The work is a 4-part roadmap; **Sub-Project 1 (the equity engine + UI) is done.**

## Commands

```bash
npm install      # install dependencies
npm run dev      # start the dev server (open the printed localhost URL)
npm test         # run the Vitest engine tests
npm run build    # type-check + production build into dist/
```

## Architecture (map)

- **`src/engine/`** — UI-free core: card model, hand evaluation (`pokersolver`),
  equity (exact enumeration + Monte Carlo), and the outs/odds explanation layer.
  Runs the heavy simulation in a Web Worker.
- **`src/ui/`** — React components: the deck/card picker, hand & board zones,
  opponent control, and the equity readout.

Full detail, data flow, and the subtle outs logic: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

## Roadmap

1. Equity Calculator + Explanations — **✅ done**
2. Pot Odds & EV Trainer — **⬜ next**
3. Pre-flop Range Trainer — ⬜
4. Scenario Quiz Engine + Progress Tracking — ⬜

Scope and "done when" for each: **[docs/ROADMAP.md](docs/ROADMAP.md)**.
Why things are built the way they are: **[docs/DECISIONS.md](docs/DECISIONS.md)**.

## Conventions

- **TypeScript strict.** Keep `npm run build` (which runs `tsc`) clean.
- **`engine/` never imports from `ui/`.** The engine stays UI-free so every
  future trainer can reuse it.
- **Any engine change needs a Vitest test.** Equity/outs correctness is verified
  against known benchmarks in `src/engine/equity.test.ts` — extend it.
- **Design language:** dark poker-felt / instrument aesthetic; Fraunces
  (display) + Inter (body) + JetBrains Mono (numbers). Tasteful motion only.

## Current status & next step

**You are here:** Sub-Project 1 is built, tested (12 passing tests), and pushed.
**Next task:** Sub-Project 2 — **Pot Odds & EV Trainer** (reuses
`src/engine/equity.ts`). See its scope in [docs/ROADMAP.md](docs/ROADMAP.md).

## Keeping this current

This is how the project stays resumable. When you finish a chunk of work:

1. Update the status checkbox in **[docs/ROADMAP.md](docs/ROADMAP.md)**.
2. Update **Current status & next step** above.
3. Add an entry to **[docs/DECISIONS.md](docs/DECISIONS.md)** for any non-obvious
   choice a future reader would question.
