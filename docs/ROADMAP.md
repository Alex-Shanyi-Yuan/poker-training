# Roadmap

The goal: a training app that helps the player master No-Limit Texas Hold'em.
The work is split into four sub-projects, built in order. Each one is its own
focused build, and each reuses the equity engine from Sub-Project 1.

Status legend: ✅ done · 🚧 in progress · ⬜ not started

## 1. Equity Calculator + Explanations ✅

Pick your hole cards and the board → live win/tie/loss %, your current hand,
and the **outs** that improve it (glowing on the deck), with rule-of-2/4 odds.

- **Done when:** engine tests pass against known benchmarks, and the app shows
  live equity + correct outs as cards change. _(Met.)_

## 2. Pot Odds & EV Trainer ⬜  ← next

Drill the core profitability decision: "Pot is \$100, opponent bets \$50 — call
or fold?" Show the pot odds, compare to the hand's equity (reuse
`src/engine/equity.ts`), and explain whether the call is +EV.

- **Scope:** pot/bet inputs → required equity % → compare to actual equity →
  call/fold verdict with the math shown. A drill mode that deals random spots
  and scores the user's choice.
- **Done when:** the trainer states the correct call/fold verdict with EV
  reasoning for a set of known spots, verified by tests.

## 3. Pre-flop Range Trainer ⬜

Drill which hands to open/raise/fold from each position — the biggest beginner
leak. Show a 13×13 starting-hand grid; quiz the user; score against a solid
default opening range per position.

- **Done when:** the grid renders correct default ranges per position and the
  quiz scores answers against them.

## 4. Scenario Quiz Engine + Progress Tracking ⬜

Deal a full situation, let the user choose an action, score it, and explain the
GTO/EV reasoning. Track stats (accuracy by concept) in `localStorage`.

- **Done when:** the engine deals scenarios, scores actions, and persists
  per-concept accuracy across reloads.

## Out of scope (whole project, for now)

Multi-user / accounts, real-money play, a native mobile app, and a full GTO
solver. The architecture leaves room for these but they are not planned builds.
