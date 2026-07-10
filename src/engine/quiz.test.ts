import { describe, it, expect } from "vitest";
import {
  AMBIGUITY_BAND,
  ESTIMATE_BANDS,
  breakevenEquity,
  correctAction,
  isAmbiguous,
  gradeEstimate,
  bandForEquity,
  emptyStats,
  updateStats,
  generateCandidate,
  gradeScenario,
  generateGradedScenario,
  Scenario,
} from "./quiz";
import { fullDeck } from "./cards";
import { EquityResult } from "./equity";

// Simple seeded LCG so generation tests are deterministic.
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function fakeEquity(win: number, tie = 0): EquityResult {
  return { win, tie, loss: 1 - win - tie, samples: 1000, exact: false };
}

describe("breakevenEquity — pot odds math", () => {
  it("call 50 into pot 100 needs 25%", () => {
    expect(breakevenEquity(100, 50)).toBeCloseTo(0.25, 10);
  });

  it("pot-sized bet needs 1/3", () => {
    expect(breakevenEquity(100, 100)).toBeCloseTo(1 / 3, 10);
  });

  it("third-pot bet needs 20%", () => {
    expect(breakevenEquity(90, 30)).toBeCloseTo(0.2, 10);
  });

  it("a caller ahead improves the price: 50 into 100 with a caller needs 20%", () => {
    expect(breakevenEquity(100, 50, 1)).toBeCloseTo(0.2, 10);
  });

  it("no bet → no breakeven", () => {
    expect(breakevenEquity(100, 0)).toBe(0);
  });
});

describe("correctAction", () => {
  it("calls when equity clears breakeven", () => {
    expect(correctAction(0.4, 0.25, 50)).toBe("call");
  });

  it("folds when equity is short", () => {
    expect(correctAction(0.1, 0.25, 50)).toBe("fold");
  });

  it("checks when there is no bet — never fold for free", () => {
    expect(correctAction(0.05, 0, 0)).toBe("check");
  });
});

describe("isAmbiguous — re-deal band", () => {
  it("rejects spots within the band", () => {
    expect(isAmbiguous(0.27, 0.25, 50)).toBe(true);
  });

  it("keeps spots clear of the band", () => {
    expect(isAmbiguous(0.25 + AMBIGUITY_BAND + 0.001, 0.25, 50)).toBe(false);
    expect(isAmbiguous(0.25 - AMBIGUITY_BAND - 0.001, 0.25, 50)).toBe(false);
  });

  it("never rejects a no-bet spot", () => {
    expect(isAmbiguous(0.001, 0, 0)).toBe(false);
  });
});

describe("estimate bands", () => {
  it("are contiguous from 0 to beyond 1", () => {
    expect(ESTIMATE_BANDS[0].lo).toBe(0);
    for (let i = 1; i < ESTIMATE_BANDS.length; i++) {
      expect(ESTIMATE_BANDS[i].lo).toBe(ESTIMATE_BANDS[i - 1].hi);
    }
    expect(ESTIMATE_BANDS[ESTIMATE_BANDS.length - 1].hi).toBeGreaterThan(1);
  });

  it("grades the containing band as correct", () => {
    expect(gradeEstimate("b30", 0.32)).toBe(true);
    expect(gradeEstimate("lt15", 0.32)).toBe(false);
  });

  it("accepts adjacent bands near an edge (intentional tolerance)", () => {
    // 27% is inside 25–35 and within 4pts of the 15–25 band's top edge.
    expect(gradeEstimate("b30", 0.27)).toBe(true);
    expect(gradeEstimate("b20", 0.27)).toBe(true);
    expect(gradeEstimate("b40", 0.27)).toBe(false);
  });

  it("bandForEquity finds the true band including 100%", () => {
    expect(bandForEquity(0.32).id).toBe("b30");
    expect(bandForEquity(1).id).toBe("gte50");
  });
});

