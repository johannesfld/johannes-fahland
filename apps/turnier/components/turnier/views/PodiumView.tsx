"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, Table2 } from "lucide-react";
import type { StandingRow } from "@/components/turnier/types";
import { actionBtn, subtleBtn } from "@/components/turnier/styles";
import { cn } from "@/components/ui/styles";

type PodiumViewProps = {
  standings: StandingRow[];
  onShowTable: () => void;
};

export function PodiumView({ standings, onShowTable }: PodiumViewProps) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? 4 : 0);
  const podium = standings.slice(0, 3);
  const third = podium[2];
  const second = podium[1];
  const first = podium[0];

  useEffect(() => {
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(4);
      return;
    }
    // Schneller als zuvor; Skip ist ohnehin sofort verfügbar.
    const t1 = window.setTimeout(() => setStep(1), 250);
    const t2 = window.setTimeout(() => setStep(2), 900);
    const t3 = window.setTimeout(() => setStep(3), 1550);
    const t4 = window.setTimeout(() => setStep(4), 2200);
    return () => {
      [t1, t2, t3, t4].forEach(window.clearTimeout);
    };
  }, [reduce]);

  const finished = step >= 4;

  return (
    <section className="relative flex min-h-[26rem] flex-1 flex-col items-center justify-end overflow-hidden rounded-[var(--vibe-r-2xl)] border border-[var(--vibe-line)] bg-[var(--vibe-bg-tinted)] p-4 shadow-[var(--vibe-shadow-clay)] sm:p-6">
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--accent-glow)" }} />

      {/* Konfetti (reines CSS) — nur wenn fertig & Motion erlaubt */}
      {finished && !reduce ? <Confetti /> : null}

      {/* Skip / „Tabelle" — SOFORT sichtbar, kein Zwang abzuwarten */}
      <button
        type="button"
        onClick={onShowTable}
        className={cn(subtleBtn, "absolute right-4 top-4 z-20 !min-h-10 !px-3 !py-1.5 text-xs")}
        aria-label="Siegerehrung überspringen, Tabelle anzeigen"
      >
        Überspringen
      </button>

      <h2 className="absolute left-4 top-4 z-10 font-display text-2xl font-extrabold tracking-tight text-[var(--vibe-fg-base)] sm:left-6 sm:top-6 sm:text-3xl">
        Siegerehrung
      </h2>

      <div className="relative z-10 mt-auto grid w-full max-w-3xl grid-cols-3 items-end gap-2 sm:gap-4">
        <PodiumCard
          visible={step >= 1}
          heightClass="h-[clamp(4rem,13vh,8rem)]"
          tone="bg-[var(--sky-soft)] text-[var(--vibe-fg-base)] ring-[var(--sky)]/40"
          accent="bg-[var(--sky)]"
          place="3"
          name={third?.name ?? "–"}
          reduce={!!reduce}
        />
        <PodiumCard
          visible={step >= 3}
          heightClass="h-[clamp(6rem,21vh,12rem)]"
          tone="bg-[var(--accent-soft)] text-[var(--vibe-fg-base)] ring-[var(--accent)]/50"
          accent="bg-[var(--accent)]"
          place="1"
          name={first?.name ?? "–"}
          champion
          reduce={!!reduce}
        />
        <PodiumCard
          visible={step >= 2}
          heightClass="h-[clamp(5rem,17vh,10rem)]"
          tone="bg-[var(--mint-soft)] text-[var(--vibe-fg-base)] ring-[var(--mint)]/40"
          accent="bg-[var(--mint)]"
          place="2"
          name={second?.name ?? "–"}
          reduce={!!reduce}
        />
      </div>

      <motion.button
        type="button"
        className={cn(actionBtn, "z-10 mt-6 gap-2")}
        onClick={onShowTable}
        initial={false}
        animate={{ opacity: finished ? 1 : 0, y: finished ? 0 : 12 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ pointerEvents: finished ? "auto" : "none" }}
      >
        <Table2 className="h-4 w-4" strokeWidth={2.4} />
        Tabelle anzeigen
      </motion.button>
    </section>
  );
}

function PodiumCard({
  visible,
  heightClass,
  tone,
  accent,
  place,
  name,
  champion = false,
  reduce,
}: {
  visible: boolean;
  heightClass: string;
  tone: string;
  accent: string;
  place: string;
  name: string;
  champion?: boolean;
  reduce: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 70, scale: 0.85 }}
      animate={
        visible
          ? { opacity: 1, y: 0, scale: champion ? 1.04 : 1 }
          : { opacity: 0, y: 70, scale: 0.85 }
      }
      transition={
        reduce
          ? { duration: 0.2 }
          : { type: "spring", stiffness: 320, damping: 16, mass: 0.8 }
      }
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-t-[var(--vibe-r-2xl)] p-3 text-center shadow-[var(--vibe-shadow-clay)] ring-2",
        tone,
      )}
    >
      {champion ? (
        <Crown className="mb-1 h-6 w-6 text-[var(--accent)]" strokeWidth={2.2} aria-hidden />
      ) : null}
      <span
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold text-white",
          accent,
        )}
      >
        {place}
      </span>
      <p className="mt-2 line-clamp-2 font-display text-sm font-extrabold tracking-tight sm:text-lg">
        {name}
      </p>
      <div className={cn(heightClass, "mt-2 w-full")} />
    </motion.div>
  );
}

/** Leichtes CSS-Konfetti — keine zusätzliche Dependency. */
function Confetti() {
  const colors = ["var(--accent)", "var(--mint)", "var(--sky)", "var(--warn)"];
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {pieces.map((i) => {
        const left = (i * 37) % 100;
        const delay = (i % 7) * 0.18;
        const dur = 2.4 + ((i % 5) * 0.4);
        const size = 6 + (i % 3) * 3;
        return (
          <span
            key={i}
            className="absolute top-0 block animate-[turnier-confetti-fall_var(--d)_ease-in_var(--delay)_infinite]"
            style={
              {
                left: `${left}%`,
                width: size,
                height: size * 1.6,
                borderRadius: 2,
                background: colors[i % colors.length],
                "--d": `${dur}s`,
                "--delay": `${delay}s`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
