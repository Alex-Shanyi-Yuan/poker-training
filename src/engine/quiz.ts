// Quiz mode (Sub-Project 2): pot odds & EV drills.
//
// Deals a scenario — hero hand, board, pot, a facing bet — and grades two
// decisions: the user's *estimate* of their equity, and their *action*
// (fold / check / call). The correct action comes from comparing real equity
// (computed by the equity engine) to the pot-odds breakeven. Scenarios whose
// equity lands too close to breakeven are rejected at generation time so every
// question has a defensible answer.

import { Card, sampleDeck } from "./cards";
import { computeEquity, EquityResult } from "./equity";

export type Action = "fold" | "check" | "call";

export interface Scenario {
  hero: [Card, Card];
  board: Card[]; // 3 (flop) or 4 (turn)
  /** Opponents still in the hand (their cards are unknown/random). */
  liveOpponents: 1 | 2;
  /** Opponents who already called the facing bet before it reached the hero. */
  callersAhead: 0 | 1;
  /** Pot size BEFORE the facing bet, in whole dollars. */
  pot: number;
  /** The bet the hero is facing. 0 = checked to you. */
  bet: number;
  /** One-line narration of the action so far. */
  story: string;
}

export interface GradedScenario extends Scenario {
  equityResult: EquityResult;
  /** Grading equity: win + tie/2 (a tie is worth half the pot). */
  equity: number;
  /** Pot-odds breakeven equity; 0 when there is no bet. */
  breakeven: number;
  correctAction: Action;
}

export interface EstimateBand {
  id: string;
  label: string;
  lo: number; // inclusive
  hi: number; // exclusive (last band overshoots 1 to include 100%)
}

export interface QuizStats {
  hands: number;
  /** Hands where BOTH steps were correct. */
  correct: number;
  streak: number;
  bestStreak: number;
  estimateCorrect: number;
  actionCorrect: number;
}

/** Scenarios closer than this to breakeven are re-dealt: no coin-flip quizzes. */
export const AMBIGUITY_BAND = 0.04;
/** An estimate band also counts if the true equity is this close to its edge. */
export const ESTIMATE_TOLERANCE = 0.04;

export const ESTIMATE_BANDS: EstimateBand[] = [
  { id: "lt15", label: "under 15%", lo: 0, hi: 0.15 },
  { id: "b20", label: "~20%", lo: 0.15, hi: 0.25 },
  { id: "b30", label: "~30%", lo: 0.25, hi: 0.35 },
  { id: "b40", label: "~40%", lo: 0.35, hi: 0.5 },
  { id: "gte50", label: "50% or more", lo: 0.5, hi: 1.01 },
];

/**
 * The equity needed for a call to break even.
 *
 * Calling `bet` can win the pot as it will stand after everyone has matched:
 * the pot before the bet, the bet itself, the hero's call, and one more call
 * per opponent who already called ahead of the hero. Hence
 * `bet / (pot + bet × (2 + callersAhead))` — callers ahead of you improve
 * your price. With no bet there is nothing to break even against.
 */
export function breakevenEquity(
  pot: number,
  bet: number,
  callersAhead = 0
): number {
  if (bet <= 0) return 0;
  return bet / (pot + bet * (2 + callersAhead));
}

export function correctAction(
  equity: number,
  breakeven: number,
  bet: number
): Action {
  if (bet === 0) return "check"; // checking is free; never fold for free
  return equity >= breakeven ? "call" : "fold";
}

/** True when the spot is too close to breakeven to have a clean answer. */
export function isAmbiguous(
  equity: number,
  breakeven: number,
  bet: number
): boolean {
  if (bet === 0) return false;
  return Math.abs(equity - breakeven) < AMBIGUITY_BAND;
}

/** Was the chosen band right, given the true equity? Tolerant at the edges. */
export function gradeEstimate(bandId: string, equity: number): boolean {
  const band = ESTIMATE_BANDS.find((b) => b.id === bandId);
  if (!band) return false;
  return (
    equity >= band.lo - ESTIMATE_TOLERANCE &&
    equity <= band.hi + ESTIMATE_TOLERANCE
  );
}

/** The band the true equity actually falls in (for feedback display). */
export function bandForEquity(equity: number): EstimateBand {
  return (
    ESTIMATE_BANDS.find((b) => equity >= b.lo && equity < b.hi) ??
    ESTIMATE_BANDS[ESTIMATE_BANDS.length - 1]
  );
}

