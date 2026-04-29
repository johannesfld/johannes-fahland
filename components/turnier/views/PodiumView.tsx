"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { StandingRow } from "@/components/turnier/types";
import { actionBtn } from "@/components/turnier/styles";

type PodiumViewProps = {
  standings: StandingRow[];
  onShowTable: () => void;
};

export function PodiumView({ standings, onShowTable }: PodiumViewProps) {
  const [step, setStep] = useState(0);
  const podium = standings.slice(0, 3);
  const third = podium[2];
  const second = podium[1];
  const first = podium[0];

  useEffect(() => {
    const t1 = window.setTimeout(() => setStep(1), 400);
    const t2 = window.setTimeout(() => setStep(2), 1800);
    const t3 = window.setTimeout(() => setStep(3), 3200);
    const t4 = window.setTimeout(() => setStep(4), 4800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, []);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col items-center justify-end overflow-hidden rounded-3xl border border-amber-300/40 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(251,191,36,0.22),transparent_45%)]" />
      <h2 className="absolute top-6 text-center text-xl font-black tracking-tighter text-amber-300 sm:text-3xl">
        Siegerehrung
      </h2>

      <div className="relative z-10 mt-auto grid w-full max-w-4xl grid-cols-3 items-end gap-2 sm:gap-4">
        <PodiumCard
          visible={step >= 1}
          heightClass="h-28 sm:h-36"
          tone="from-amber-700 to-amber-900"
          place="3."
          name={third?.name ?? "-"}
        />
        <PodiumCard
          visible={step >= 3}
          heightClass="h-40 sm:h-52"
          tone="from-amber-400 to-amber-600"
          place="1."
          name={first?.name ?? "-"}
          champion
        />
        <PodiumCard
          visible={step >= 2}
          heightClass="h-34 sm:h-44"
          tone="from-zinc-300 to-zinc-500"
          place="2."
          name={second?.name ?? "-"}
        />
      </div>

      {step >= 4 ? (
        <button type="button" className={`${actionBtn} z-10 mt-6`} onClick={onShowTable}>
          Tabelle anzeigen
        </button>
      ) : null}
    </section>
  );
}

function PodiumCard({
  visible,
  heightClass,
  tone,
  place,
  name,
  champion = false,
}: {
  visible: boolean;
  heightClass: string;
  tone: string;
  place: string;
  name: string;
  champion?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80, scale: 0.9 }}
      animate={
        visible
          ? { opacity: 1, y: 0, scale: champion ? 1.04 : 1 }
          : { opacity: 0, y: 80, scale: 0.9 }
      }
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`overflow-hidden rounded-t-3xl border border-white/15 bg-gradient-to-b ${tone} p-3 text-center shadow-xl`}
    >
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/80">{place} Platz</p>
      <p className="mt-1 truncate text-sm font-black tracking-tight text-white sm:text-lg">{name}</p>
      <div className={`${heightClass} mt-2`} />
    </motion.div>
  );
}
