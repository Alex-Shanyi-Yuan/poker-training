# Architecture

A pure client-side web app — no backend, no accounts, all computation in the
browser. React + Vite + TypeScript, styled with Tailwind, animated with Framer
Motion. Hand ranking uses the `pokersolver` library; everything else is ours.

## Layers

```
src/
  engine/            UI-free core (no React imports) — the reusable brain
    cards.ts         Card model, 52-card deck, parse/format helpers
    evaluator.ts     Thin wrapper over pokersolver (best 5-of-7, compare hands)
    equity.ts        Win/tie/loss via exact enumeration or Monte Carlo
    explain.ts       Teaching layer: current hand, outs, rule-of-2/4 odds
    equity.worker.ts Runs equity.ts off the main thread
    *.test.ts        Vitest tests (equity benchmarks, outs counting)
  ui/                React components (may import from engine/, never vice versa)
    App.tsx          Orchestrates state: hero cards, board, opponents, deck
    PlayingCard.tsx  A single rendered card + empty-slot placeholder
    ResultsPanel.tsx The equity readout: big %, segmented bar, outs, coaching
    useEquity.ts     Hook: runs explain() inline, posts equity to the worker
  main.tsx           React entry point
  index.css          Tailwind layers + base/felt styling
```

**Rule:** `engine/` never imports from `ui/`. Keeping the engine UI-free is what
lets every future trainer (pot odds, ranges, quizzes) reuse it.

## Data flow

1. `App.tsx` holds the situation: `hero` cards, `board` cards, `randomOpponents`.
   Clicking a deck card places it; the picker highlights cards that are outs.
2. `useEquity(situation)` reacts to changes:
   - Runs `explain()` **on the main thread** immediately (it's cheap — hand
     strength + outs + odds), so the readout and glowing outs update instantly.
   - Posts the heavy equity request to **`equity.worker.ts`** (debounced). The
     worker replies with win/tie/loss; stale replies are ignored via a request id.
3. `ResultsPanel.tsx` renders the result + explanation.

## Equity strategy (`equity.ts`)

- **Exact enumeration** when there are no random opponents and the remaining
  board space is small enough — enumerates every run-out for a precise answer
  (e.g. AhKh vs a known hand on the turn).
- **Monte Carlo** otherwise — samples many complete run-outs and averages.
  Default ~20k samples in the live UI, more in tests for tighter accuracy.

## The outs definition (`explain.ts`) — important, subtle

An "out" is a card that improves **your** hand via **your hole cards** — not a
card that merely improves the community board (which would help everyone). We
detect this by comparing, for each remaining card, the hero's best-hand
**category** to the **board-with-that-card's** category: if the hero reaches a
higher category, the extra strength came from the hole cards, so it's an out.

This yields the textbook counts (e.g. nut flush draw + two overcards = 15 outs)
instead of naively counting every card that pairs the board (which wrongly gave
47). See the test `does not count pairing the board as an out`.
