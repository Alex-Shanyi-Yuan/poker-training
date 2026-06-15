// Runs the Monte Carlo / enumeration off the main thread so the UI never
// freezes while equity is computed. The hand-strength explanation is cheap and
// stays on the main thread for instant feedback; only this heavy loop is here.

import { computeEquity, EquityInput, EquityResult } from "./equity";

interface Request {
  id: number;
  input: EquityInput;
}
export interface Response {
  id: number;
  result: EquityResult;
}

self.onmessage = (e: MessageEvent<Request>) => {
  const { id, input } = e.data;
  const result = computeEquity(input);
  (self as unknown as Worker).postMessage({ id, result } satisfies Response);
};
