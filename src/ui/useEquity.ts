import { useEffect, useRef, useState } from "react";
import { Card } from "../engine/cards";
import { EquityResult } from "../engine/equity";
import { explain, Explanation } from "../engine/explain";
import type { Response as WorkerResponse } from "../engine/equity.worker";

export interface Situation {
  hero: Card[]; // 0..2
  board: Card[]; // 0..5
  randomOpponents: number;
}

export interface EquityState {
  result: EquityResult | null;
  explanation: Explanation | null;
  /** Remaining cards that improve the hero's hand (for deck highlighting). */
  outCards: Set<Card>;
  computing: boolean;
}

const EMPTY: EquityState = {
  result: null,
  explanation: null,
  outCards: new Set(),
  computing: false,
};

// Fewer trials than the test suite keeps each run fast; since it runs in a Web
// Worker it never blocks the UI anyway, but snappy results still feel better.
const LIVE_TRIALS = 20_000;

export function useEquity(situation: Situation): EquityState {
  const { hero, board, randomOpponents } = situation;
  const [state, setState] = useState<EquityState>(EMPTY);
  const workerRef = useRef<Worker | null>(null);
  const reqId = useRef(0);

  // One persistent worker for the component's lifetime.
  useEffect(() => {
    const worker = new Worker(
      new URL("../engine/equity.worker.ts", import.meta.url),
      { type: "module" }
    );
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.id !== reqId.current) return; // ignore superseded requests
      setState((s) => ({ ...s, result: e.data.result, computing: false }));
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const ready = hero.length === 2;
  const key = JSON.stringify([hero, board, randomOpponents]);

  useEffect(() => {
    if (!ready) {
      setState(EMPTY);
      return;
    }
    const heroPair = hero as [Card, Card];

    // The explanation (hand strength + outs) is cheap — compute it on the main
    // thread immediately so the hand readout and glowing outs update instantly.
    const explanation = explain(heroPair, board);
    const outCards = new Set(explanation.outs.map((o) => o.card));
    setState((s) => ({ ...s, explanation, outCards, computing: true }));

    // The heavy equity simulation goes to the worker, debounced.
    const id = ++reqId.current;
    const timer = setTimeout(() => {
      workerRef.current?.postMessage({
        id,
        input: {
          hero: heroPair,
          board,
          randomOpponents: Math.max(1, randomOpponents),
          trials: LIVE_TRIALS,
        },
      });
    }, 120);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  return state;
}
