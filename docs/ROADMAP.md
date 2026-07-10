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

## 2. Pot Odds & EV Trainer ✅

Built quiz-first: a **Quiz mode** (header toggle) deals a random spot — hand,
board, pot, facing bet — with the equity hidden. Two graded steps per hand:
(1) estimate your equity from bands, (2) fold/check/call. The reveal shows the
worked path to the answer: outs count → rule of 2/4 → pot-odds breakeven
`bet/(pot + bet×(2+callers))` → verdict. Session stats + streak persist in
`localStorage`. Scenarios within 4pts of breakeven are re-dealt so every
question has a defensible answer.

- **Done when:** the trainer states the correct call/fold verdict with EV
  reasoning for a set of known spots, verified by tests. _(Met — see
  `src/engine/quiz.test.ts`.)_

## 3. Pre-flop Range Trainer ⬜  ← next

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
