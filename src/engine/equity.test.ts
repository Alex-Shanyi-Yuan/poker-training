import { describe, it, expect } from "vitest";
import { computeEquity } from "./equity";
import { evaluate, compareHands } from "./evaluator";
import { explain } from "./explain";
import { sampleDeck, fullDeck } from "./cards";

// Equity is approximate under Monte Carlo; allow a tolerance band.
function near(actual: number, expected: number, tol = 0.025) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}

describe("evaluator", () => {
  it("names a flush", () => {
    const h = evaluate(["Ah", "Kh", "Qh", "2h", "7h", "3c", "9d"]);
    expect(h.name).toBe("Flush");
  });

  it("detects a strictly better hand", () => {
    const twoPair = evaluate(["Ah", "Ad", "Kh", "Kd", "2c"]);
    const pair = evaluate(["Ah", "Ad", "5h", "9d", "2c"]);
    expect(compareHands(twoPair, [pair])).toBe("win");
    expect(compareHands(pair, [twoPair])).toBe("loss");
  });

  it("reports a tie when the board plays for both", () => {
    const a = evaluate(["2c", "3d", "Ah", "Kh", "Qh", "Jh", "Th"]);
    const b = evaluate(["4c", "5d", "Ah", "Kh", "Qh", "Jh", "Th"]);
    // Both play the royal flush on board → tie.
    expect(compareHands(a, [b])).toBe("tie");
  });
});

describe("computeEquity — known benchmarks", () => {
  it("AA vs KK heads-up pre-flop ≈ 82/18 (exact would be ~81.9%)", () => {
    const r = computeEquity({
      hero: ["Ah", "Ad"],
      board: [],
      randomOpponents: 0,
      knownOpponents: [["Kh", "Kd"]],
      trials: 60_000,
    });
    near(r.win + r.tie, 0.82, 0.03);
  });

  it("AKs vs 22 pre-flop is roughly a coin flip", () => {
    const r = computeEquity({
      hero: ["Ah", "Kh"],
      board: [],
      randomOpponents: 0,
      knownOpponents: [["2c", "2d"]],
      trials: 60_000,
    });
    near(r.win + r.tie, 0.5, 0.04);
  });

  it("a made flush on the turn is ~100% vs one unknown opponent", () => {
    const r = computeEquity({
      hero: ["Ah", "Kh"],
      board: ["Qh", "7h", "2h", "3c"],
      randomOpponents: 1,
      trials: 20_000,
    });
    // Nut flush on a non-paired board; only a higher flush card or board pair
    // could lose, which is impossible here → essentially 100%.
    expect(r.win).toBeGreaterThan(0.97);
  });

  it("uses exact enumeration vs a known hand on the turn", () => {
    const r = computeEquity({
      hero: ["Ah", "Kh"],
      board: ["Qh", "Jh", "2c", "3d"],
      randomOpponents: 0,
      knownOpponents: [["Ts", "Td"]],
    });
    expect(r.exact).toBe(true);
    // Hero needs any heart (flush) or any T/9 for straight; strong but not 100%.
    expect(r.win).toBeGreaterThan(0.2);
    expect(r.win).toBeLessThan(1);
  });

  it("equity drops as more random opponents are added", () => {
    const heads = computeEquity({
      hero: ["Ah", "Ad"],
      board: [],
      randomOpponents: 1,
      trials: 30_000,
    });
    const eight = computeEquity({
      hero: ["Ah", "Ad"],
      board: [],
      randomOpponents: 8,
      trials: 30_000,
    });
    expect(heads.win).toBeGreaterThan(eight.win);
    near(heads.win + heads.tie, 0.85, 0.03);
  });
});

describe("sampleDeck — random dealing", () => {
  const legal = new Set(fullDeck());

  it("returns the requested count of distinct, legal cards", () => {
    for (let i = 0; i < 50; i++) {
      const cards = sampleDeck(5);
      expect(cards).toHaveLength(5);
      expect(new Set(cards).size).toBe(5); // all distinct
      cards.forEach((c) => expect(legal.has(c)).toBe(true));
    }
  });

  it("never deals an excluded card", () => {
    const exclude = ["Ah", "Kh", "Qh"];
    for (let i = 0; i < 50; i++) {
      const cards = sampleDeck(5, exclude);
      cards.forEach((c) => expect(exclude).not.toContain(c));
    }
  });
});

describe("explain — teaching layer", () => {
  it("describes a pocket pair pre-flop", () => {
    const e = explain(["Ah", "Ad"], []);
    expect(e.currentHandName).toBe("Pocket pair");
    expect(e.outs.length).toBe(0);
  });

  it("counts the textbook 15 outs for nut flush draw + two overcards", () => {
    // AhKh on Qh7h2c: 9 hearts (flush) + 3 aces + 3 kings (overcards) = 15.
    // Pairing the board (Q, 7, 2) must NOT count — it helps everyone equally.
    const e = explain(["Ah", "Kh"], ["Qh", "7h", "2c"]);
    const flushOuts = e.outs.filter((o) => o.makes === "Flush");
    expect(flushOuts.length).toBe(9);
    expect(e.outsCount).toBe(15);
    expect(e.cardsToCome).toBe(2);
    expect(e.hitByRiver).not.toBeNull();
  });

  it("does not count pairing the board as an out", () => {
    // 8h2d on As Ks Qc: the only real outs are pairing the 8 or the 2
    // (a hole card), never the board's A/K/Q.
    const e = explain(["8h", "2d"], ["As", "Ks", "Qc"]);
    const ranks = new Set(e.outs.map((o) => o.card[0]));
    expect(ranks.has("A")).toBe(false);
    expect(ranks.has("K")).toBe(false);
    expect(ranks.has("Q")).toBe(false);
    expect(ranks.has("8")).toBe(true);
  });

  it("reports no outs once the hand is final on the river", () => {
    const e = explain(["Ah", "Kh"], ["Qh", "7h", "2h", "3c", "9d"]);
    expect(e.cardsToCome).toBe(0);
    expect(e.outsCount).toBe(0);
    expect(e.currentHandName).toBe("Flush");
  });
});