export function emptyStats(): QuizStats {
  return {
    hands: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    estimateCorrect: 0,
    actionCorrect: 0,
  };
}

export function updateStats(
  stats: QuizStats,
  grade: { estimate: boolean; action: boolean }
): QuizStats {
  const both = grade.estimate && grade.action;
  const streak = both ? stats.streak + 1 : 0;
  return {
    hands: stats.hands + 1,
    correct: stats.correct + (both ? 1 : 0),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    estimateCorrect: stats.estimateCorrect + (grade.estimate ? 1 : 0),
    actionCorrect: stats.actionCorrect + (grade.action ? 1 : 0),
  };
}

// ---------------------------------------------------------------------------
// Scenario generation
// ---------------------------------------------------------------------------

type Rng = () => number;

function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

/** Fraction of deals where the hero faces no bet (Check is the answer). */
const CHECKED_TO_YOU_RATE = 0.15;
/** Facing-bet sizes as a fraction of the pot. */
const BET_FRACTIONS = [1 / 3, 1 / 2, 2 / 3, 1] as const;
/** Per-player pre-flop contribution, in dollars. */
const PREFLOP_STAKES = [6, 10, 14, 20] as const;

/**
 * Deal one candidate scenario. Pure of any equity knowledge — the caller must
 * grade it (and possibly reject it as ambiguous). `rng` drives the sizing and
 * shape choices and is injectable for deterministic tests; the cards
 * themselves come from `sampleDeck`.
 */
export function generateCandidate(rng: Rng = Math.random): Scenario {
  const street: "flop" | "turn" = rng() < 0.6 ? "flop" : "turn";
  const liveOpponents: 1 | 2 = rng() < 0.7 ? 1 : 2;
  const players = liveOpponents + 1;

  const cards = sampleDeck(2 + (street === "flop" ? 3 : 4));
  const hero = cards.slice(0, 2) as [Card, Card];
  const board = cards.slice(2);

  // Pot arithmetic: everyone put in the same pre-flop stake; on the turn the
  // pot also carries a flop bet that everyone called.
  let pot = pick(PREFLOP_STAKES, rng) * players;
  if (street === "turn") {
    const flopBet = Math.round(pot * pick([1 / 2, 2 / 3] as const, rng));
    pot += flopBet * players;
  }

  const checked = rng() < CHECKED_TO_YOU_RATE;
  const bet = checked ? 0 : Math.max(1, Math.round(pot * pick(BET_FRACTIONS, rng)));
  const callersAhead: 0 | 1 = !checked && liveOpponents === 2 ? 1 : 0;

  const who = liveOpponents === 1 ? "Heads-up" : "Three of you";
  const story = checked
    ? `${who} on the ${street}. Pot is $${pot} — ${
        liveOpponents === 1 ? "your opponent checks" : "both opponents check"
      } to you.`
    : liveOpponents === 1
      ? `Heads-up on the ${street}. Pot is $${pot} — your opponent bets $${bet}.`
      : `Three of you saw the ${street}. Pot is $${pot} — the first player bets $${bet}, the next calls. You close the action.`;

  return { hero, board, liveOpponents, callersAhead, pot, bet, story };
}

/** Attach equity, breakeven, and the verdict to a candidate. Pure. */
export function gradeScenario(
  candidate: Scenario,
  equityResult: EquityResult
): GradedScenario {
  const equity = equityResult.win + equityResult.tie / 2;
  const breakeven = breakevenEquity(
    candidate.pot,
    candidate.bet,
    candidate.callersAhead
  );
  return {
    ...candidate,
    equityResult,
    equity,
    breakeven,
    correctAction: correctAction(equity, breakeven, candidate.bet),
  };
}

/**
 * Deal until we get an unambiguous scenario. CPU-heavy (runs the Monte Carlo
 * per attempt) — call from a Web Worker, never the main thread.
 */
export function generateGradedScenario(
  opts: { trials?: number; maxAttempts?: number; rng?: Rng } = {}
): GradedScenario {
  const { trials = 20_000, maxAttempts = 25, rng = Math.random } = opts;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generateCandidate(rng);
    const result = computeEquity({
      hero: candidate.hero,
      board: candidate.board,
      randomOpponents: candidate.liveOpponents,
      trials,
    });
    const graded = gradeScenario(candidate, result);
    if (!isAmbiguous(graded.equity, graded.breakeven, graded.bet)) {
      return graded;
    }
  }
  throw new Error(
    `Could not deal an unambiguous scenario in ${maxAttempts} attempts`
  );
}
