import { motion } from "framer-motion";
import { EquityState } from "./useEquity";
import { PlayingCard } from "./PlayingCard";

const JADE = "#36c98e";
const AMBER = "#e0b341";
const ROSE = "#e0556b";

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

/** The equity readout: big instrument-style number, segmented bar, coaching. */
export function ResultsPanel({ state }: { state: EquityState }) {
  const { result, explanation, computing } = state;

  if (!result || !explanation) {
    return (
      <div className="panel p-6 h-full flex flex-col items-center justify-center text-center">
        <p className="eyebrow mb-2">Equity Readout</p>
        <p className="text-emerald-100/50 max-w-[22ch]">
          Pick your two hole cards to read the table.
        </p>
      </div>
    );
  }

  const segments = [
    { label: "Win", value: result.win, color: JADE },
    { label: "Tie", value: result.tie, color: AMBER },
    { label: "Lose", value: result.loss, color: ROSE },
  ];

  return (
    <div className="panel p-6 h-full flex flex-col gap-5">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Equity Readout</p>
        <span className="text-[10px] font-mono text-emerald-200/40">
          {result.exact
            ? "exact"
            : `${(result.samples / 1000).toFixed(0)}k sims`}
          {computing ? " · updating…" : ""}
        </span>
      </div>

      {/* Hero number */}
      <div className="flex items-end gap-3">
        <motion.span
          key={pct(result.win + result.tie)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono font-bold leading-none"
          style={{ fontSize: 64, color: JADE }}
        >
          {pct(result.win)}
        </motion.span>
        <span className="text-emerald-100/60 mb-2 text-sm">
          to win{result.tie > 0.0005 ? ` · ${pct(result.tie)} tie` : ""}
        </span>
      </div>

      {/* Segmented equity bar */}
      <div>
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-black/30">
          {segments.map((s) => (
            <motion.div
              key={s.label}
              className="h-full"
              style={{ background: s.color }}
              initial={false}
              animate={{ width: `${Math.max(0, s.value) * 100}%` }}
              transition={{ type: "spring", stiffness: 160, damping: 24 }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-mono">
          {segments.map((s) => (
            <span key={s.label} style={{ color: s.color }}>
              {s.label} {pct(s.value)}
            </span>
          ))}
        </div>
      </div>

      {/* Current hand */}
      <div className="rounded-xl bg-black/20 px-4 py-3">
        <p className="eyebrow mb-1">You currently have</p>
        <p className="display text-xl text-emerald-50">
          {explanation.currentHand}
          <span className="text-emerald-200/50 text-sm font-sans">
            {" "}
            · {explanation.currentHandName}
          </span>
        </p>
      </div>

      {/* Outs visualizer */}
      {explanation.outs.length > 0 && (
        <div>
          <p className="eyebrow mb-2">
            Your outs · {explanation.outsCount} cards
          </p>
          <div className="flex flex-wrap gap-1.5">
            {explanation.outs.map((o) => (
              <PlayingCard key={o.card} card={o.card} size="sm" glow />
            ))}
          </div>
        </div>
      )}

      {/* Coaching notes */}
      <div className="mt-auto space-y-1.5 border-t border-emerald-300/10 pt-4">
        {explanation.notes.map((n, i) => (
          <p key={i} className="text-sm text-emerald-100/70 flex gap-2">
            <span className="text-gold">›</span>
            <span>{n}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
