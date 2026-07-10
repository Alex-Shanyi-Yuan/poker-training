// Deals graded quiz scenarios off the main thread. Each deal runs the Monte
// Carlo equity simulation (possibly several times, rejecting spots too close
// to breakeven), so it must never run on the UI thread. Kept separate from
// equity.worker.ts so lab mode is untouched by quiz work.

import { generateGradedScenario, GradedScenario } from "./quiz";

interface Request {
  id: number;
  trials?: number;
}
export interface QuizResponse {
  id: number;
  scenario?: GradedScenario;
  error?: string;
}

self.onmessage = (e: MessageEvent<Request>) => {
  const { id, trials } = e.data;
  try {
    const scenario = generateGradedScenario({ trials });
    (self as unknown as Worker).postMessage({
      id,
      scenario,
    } satisfies QuizResponse);
  } catch (err) {
    (self as unknown as Worker).postMessage({
      id,
      error: err instanceof Error ? err.message : String(err),
    } satisfies QuizResponse);
  }
};
