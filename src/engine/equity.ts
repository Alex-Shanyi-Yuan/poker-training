// Equity computation: how often does the hero's hand win, tie, or lose by the
// river, given the known cards and the opponents?
//
// Two strategies:
//   - Exact enumeration when the only unknown is the remaining board and every
//     opponent hand is specified (and the number of board combinations is
//     small). This gives a precise answer, e.g. AhKh vs a known hand on the
//     turn.
//   - Monte Carlo otherwise (random opponents, or a pre-flop space too large to
//     enumerate). We sample many complete run-outs and average the result.

import { Card, deckWithout } from "./cards";
import { compareHands, evaluate, Outcome } from "./evaluator";

export interface EquityInput {
  hero: [Card, Card];
  board: Card[]; // 0, 3, 4, or 5 cards
  /** Number of opponents whose hole cards are unknown (drawn at random). */
  randomOpponents: number;
  /** Opponents whose exact two hole cards are known. */
  knownOpponents?: [Card, Card][];
  /** Monte Carlo sample count when enumeration isn't used. */
  trials?: number;
  /** Max board-combinations to enumerate exactly before falling back to MC. */
  maxExactCombos?: number;
}

export interface EquityResult {
  win: number; // fraction 0..1
  tie: number;
  loss: number;
  /** Number of run-outs evaluated (combinations or MC samples). */
  samples: number;
  /** True when computed by exact enumeration rather than sampling. */
  exact: boolean;
}

const DEFAULT_TRIALS = 100_000;
const DEFAULT_MAX_EXACT = 200_000;

function tally(hero: Card[], opponents: Card[][]): Outcome {
  const heroHand = evaluate(hero);
  const oppHands = opponents.map((o) => evaluate(o));
  return compareHands(heroHand, oppHands);
}

/** Yield every k-sized combination of `items` (indices preserved in order). */
function* combinations<T>(items: T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (k > items.length) return;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    yield idx.map((i) => items[i]);
    let pos = k - 1;
    while (pos >= 0 && idx[pos] === items.length - k + pos) pos--;
    if (pos < 0) return;
    idx[pos]++;
    for (let j = pos + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
}

function nCr(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

function fractions(
  counts: Record<Outcome, number>,
  total: number,
  exact: boolean
): EquityResult {
  return {
    win: counts.win / total,
    tie: counts.tie / total,
    loss: counts.loss / total,
    samples: total,
    exact,
  };
}

export function computeEquity(input: EquityInput): EquityResult {
  const {
    hero,
    board,
    randomOpponents,
    knownOpponents = [],
    trials = DEFAULT_TRIALS,
    maxExactCombos = DEFAULT_MAX_EXACT,
  } = input;

  const used: Card[] = [...hero, ...board, ...knownOpponents.flat()];
  const remaining = deckWithout(used);
  const boardNeeded = 5 - board.length;
  const counts: Record<Outcome, number> = { win: 0, tie: 0, loss: 0 };

  // --- Exact enumeration path -------------------------------------------
  // Only when there are no random opponents (otherwise we'd also have to
  // enumerate their holdings, which explodes) and the board space is small.
  const canEnumerate =
    randomOpponents === 0 &&
    nCr(remaining.length, boardNeeded) <= maxExactCombos;

  if (canEnumerate) {
    let total = 0;
    for (const fill of combinations(remaining, boardNeeded)) {
      const fullBoard = [...board, ...fill];
      const outcome = tally(
        [...hero, ...fullBoard],
        knownOpponents.map((o) => [...o, ...fullBoard])
      );
      counts[outcome]++;
      total++;
    }
    return fractions(counts, total, true);
  }

  // --- Monte Carlo path -------------------------------------------------
  const totalOpponents = randomOpponents + knownOpponents.length;
  for (let t = 0; t < trials; t++) {
    // Partial Fisher–Yates: draw only the cards we need from a fresh copy.
    const deck = remaining.slice();
    const drawNeeded = boardNeeded + randomOpponents * 2;
    for (let i = 0; i < drawNeeded; i++) {
      const j = i + Math.floor(Math.random() * (deck.length - i));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    let cursor = 0;
    const fullBoard = [...board];
    for (let i = 0; i < boardNeeded; i++) fullBoard.push(deck[cursor++]);

    const oppHoles: Card[][] = knownOpponents.map((o) => [...o]);
    for (let o = 0; o < randomOpponents; o++) {
      oppHoles.push([deck[cursor++], deck[cursor++]]);
    }

    const outcome = tally(
      [...hero, ...fullBoard],
      oppHoles.map((o) => [...o, ...fullBoard])
    );
    counts[outcome]++;
  }

  // Guard: if somehow no opponents, hero always "wins".
  if (totalOpponents === 0) {
    return { win: 1, tie: 0, loss: 0, samples: trials, exact: false };
  }
  return fractions(counts, trials, false);
}
