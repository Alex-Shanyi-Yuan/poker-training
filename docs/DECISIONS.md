# Decisions

A short log of non-obvious choices and *why*, so future work doesn't re-litigate
them. Newest first. Add an entry when you make a choice a future reader would
otherwise question.

## 2026-07-09 · Quiz scenarios reject spots near breakeven (±4pts)

A quiz question whose equity sits at its pot-odds breakeven has no defensible
answer — grading it would punish correct reasoning. `generateGradedScenario`
re-deals any spot where |equity − breakeven| < 0.04 (comfortably above the
±0.7% Monte Carlo noise at 20k trials). Every question is therefore a clear
call or clear fold.

## 2026-07-09 · Quiz grading equity = win + tie/2

A tie is worth half the pot, so the call/fold verdict uses `win + tie/2`,
computed once at deal time and stored on the scenario — the reveal shows that
exact number, so the verdict and the displayed equity can never disagree.

## 2026-07-09 · ~15% of quiz deals are checked to you

When there's no bet, Check is trivially correct — but "never fold when
checking is free" is a real beginner lesson, so these spots appear
occasionally rather than never (button always visible, enabled only then) or
often (they carry no pot-odds math).

## 2026-07-09 · Separate quiz worker

Scenario generation runs the Monte Carlo per attempt (sometimes several, due
to ambiguity rejection), so it lives off-thread in `quiz.worker.ts` — kept
separate from `equity.worker.ts` so lab mode carries zero regression risk.

## 2026-07-09 · Outs require a category jump, not a kicker bump

A hand with a weak kicker (e.g. J2 with top pair) saw nearly every remaining
card counted as an "out" because swapping the 2 for anything made a "better"
five-card hand. An out now requires the hand *category* to strictly improve
(pair → two pair, trips…). Locked by the weak-kicker regression test.

## 2026-06-14 · Client-side only, no backend

The app is a single-user personal training tool, so all computation runs in the
browser. No server, no accounts, no database. Cheaper, simpler, works offline,
and there's no per-user data to store beyond `localStorage`.

## 2026-06-14 · Use `pokersolver` for hand evaluation

Ranking the best 5-card hand out of 7 is fiddly and well-solved. We wrap
`pokersolver` behind `src/engine/evaluator.ts` rather than reimplement it, so the
dependency is isolated and swappable. We build only the equity simulation and
the teaching layer on top.

## 2026-06-14 · Exact enumeration + Monte Carlo split

Exact enumeration gives precise equities but only stays cheap when the unknown
space is small (no random opponents, few board cards left). For everything else
(pre-flop, many opponents) we fall back to Monte Carlo. This gets exact answers
where it's affordable and good estimates everywhere else.

## 2026-06-14 · Hero-specific outs (category-beats-board rule)

First attempt counted any card that improved the hero's best hand → it reported
47 "outs" because pairing the board counts as an improvement. Fixed by requiring
the hero's hand category to exceed the board-with-that-card's category, so only
improvements coming from the hole cards count. Now matches textbook counts
(15 for nut-flush-draw + two overcards). Locked by tests.

## 2026-06-14 · Visual direction: "Equity Lab" instrument aesthetic

Chose a dark poker-felt / precision-instrument look over a flashy casino style,
because the app is a learning tool. Fraunces (display) + Inter (body) +
JetBrains Mono (numbers, for a gauge-like readout). The signature element is the
deck where outs glow gold — making the abstract concept of "outs" visible.

## 2026-06-14 · Equity runs in a Web Worker

A 20k-trial Monte Carlo with `pokersolver` blocks the main thread ~0.5–1s, which
killed the "live, instant" feel (and worsens with more opponents). Moved the
simulation to `src/engine/equity.worker.ts`; the cheap `explain()` stays on the
main thread so hand strength and outs still update instantly.
