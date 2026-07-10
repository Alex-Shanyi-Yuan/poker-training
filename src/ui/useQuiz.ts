// Quiz-mode state machine. Deals scenarios via the quiz worker, records the
// user's two answers (equity estimate, then action), grades them with the
// engine, and persists session stats to localStorage.
//
//   dealing → estimating → acting → revealed → (next) → dealing
//      └→ dealFailed (retry)

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Action,
  GradedScenario,
  QuizStats,
  emptyStats,
  gradeEstimate,
  updateStats,
} from "../engine/quiz";
import type { QuizResponse } from "../engine/quiz.worker";
import { explain, Explanation } from "../engine/explain";

export type QuizPhase =
  | "dealing"
  | "estimating"
  | "acting"
  | "revealed"
  | "dealFailed";

export interface QuizState {
  phase: QuizPhase;
  scenario: GradedScenario | null;
  /** Hand-strength/outs readout for the reveal (computed at deal time). */
  explanation: Explanation | null;
  estimateBandId: string | null;
  estimateCorrect: boolean | null;
  chosenAction: Action | null;
  actionCorrect: boolean | null;
  stats: QuizStats;
}

export interface QuizControls {
  chooseEstimate: (bandId: string) => void;
  chooseAction: (action: Action) => void;
  nextHand: () => void;
}

const STORAGE_KEY = "equity-lab.quiz-stats.v1";
const DEAL_TRIALS = 20_000;

function loadStats(): QuizStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw);
    const clean = emptyStats();
    for (const key of Object.keys(clean) as (keyof QuizStats)[]) {
      if (typeof parsed[key] === "number") clean[key] = parsed[key];
    }
    return clean;
  } catch {
    return emptyStats();
  }
}

function saveStats(stats: QuizStats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Storage unavailable (private mode etc.) — stats just don't persist.
  }
}

export function useQuiz(): [QuizState, QuizControls] {
  const [state, setState] = useState<QuizState>(() => ({
    phase: "dealing",
    scenario: null,
    explanation: null,
    estimateBandId: null,
    estimateCorrect: null,
    chosenAction: null,
    actionCorrect: null,
    stats: loadStats(),
  }));
  const workerRef = useRef<Worker | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const worker = new Worker(
      new URL("../engine/quiz.worker.ts", import.meta.url),
      { type: "module" }
    );
    worker.onmessage = (e: MessageEvent<QuizResponse>) => {
      if (e.data.id !== reqId.current) return; // superseded request
      const { scenario } = e.data;
      if (!scenario) {
        setState((s) => ({ ...s, phase: "dealFailed" }));
        return;
      }
      setState((s) => ({
        ...s,
        phase: "estimating",
        scenario,
        explanation: explain(scenario.hero, scenario.board),
        estimateBandId: null,
        estimateCorrect: null,
        chosenAction: null,
        actionCorrect: null,
      }));
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const deal = useCallback(() => {
    setState((s) => ({ ...s, phase: "dealing", scenario: null }));
    workerRef.current?.postMessage({ id: ++reqId.current, trials: DEAL_TRIALS });
  }, []);

  // Auto-deal the first hand once the worker exists.
  useEffect(() => {
    deal();
  }, [deal]);

  const chooseEstimate = useCallback((bandId: string) => {
    // Recorded but not graded visibly yet — revealing correctness here would
    // leak the equity before the action decision.
    setState((s) =>
      s.phase === "estimating"
        ? { ...s, phase: "acting", estimateBandId: bandId }
        : s
    );
  }, []);

  const chooseAction = useCallback((action: Action) => {
    setState((s) => {
      if (s.phase !== "acting" || !s.scenario || !s.estimateBandId) return s;
      const estimateOk = gradeEstimate(s.estimateBandId, s.scenario.equity);
      const actionOk = action === s.scenario.correctAction;
      const stats = updateStats(s.stats, {
        estimate: estimateOk,
        action: actionOk,
      });
      saveStats(stats);
      return {
        ...s,
        phase: "revealed",
        chosenAction: action,
        estimateCorrect: estimateOk,
        actionCorrect: actionOk,
        stats,
      };
    });
  }, []);

  return [state, { chooseEstimate, chooseAction, nextHand: deal }];
}
