# Equity Lab — Poker Trainer

A browser-based No-Limit Texas Hold'em training tool with two modes:

- **Lab** — pick your hole cards and the board; see your live chance to win,
  the hand you currently hold, and the **outs** that improve it (glowing on
  the deck) — so you learn the *why*, not just the number.
- **Quiz** — the app deals a spot with a pot and a bet, hides the equity, and
  makes you (1) estimate your chance to win and (2) choose fold/check/call.
  The reveal grades both and teaches the estimation path: count outs → rule
  of 2/4 → compare to the pot-odds breakeven.

> **AI agents:** start with [CLAUDE.md](CLAUDE.md) for project context.

This is part of a four-part roadmap toward poker mastery — live status and
scope for each part: **[docs/ROADMAP.md](docs/ROADMAP.md)**.

1. Equity Calculator + Explanations
2. Pot Odds & EV Trainer
3. Pre-flop Range Trainer
4. Scenario Quiz Engine + Progress Tracking

## Run it

```bash
npm install
npm run dev      # open the printed localhost URL
```

```bash
npm test         # engine unit tests (equity benchmarks, outs, quiz math)
npm run build    # production build into dist/
```

## How it works

- **`src/engine/`** — the reusable core, with no UI dependencies.
  - `cards.ts` — card model and deck helpers.
  - `evaluator.ts` — thin wrapper over [`pokersolver`](https://www.npmjs.com/package/pokersolver) for ranking hands.
  - `equity.ts` — win/tie/loss via exact enumeration (small spaces) or Monte
    Carlo (everything else).
  - `explain.ts` — the teaching layer: hand strength, outs, and rule-of-2/4 odds.
  - `quiz.ts` — quiz scenarios: generation, pot-odds math, grading, stats.
  - `equity.worker.ts` / `quiz.worker.ts` — run the simulations off the main
    thread so the UI stays responsive.
- **`src/ui/`** — React components: the card picker/deck, hand and board
  zones, the equity readout (`ResultsPanel`), and the quiz flow (`QuizMode`).

The engine is verified against known benchmarks (AA vs KK ≈ 82/18, AKs vs 22 ≈
coin flip), the textbook out counts (nut flush draw + two overcards = 15), and
pot-odds anchors (call 50 into 100 → 25% breakeven).
