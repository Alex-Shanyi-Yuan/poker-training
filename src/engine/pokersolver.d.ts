// Minimal type declarations for the untyped `pokersolver` package.
// We only use Hand.solve and the winners helper.
declare module "pokersolver" {
  export class Hand {
    /** Human name of the made hand, e.g. "Flush", "Two Pair". */
    name: string;
    /** Descriptive string, e.g. "Flush, Ah High". */
    descr: string;
    /** Category rank 1..9 (pair=2 ... straight flush=9), higher is better. */
    rank: number;
    cards: unknown[];
    static solve(cards: string[]): Hand;
    /** Returns the winning hand(s); ties yield multiple entries. */
    static winners(hands: Hand[]): Hand[];
  }
}
