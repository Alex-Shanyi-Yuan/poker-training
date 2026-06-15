// The teaching layer. Turns a board state into plain-English coaching: what
// hand the hero currently holds, which remaining cards are "outs" that improve
// it, and a rough probability of hitting using the classic rule of 2 and 4.
//
// "Outs" here use the standard beginner definition: a card that improves your
// hand. We detect them by checking, for each remaining card, whether adding it
// to the board produces a strictly stronger five-card hand than you have now.

import {
  Card,
  deckWithout,
  prettyCard,
  rankOf,
  suitOf,
  RANK_VALUE,
} from "./cards";
import { compareHands, evaluate } from "./evaluator";

export interface OutCard {
  card: Card;
  pretty: string;
  /** The hand this card makes, e.g. "Flush". */
  makes: string;
}

export interface Explanation {
  /** Description of the hero's current best hand. */
  currentHand: string;
  /** Short category, e.g. "Flush", "Top Pair", "Ace-high". */
  currentHandName: string;
  outs: OutCard[];
  outsCount: number;
  /** Cards still to come: 2 on the flop, 1 on the turn, 0 otherwise. */
  cardsToCome: number;
  /** Estimated chance to improve by the river (rule of 2/4), or null. */
  hitByRiver: number | null;
  /** Coaching notes shown beneath the result. */
  notes: string[];
}

function preflopDescription(hero: [Card, Card]): {
  name: string;
  descr: string;
  note: string;
} {
  const [a, b] = hero;
  const ra = rankOf(a);
  const rb = rankOf(b);
  const suited = suitOf(a) === suitOf(b);
  if (ra === rb) {
    return {
      name: "Pocket pair",
      descr: `Pocket ${ra}s`,
      note: "A made pair before the flop — already a hand, with room to improve to a set.",
    };
  }
  const hi = RANK_VALUE[ra] >= RANK_VALUE[rb] ? ra : rb;
  const lo = RANK_VALUE[ra] >= RANK_VALUE[rb] ? rb : ra;
  const gap = Math.abs(RANK_VALUE[ra] - RANK_VALUE[rb]);
  const connected = gap === 1;
  const shape = `${hi}${lo}${suited ? " suited" : " offsuit"}`;
  let note = "Unpaired starting hand — its value comes from making pairs or better on the board.";
  if (suited && connected)
    note = "Suited connector — strong drawing potential for straights and flushes.";
  else if (suited) note = "Suited — extra flush potential.";
  else if (connected) note = "Connected — extra straight potential.";
  return { name: `${hi}-high`, descr: shape, note };
}

export function explain(hero: [Card, Card], board: Card[]): Explanation {
  const notes: string[] = [];

  // Pre-flop (no board yet): describe the starting hand qualitatively.
  if (board.length < 3) {
    const pf = preflopDescription(hero);
    notes.push(pf.note);
    return {
      currentHand: pf.descr,
      currentHandName: pf.name,
      outs: [],
      outsCount: 0,
      cardsToCome: 0,
      hitByRiver: null,
      notes,
    };
  }

  const current = evaluate([...hero, ...board]);
  const cardsToCome = 5 - board.length;

  // Find outs. A genuine out must do two things:
  //   1. strictly improve the hero's hand, and
  //   2. improve it *via the hole cards* — not just improve the community
  //      board (which would help every player equally).
  // We detect (2) by comparing the hero's hand category against the category of
  // the board-plus-card alone: if the hero reaches a higher category than the
  // board does, the extra strength came from the hole cards. This yields the
  // textbook counts (e.g. 9 flush outs, 6 overcard outs) instead of naively
  // counting every card that pairs the board.
  const remaining = deckWithout([...hero, ...board]);
  const outs: OutCard[] = [];
  if (cardsToCome > 0) {
    for (const card of remaining) {
      const after = evaluate([...hero, ...board, card]);
      if (compareHands(after, [current]) !== "win") continue; // didn't improve
      const boardAfter = evaluate([...board, card]);
      if (after.categoryRank > boardAfter.categoryRank) {
        outs.push({ card, pretty: prettyCard(card), makes: after.name });
      }
    }
  }

  // Rule of 2 and 4: outs × (2 per remaining street) approximates the chance
  // of improving by the river. Capped at a sensible ceiling.
  let hitByRiver: number | null = null;
  if (cardsToCome > 0 && outs.length > 0) {
    const pct = Math.min(0.95, (outs.length * 2 * cardsToCome) / 100);
    hitByRiver = pct;
    notes.push(
      `${outs.length} out${outs.length === 1 ? "" : "s"} × ${
        2 * cardsToCome
      } ≈ ${Math.round(pct * 100)}% to improve by the river (rule of ${
        cardsToCome === 2 ? "4" : "2"
      }).`
    );
  } else if (cardsToCome === 0) {
    notes.push("River is out — your hand is final.");
  } else {
    notes.push("No cards improve your hand here; you're drawing thin.");
  }

  return {
    currentHand: current.descr,
    currentHandName: current.name,
    outs,
    outsCount: outs.length,
    cardsToCome,
    hitByRiver,
    notes,
  };
}