describe("updateStats", () => {
  it("counts a hand as correct only when both steps are right", () => {
    let s = emptyStats();
    s = updateStats(s, { estimate: true, action: true });
    s = updateStats(s, { estimate: true, action: false });
    expect(s.hands).toBe(2);
    expect(s.correct).toBe(1);
    expect(s.estimateCorrect).toBe(2);
    expect(s.actionCorrect).toBe(1);
  });

  it("streak resets on any miss and bestStreak survives", () => {
    let s = emptyStats();
    s = updateStats(s, { estimate: true, action: true });
    s = updateStats(s, { estimate: true, action: true });
    expect(s.streak).toBe(2);
    s = updateStats(s, { estimate: false, action: true });
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(2);
  });
});

describe("generateCandidate", () => {
  const legal = new Set(fullDeck());

  it("deals legal, coherent scenarios", () => {
    const rng = seededRng(42);
    for (let i = 0; i < 300; i++) {
      const s = generateCandidate(rng);
      const cards = [...s.hero, ...s.board];
      expect(new Set(cards).size).toBe(cards.length); // distinct
      cards.forEach((c) => expect(legal.has(c)).toBe(true));
      expect([3, 4]).toContain(s.board.length);
      expect(Number.isInteger(s.pot)).toBe(true);
      expect(Number.isInteger(s.bet)).toBe(true);
      expect(s.pot).toBeGreaterThan(0);
      expect(s.bet).toBeGreaterThanOrEqual(0);
      // A caller ahead only makes sense multiway and facing a bet.
      if (s.callersAhead === 1) {
        expect(s.liveOpponents).toBe(2);
        expect(s.bet).toBeGreaterThan(0);
      }
      expect(s.story).toContain(`$${s.pot}`);
      if (s.bet > 0) expect(s.story).toContain(`$${s.bet}`);
    }
  });

  it("deals a checked-to-you spot roughly 15% of the time", () => {
    const rng = seededRng(7);
    let checked = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) {
      if (generateCandidate(rng).bet === 0) checked++;
    }
    expect(checked / n).toBeGreaterThan(0.08);
    expect(checked / n).toBeLessThan(0.25);
  });
});

describe("gradeScenario", () => {
  const base: Scenario = {
    hero: ["Ah", "Kh"],
    board: ["Qh", "7h", "2c"],
    liveOpponents: 1,
    callersAhead: 0,
    pot: 100,
    bet: 50,
    story: "test",
  };

  it("uses win + tie/2 as grading equity and verdicts consistently", () => {
    const g = gradeScenario(base, fakeEquity(0.4, 0.1));
    expect(g.equity).toBeCloseTo(0.45, 10);
    expect(g.breakeven).toBeCloseTo(0.25, 10);
    expect(g.correctAction).toBe("call");
  });

  it("folds a thin hand facing a big bet", () => {
    const g = gradeScenario({ ...base, bet: 100 }, fakeEquity(0.1));
    expect(g.correctAction).toBe("fold");
  });

  it("checks when checked to, regardless of equity", () => {
    const g = gradeScenario(
      { ...base, bet: 0, callersAhead: 0 },
      fakeEquity(0.05)
    );
    expect(g.correctAction).toBe("check");
    expect(g.breakeven).toBe(0);
  });
});

describe("generateGradedScenario — integration", () => {
  it("always returns an unambiguous, self-consistent scenario", () => {
    for (let i = 0; i < 5; i++) {
      const g = generateGradedScenario({ trials: 5_000 });
      expect(g.equity).toBeCloseTo(
        g.equityResult.win + g.equityResult.tie / 2,
        10
      );
      expect(isAmbiguous(g.equity, g.breakeven, g.bet)).toBe(false);
      if (g.bet === 0) {
        expect(g.correctAction).toBe("check");
      } else {
        expect(g.correctAction).toBe(g.equity >= g.breakeven ? "call" : "fold");
      }
    }
  });
});
