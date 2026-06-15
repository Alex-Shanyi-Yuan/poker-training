import { motion } from "framer-motion";
import { Card, rankOf, suitOf, SUIT_SYMBOL, Suit } from "../engine/cards";

const RED: Suit[] = ["h", "d"];

function suitColor(suit: Suit): string {
  return RED.includes(suit) ? "#d8434f" : "#1b2a24";
}

export type CardSize = "sm" | "md" | "lg";

const DIMENSIONS: Record<CardSize, { w: number; h: number; rank: number; pip: number }> = {
  sm: { w: 38, h: 54, rank: 13, pip: 18 },
  md: { w: 56, h: 80, rank: 18, pip: 30 },
  lg: { w: 76, h: 108, rank: 24, pip: 44 },
};

interface PlayingCardProps {
  card: Card;
  size?: CardSize;
  /** Dim taken cards in the deck. */
  dimmed?: boolean;
  /** Highlight as an "out" — glows gold. */
  glow?: boolean;
  onClick?: () => void;
  title?: string;
}

/** A single face-up playing card, rendered from scratch for a crisp, custom look. */
export function PlayingCard({
  card,
  size = "md",
  dimmed,
  glow,
  onClick,
  title,
}: PlayingCardProps) {
  const r = rankOf(card);
  const s = suitOf(card);
  const color = suitColor(s);
  const d = DIMENSIONS[size];
  const label = r === "T" ? "10" : r;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      title={title}
      disabled={!onClick}
      layout
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: dimmed ? 0.28 : 1,
        boxShadow: glow
          ? "0 0 0 2px rgba(232,198,106,0.9), 0 0 18px rgba(232,198,106,0.55)"
          : "0 5px 14px rgba(0,0,0,0.45)",
      }}
      whileHover={onClick ? { y: -4, scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      style={{
        width: d.w,
        height: d.h,
        background: "linear-gradient(160deg, #fbf8ef 0%, #ece4d2 100%)",
        borderRadius: Math.round(d.w * 0.14),
        border: "1px solid rgba(0,0,0,0.18)",
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        padding: 0,
        flex: "0 0 auto",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: 5,
          lineHeight: 1,
          color,
          fontFamily: "JetBrains Mono, monospace",
          fontWeight: 700,
          fontSize: d.rank,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {label}
        <span style={{ fontSize: d.rank * 0.85 }}>{SUIT_SYMBOL[s]}</span>
      </span>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          fontSize: d.pip,
        }}
      >
        {SUIT_SYMBOL[s]}
      </span>
    </motion.button>
  );
}

interface EmptySlotProps {
  label: string;
  active?: boolean;
  size?: CardSize;
  onClick?: () => void;
}

/** A placeholder for a card not yet chosen. */
export function EmptySlot({ label, active, size = "md", onClick }: EmptySlotProps) {
  const d = DIMENSIONS[size];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: d.w,
        height: d.h,
        borderRadius: Math.round(d.w * 0.14),
        border: active
          ? "2px dashed rgba(232,198,106,0.9)"
          : "2px dashed rgba(150,190,170,0.28)",
        background: active ? "rgba(232,198,106,0.08)" : "rgba(255,255,255,0.02)",
        color: active ? "rgba(232,198,106,0.9)" : "rgba(170,200,185,0.5)",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: onClick ? "pointer" : "default",
        transition: "all 120ms ease",
        flex: "0 0 auto",
      }}
    >
      {label}
    </button>
  );
}
