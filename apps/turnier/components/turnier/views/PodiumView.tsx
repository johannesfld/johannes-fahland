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
    <section className="relative flex min-h-[26rem] flex-1 flex-col items-center justify-end overflow-hidden rounded-2xl border border-[var(--vibe-line-strong)] bg-gradient-to-b from-[#16110D] via-[#241A12] to-[#16110D] p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(224,135,94,0.30),transparent_48%)]" />
      <h2 className="absolute top-5 font-display text-2xl font-medium tracking-tight text-[#F3E9DC] sm:top-6 sm:text-4xl">
        Siegerehrung
      </h2>

      <div className="relative z-10 mt-auto grid w-full max-w-4xl grid-cols-3 items-end gap-2 sm:gap-4">
        <PodiumCard
          visible={step >= 1}
          heightClass="h-[clamp(4rem,14vh,9rem)]"
          tone="from-[#9A6A3C] to-[#5E3F22]"
          place="3."
          name={third?.name ?? "-"}
        />
        <PodiumCard
          visible={step >= 3}
          heightClass="h-[clamp(6rem,22vh,13rem)]"
          tone="from-[#E7B84F] to-[#B07A14]"
          place="1."
          name={first?.name ?? "-"}
          champion
        />
        <PodiumCard
          visible={step >= 2}
          heightClass="h-[clamp(5rem,18vh,11rem)]"
          tone="from-[#D7D2C6] to-[#9A958A]"
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
      className={`overflow-hidden rounded-t-2xl border border-black/10 bg-gradient-to-b ${tone} p-3 text-center shadow-xl`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/70">{place} Platz</p>
      <p className="mt-1 truncate font-display text-sm font-semibold tracking-tight text-black/90 sm:text-lg">
        {name}
      </p>
      <div className={`${heightClass} mt-2`} />
    </motion.div>
  );
}
