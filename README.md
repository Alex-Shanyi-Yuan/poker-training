# Equity Lab — Poker Trainer

A browser-based No-Limit Texas Hold'em training tool. Pick your hole cards and
the board, and it shows your live chance to win, the hand you currently hold,
and the **outs** that improve it — so you learn the *why*, not just the number.

This is **Sub-Project 1** of a four-part roadmap toward poker mastery:

1. **Equity Calculator + Explanations** ← you are here
2. Pot Odds & EV Trainer
3. Pre-flop Range Trainer
4. Scenario Quiz Engine + Progress Tracking

## Run it

```bash
npm install
npm run dev      # open the printed localhost URL
```

```bash
npm test         # engine unit tests (equity benchmarks, outs counting)
npm run build    # production build into dist/
```

## How it works

- **`src/engine/`** — the reusable core, with no UI dependencies.
  - `cards.ts` — card model and deck helpers.
  - `evaluator.ts` — thin wrapper over [`pokersolver`](https://www.npmjs.com/package/pokersolver) for ranking hands.
  - `equity.ts` — win/tie/loss via exact enumeration (small spaces) or Monte
    Carlo (everything else).
  - `explain.ts` — the teaching layer: hand strength, outs, and rule-of-2/4 odds.
  - `equity.worker.ts` — runs the simulation off the main thread so the UI
    stays responsive.
- **`src/ui/`** — React components: the card picker/deck, the hand and board
  zones, the opponent control, and the equity readout (`ResultsPanel`).

The engine is verified against known benchmarks (AA vs KK ≈ 82/18, AKs vs 22 ≈
coin flip) and the textbook out counts (nut flush draw + two overcards = 15).
