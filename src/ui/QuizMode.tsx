// Quiz mode: deal a spot with a pot and a bet, hide the equity, and make the
// user (1) estimate their chance to win and (2) pick an action. The reveal
// grades both and — the point of the whole exercise — shows the estimation
// path to the right answer: count outs → rule of 2/4 → compare to pot odds.

import { motion } from "framer-motion";
import {
  Action,
  ESTIMATE_BANDS,
  GradedScenario,
  bandForEquity,
} from "../engine/quiz";
import { Explanation } from "../engine/explain";
import { PlayingCard } from "./PlayingCard";
import { ResultsPanel } from "./ResultsPanel";
import { useQuiz } from "./useQuiz";

const JADE = "#36c98e";
const ROSE = "#e0556b";

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function QuizMode() {
  const [quiz, controls] = useQuiz();
  const { phase, scenario, explanation, stats } = quiz;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      {/* LEFT — the spot and the two decisions */}
      <section className="panel p-6 flex flex-col gap-6">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Quiz · Pot odds drill</p>
          <span className="text-[11px] font-mono text-emerald-200/50">
            score {stats.correct}/{stats.hands} · streak {stats.streak}
            {stats.bestStreak > 0 ? ` · best ${stats.bestStreak}` : ""}
          </span>
        </div>

        {phase === "dealing" && (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="text-emerald-100/50 animate-pulse">Dealing…</p>
          </div>
        )}

        {phase === "dealFailed" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <p className="text-emerald-100/60">Couldn't deal a clean spot.</p>
            <button onClick={controls.nextHand} className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-felt-900 hover:brightness-110 transition">
              Try again
            </button>
          </div>
        )}

        {scenario && phase !== "dealing" && (
          <>
            {/* The story */}
            <p className="text-emerald-50 text-lg leading-snug max-w-[46ch]">
              {scenario.story}
            </p>

            {/* Cards */}
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="eyebrow mb-2">Your hand</p>
                <div className="flex gap-2">
                  {scenario.hero.map((c) => (
                    <PlayingCard key={c} card={c} size="md" />
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow mb-2">
                  Board · {scenario.board.length === 3 ? "flop" : "turn"}
                </p>
                <div className="flex gap-2">
                  {scenario.board.map((c) => (
                    <PlayingCard key={c} card={c} size="md" />
                  ))}
                </div>
              </div>
            </div>

            {/* Pot / bet instrument strip */}
            <div className="flex gap-6 rounded-xl bg-black/25 px-4 py-3 font-mono text-sm">
              <span className="text-emerald-100/80">
                POT <span className="text-gold">${scenario.pot}</span>
              </span>
              <span className="text-emerald-100/80">
                {scenario.bet > 0 ? (
                  <>
                    TO CALL <span className="text-gold">${scenario.bet}</span>
                  </>
                ) : (
                  <span className="text-emerald-200/60">CHECKED TO YOU</span>
                )}
              </span>
              <span className="text-emerald-100/80">
                OPPONENTS{" "}
                <span className="text-gold">{scenario.liveOpponents}</span>
              </span>
            </div>

            {/* Step 1 — estimate */}
            <div>
              <p className="eyebrow mb-2">
                Step 1 · Estimate your chance to win
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ESTIMATE_BANDS.map((b) => {
                  const chosen = quiz.estimateBandId === b.id;
                  return (
                    <button
                      key={b.id}
                      disabled={phase !== "estimating"}
                      onClick={() => controls.chooseEstimate(b.id)}
                      className={`rounded-lg px-3 h-9 font-mono text-sm transition-all ${
                        chosen
                          ? "bg-gold text-felt-900 font-bold"
                          : phase === "estimating"
                            ? "bg-black/25 text-emerald-100/70 hover:bg-black/40"
                            : "bg-black/15 text-emerald-100/30"
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
              {phase === "estimating" && (
                <p className="mt-2 text-xs text-emerald-100/45">
                  Tip: count the cards that improve you, then apply the rule of{" "}
                  {scenario.board.length === 3 ? "4 (two cards to come)" : "2 (one card to come)"}.
                </p>
              )}
            </div>

            {/* Step 2 — act */}
            <div>
              <p className="eyebrow mb-2">Step 2 · Your action</p>
              <div className="flex gap-2">
                {(["fold", "check", "call"] as Action[]).map((a) => {
                  const impossible =
                    (a === "check" && scenario.bet > 0) ||
                    (a === "call" && scenario.bet === 0);
                  const chosen = quiz.chosenAction === a;
                  const enabled = phase === "acting" && !impossible;
                  return (
                    <button
                      key={a}
                      disabled={!enabled}
                      onClick={() => controls.chooseAction(a)}
                      title={
                        a === "check" && scenario.bet > 0
                          ? "There's a bet — you can't check"
                          : a === "call" && scenario.bet === 0
                            ? "No bet to call"
                            : undefined
                      }
                      className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition-all ${
                        chosen
                          ? "bg-gold text-felt-900"
                          : enabled
                            ? "bg-black/25 text-emerald-50 hover:bg-black/40 border border-emerald-300/20"
                            : "bg-black/15 text-emerald-100/25 border border-transparent"
                      }`}
                    >
                      {a === "call" && scenario.bet > 0
                        ? `Call $${scenario.bet}`
                        : a}
                    </button>
                  );
                })}
              </div>
              {phase === "estimating" && (
                <p className="mt-2 text-xs text-emerald-100/45">
                  Lock in your estimate first.
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {/* RIGHT — hidden until both answers are in */}
      {phase === "revealed" && scenario && explanation ? (
        <RevealPanel
          quiz={{ ...quiz, scenario, explanation }}
          onNext={controls.nextHand}
        />
      ) : (
        <div className="panel p-6 h-full flex flex-col items-center justify-center text-center gap-2">
          <p className="eyebrow">Equity Readout</p>
          <p className="text-emerald-100/50 max-w-[24ch]">
            Hidden — make your read first.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reveal: verdicts + the worked math + the full lab readout
// ---------------------------------------------------------------------------

interface RevealProps {
  quiz: ReturnType<typeof useQuiz>[0] & {
    scenario: GradedScenario;
    explanation: Explanation;
  };
  onNext: () => void;
}

function Verdict({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-4 py-3 space-y-1.5"
      style={{
        background: ok ? "rgba(54,201,142,0.08)" : "rgba(224,85,107,0.08)",
        border: `1px solid ${ok ? JADE : ROSE}33`,
      }}
    >
      {children}
    </div>
  );
}

function VerdictHead({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className="text-sm font-semibold" style={{ color: ok ? JADE : ROSE }}>
      {ok ? "✓" : "✗"} {text}
    </p>
  );
}

function RevealPanel({ quiz, onNext }: RevealProps) {
  const { scenario, explanation } = quiz;
  const s = scenario;
  const chosenBand = ESTIMATE_BANDS.find((b) => b.id === quiz.estimateBandId);
  const trueBand = bandForEquity(s.equity);
  const multiplier = explanation.cardsToCome * 2; // 4 on the flop, 2 on the turn
  const outsPct = explanation.outsCount * multiplier;
  const isMade = explanation.currentHandName !== "High Card";
  const matched = 2 + s.callersAhead; // bet + your call + calls ahead of you
  const potAfter = s.pot + s.bet * matched;

  const estimateHow =
    explanation.outsCount > 0
      ? isMade
        ? `You already hold ${explanation.currentHand}, and ${explanation.outsCount} outs × ${multiplier} ≈ ${outsPct}% covers improving further. A made hand's equity is mostly it holding up as-is — read the outs number as a floor and estimate above it.`
        : `Count your outs: ${explanation.outsCount} cards improve you, and ${explanation.outsCount} × ${multiplier} ≈ ${outsPct}% to hit by the river (rule of ${multiplier}).`
      : isMade
        ? `No cards improve you further — your equity is entirely ${explanation.currentHand} holding up against ${s.liveOpponents === 1 ? "one random hand" : "two random hands"}.`
        : `You have no outs and no made hand — estimate low.`;

  const actionHow =
    s.bet > 0
      ? `Calling $${s.bet} wins a pot of $${s.pot} + ${matched} × $${s.bet} = $${potAfter} once everyone matches. Breakeven: ${s.bet}/${potAfter} = ${pct(s.breakeven)}.${
          s.callersAhead > 0 ? " The caller ahead of you improved your price." : ""
        } Your equity ${pct(s.equity)} is ${
          s.equity >= s.breakeven ? "above" : "below"
        } that → ${s.correctAction}.`
      : `There's no bet — checking is free. Folding would surrender your ${pct(
          s.equity
        )} share of the pot for nothing, so check.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <div className="panel p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="eyebrow">The verdict</p>
          <button onClick={onNext} className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-felt-900 hover:brightness-110 transition">
            Next hand
          </button>
        </div>

        <Verdict ok={!!quiz.estimateCorrect}>
          <VerdictHead
            ok={!!quiz.estimateCorrect}
            text={`Your estimate: ${chosenBand?.label ?? "—"} · true equity ${pct(
              s.equity
            )} (${trueBand.label})`}
          />
          <p className="text-sm text-emerald-100/75">{estimateHow}</p>
        </Verdict>

        <Verdict ok={!!quiz.actionCorrect}>
          <VerdictHead
            ok={!!quiz.actionCorrect}
            text={`You chose ${quiz.chosenAction} · correct play: ${s.correctAction}`}
          />
          <p className="text-sm text-emerald-100/75">{actionHow}</p>
        </Verdict>
      </div>

      <ResultsPanel
        state={{
          result: s.equityResult,
          explanation,
          outCards: new Set(explanation.outs.map((o) => o.card)),
          computing: false,
        }}
      />
    </motion.div>
  );
}
