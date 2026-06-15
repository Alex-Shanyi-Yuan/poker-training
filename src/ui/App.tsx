import { useMemo, useState } from "react";
import { Card, RANKS, SUITS } from "../engine/cards";
import { PlayingCard, EmptySlot } from "./PlayingCard";
import { ResultsPanel } from "./ResultsPanel";
import { useEquity } from "./useEquity";

type Zone = "hero" | "board";

const HERO_LABELS = ["Card 1", "Card 2"];
const BOARD_LABELS = ["Flop", "Flop", "Flop", "Turn", "River"];

export function App() {
  const [hero, setHero] = useState<Card[]>([]);
  const [board, setBoard] = useState<Card[]>([]);
  const [opponents, setOpponents] = useState(1);
  const [active, setActive] = useState<Zone>("hero");

  const used = useMemo(() => new Set([...hero, ...board]), [hero, board]);
  const equity = useEquity({ hero, board, randomOpponents: opponents });

  function placeCard(card: Card) {
    if (used.has(card)) return;
    // Functional updaters so no card is dropped even if clicks arrive faster
    // than React re-renders.
    const toHero = () =>
      setHero((h) => (h.length < 2 && !h.includes(card) ? [...h, card] : h));
    const toBoard = () =>
      setBoard((b) => (b.length < 5 && !b.includes(card) ? [...b, card] : b));

    if (active === "hero" && hero.length < 2) {
      toHero();
      if (hero.length + 1 >= 2) setActive("board"); // auto-advance to the board
    } else if (active === "board" && board.length < 5) {
      toBoard();
    } else if (hero.length < 2) {
      toHero();
    } else {
      toBoard();
    }
  }

  function removeHero(i: number) {
    setHero(hero.filter((_, idx) => idx !== i));
    setActive("hero");
  }
  function removeBoard(i: number) {
    setBoard(board.filter((_, idx) => idx !== i));
    setActive("board");
  }
  function clearAll() {
    setHero([]);
    setBoard([]);
    setActive("hero");
  }

  return (
    <div className="min-h-full mx-auto max-w-6xl px-5 py-8">
      {/* Header */}
      <header className="mb-8 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-1">No-Limit Texas Hold'em · Trainer</p>
          <h1 className="display text-4xl sm:text-5xl font-semibold text-emerald-50 leading-none">
            Equity Lab
          </h1>
          <p className="mt-2 text-emerald-100/55 max-w-[42ch] text-sm">
            Read any spot: your live chance to win, the hand you hold, and the
            cards that improve it — so you learn the <em>why</em>, not just the
            number.
          </p>
        </div>
        <button
          onClick={clearAll}
          className="rounded-full border border-emerald-300/20 px-4 py-2 text-sm text-emerald-100/80 hover:border-gold/60 hover:text-gold transition-colors"
        >
          Clear table
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* LEFT — the table */}
        <section className="panel p-6 flex flex-col gap-7">
          {/* Hero + board zones */}
          <Zone
            title="Your hand"
            zone="hero"
            cards={hero}
            labels={HERO_LABELS}
            slots={2}
            active={active}
            setActive={setActive}
            onRemove={removeHero}
          />
          <Zone
            title="Community board"
            zone="board"
            cards={board}
            labels={BOARD_LABELS}
            slots={5}
            active={active}
            setActive={setActive}
            onRemove={removeBoard}
          />

          {/* Opponents */}
          <div>
            <p className="eyebrow mb-2">Opponents in the hand</p>
            <div className="flex gap-1.5">
              {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setOpponents(n)}
                  className={`h-9 w-9 rounded-lg font-mono text-sm transition-all ${
                    opponents === n
                      ? "bg-gold text-felt-900 font-bold"
                      : "bg-black/25 text-emerald-100/60 hover:bg-black/40"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Deck */}
          <div>
            <p className="eyebrow mb-3">
              Deck · click a card to place it{" "}
              <span className="text-gold/80">
                ({active === "hero" ? "→ your hand" : "→ the board"})
              </span>
            </p>
            <Deck used={used} outs={equity.outCards} onPick={placeCard} />
          </div>
        </section>

        {/* RIGHT — readout */}
        <ResultsPanel state={equity} />
      </div>

      <footer className="mt-8 text-center text-xs text-emerald-200/30 font-mono">
        Equity Lab · step 1 of the road to mastery — next up: pot odds & ranges
      </footer>
    </div>
  );
}

interface ZoneProps {
  title: string;
  zone: Zone;
  cards: Card[];
  labels: string[];
  slots: number;
  active: Zone;
  setActive: (z: Zone) => void;
  onRemove: (i: number) => void;
}

function Zone({ title, zone, cards, labels, slots, active, setActive, onRemove }: ZoneProps) {
  const isActive = active === zone;
  return (
    <div>
      <button
        onClick={() => setActive(zone)}
        className="eyebrow mb-2 flex items-center gap-2"
        style={{ color: isActive ? "#e8c66a" : undefined }}
      >
        {title}
        {isActive && <span className="text-[9px]">● active</span>}
      </button>
      <div className="flex gap-2">
        {Array.from({ length: slots }).map((_, i) => {
          const card = cards[i];
          const nextEmpty = i === cards.length;
          return card ? (
            <PlayingCard
              key={`${zone}-${i}`}
              card={card}
              size="md"
              onClick={() => onRemove(i)}
              title="Remove"
            />
          ) : (
            <EmptySlot
              key={`${zone}-empty-${i}`}
              label={labels[i]}
              active={isActive && nextEmpty}
              onClick={() => setActive(zone)}
            />
          );
        })}
      </div>
    </div>
  );
}

function Deck({
  used,
  outs,
  onPick,
}: {
  used: Set<Card>;
  outs: Set<Card>;
  onPick: (c: Card) => void;
}) {
  // 4 suit rows × 13 rank columns — a clean instrument grid, high ranks last.
  const deck: Card[] = SUITS.flatMap((s) => RANKS.map((r) => `${r}${s}`));
  return (
    <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5">
      {deck.map((card) => {
        const isUsed = used.has(card);
        return (
          <PlayingCard
            key={card}
            card={card}
            size="sm"
            dimmed={isUsed}
            glow={!isUsed && outs.has(card)}
            onClick={isUsed ? undefined : () => onPick(card)}
            title={isUsed ? "Already on the table" : undefined}
          />
        );
      })}
    </div>
  );
}
