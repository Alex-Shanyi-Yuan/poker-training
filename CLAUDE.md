# CLAUDE.md

Context for AI agents working in this repo. Start here, then follow the links
into `docs/`. (Human contributors: see [README.md](README.md).)

## Snapshot

**Equity Lab** — a browser-based No-Limit Texas Hold'em training app. Pick your
hole cards and the board; it shows your live chance to win, the hand you hold,
and the **outs** that improve it — teaching the *why*, not just the number.

It's a personal, single-user tool: pure client-side, no backend, no accounts.
The app has two modes: **Lab** (free exploration of any spot) and **Quiz**
(deal a spot with a pot and a bet → estimate your equity → fold/check/call →
graded feedback that teaches the estimation path). The work is a 4-part
roadmap; **Sub-Projects 1 (equity engine + UI) and 2 (pot odds quiz) are done.**

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
2. Pot Odds & EV Trainer (Quiz mode) — **✅ done**
3. Pre-flop Range Trainer — **⬜ next**
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

## Working in this repo (session knowledge)

Facts a fresh session needs but can't cheaply rediscover:

- **Dev preview:** `.claude/launch.json` defines the `poker-dev` server
  (`npm run dev`, port 5173). Use the browser preview tools against it and
  verify UI changes live before claiming they work.
- **Tests take ~7s** (Monte Carlo simulations). Equity assertions need
  tolerance bands — see `near()` in `src/engine/equity.test.ts`. Never assert
  exact floating-point boundary values (`0.29 − 0.25 < 0.04` is `true` in
  IEEE 754; test just inside/outside boundaries instead).
- **`computeEquity` is not seedable** (uses `Math.random` internally), so
  integration tests around it must be tolerance-based. Pure quiz logic takes
  an injectable `rng` — prefer testing through that.
- **Quiz stats** persist at localStorage key `equity-lab.quiz-stats.v1`.
- **Status lives in exactly two places:** this file's "Current status & next
  step" and the `docs/ROADMAP.md` checkboxes. README.md and AGENTS.md are
  deliberately status-free — don't add status claims to them.

## Current status & next step

**You are here:** Sub-Projects 1 and 2 are built and tested (38 passing tests).
Quiz mode deals pot-odds spots, grades an equity estimate + a fold/check/call
decision, and teaches the outs → rule-of-2/4 → breakeven estimation path.
**Next task:** Sub-Project 3 — **Pre-flop Range Trainer**. See its scope in
[docs/ROADMAP.md](docs/ROADMAP.md).

## Keeping this current

This is how the project stays resumable. When you finish a chunk of work, run
the `/handoff` command (defined in `.claude/commands/handoff.md`) or do its
steps by hand:

1. Confirm `npm test` and `npm run build` pass.
2. Update the status checkbox in **[docs/ROADMAP.md](docs/ROADMAP.md)**.
3. Update **Current status & next step** above.
4. Add an entry to **[docs/DECISIONS.md](docs/DECISIONS.md)** for any non-obvious
   choice a future reader would question.
5. Touch README.md / AGENTS.md **only if structure changed** (new files,
   commands, or conventions) — they carry no status by design.
6. **Commit and push.** Context only reaches other machines and future
   sessions once it's on GitHub — uncommitted work is invisible context drift.
