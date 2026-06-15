// Thin wrapper isolating the `pokersolver` dependency. The rest of the engine
// only talks to these functions, so the underlying evaluator can be swapped
// without touching the equity or explanation logic.

import { Hand } from "pokersolver";
import type { Card } from "./cards";

export interface MadeHand {
  /** Category name, e.g. "Flush", "Two Pair", "High Card". */
  name: string;
  /** Full description, e.g. "Flush, Ah High". */
  descr: string;
  /** Category rank 1..9, higher is stronger (only valid within one comparison). */
  categoryRank: number;
  /** Opaque handle used for comparison via `compare`. */
  _hand: Hand;
}

/** Evaluate the best 5-card hand from 5–7 cards (2 hole + 3–5 board). */
export function evaluate(cards: Card[]): MadeHand {
  const hand = Hand.solve(cards);
  return {
    name: hand.name,
    descr: hand.descr,
    categoryRank: hand.rank,
    _hand: hand,
  };
}

export type Outcome = "win" | "tie" | "loss";

/**
 * Compare the hero's made hand against one or more opponents' made hands.
 * Returns "win" if hero is the sole best, "tie" if hero shares the best,
 * "loss" if any opponent is strictly better.
 */
export function compareHands(hero: MadeHand, opponents: MadeHand[]): Outcome {
  const all = [hero, ...opponents];
  const winners = Hand.winners(all.map((h) => h._hand));
  const heroWon = winners.includes(hero._hand);
  if (!heroWon) return "loss";
  return winners.length > 1 ? "tie" : "win";
}
