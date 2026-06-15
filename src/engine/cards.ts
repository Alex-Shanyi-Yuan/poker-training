// Card model for No-Limit Texas Hold'em.
//
// A card is represented internally as a 2-character string in pokersolver's
// format: rank char + suit char, e.g. "Ah" (ace of hearts), "Td" (ten of
// diamonds), "2c" (two of clubs). Keeping one canonical string form means the
// deck, the evaluator wrapper, and the equity simulation all speak the same
// language with zero conversion.

export type Rank =
  | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "T" | "J" | "Q" | "K" | "A";
export type Suit = "s" | "h" | "d" | "c";
export type Card = string; // `${Rank}${Suit}`

export const RANKS: Rank[] = [
  "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A",
];
export const SUITS: Suit[] = ["s", "h", "d", "c"];

// Numeric strength of each rank, 2 (low) .. 14 (ace high). Used for ordering
// and out-detection, never for hand comparison (that's the evaluator's job).
export const RANK_VALUE: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
  "9": 9, "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};

export const SUIT_SYMBOL: Record<Suit, string> = {
  s: "♠", // ♠
  h: "♥", // ♥
  d: "♦", // ♦
  c: "♣", // ♣
};

export const SUIT_NAME: Record<Suit, string> = {
  s: "spades",
  h: "hearts",
  d: "diamonds",
  c: "clubs",
};

export function rankOf(card: Card): Rank {
  return card[0] as Rank;
}

export function suitOf(card: Card): Suit {
  return card[1] as Suit;
}

/** The full ordered 52-card deck. */
export function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      deck.push(`${r}${s}`);
    }
  }
  return deck;
}

/** Deck with the given cards removed (e.g. everything already on the table). */
export function deckWithout(used: Iterable<Card>): Card[] {
  const dead = new Set(used);
  return fullDeck().filter((c) => !dead.has(c));
}

/** Human-readable label, e.g. "A♥". */
export function prettyCard(card: Card): string {
  return `${rankOf(card)}${SUIT_SYMBOL[suitOf(card)]}`;
}

/**
 * Parse loose user input ("Ah", "ah", "AH", "10d", "A♥") into a canonical card,
 * or return null if it isn't a legal card. Forgiving on case and on "10"/"T".
 */
export function parseCard(input: string): Card | null {
  const cleaned = input
    .trim()
    .replace("10", "T")
    .replace("♠", "s")
    .replace("♥", "h")
    .replace("♦", "d")
    .replace("♣", "c");
  if (cleaned.length !== 2) return null;
  const rank = cleaned[0].toUpperCase() as Rank;
  const suit = cleaned[1].toLowerCase() as Suit;
  if (!RANKS.includes(rank) || !SUITS.includes(suit)) return null;
  return `${rank}${suit}`;
}
